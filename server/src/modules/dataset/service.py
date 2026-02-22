from typing import List
from uuid import UUID

import pandas as pd
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.common.logging.logger import log_execution
from src.modules.auth.service import AuthService
from src.modules.dataset.schema import (
    DatasetBase,
    DatasetCleanRequest,
    DatasetRequest,
    DatasetResponse,
    DatasetTransformRequest,
)
from src.modules.dataset.store.repository import DatasetRepository
from src.modules.file.service import FileService


class DatasetService:
    def __init__(self):
        self.repo = DatasetRepository()
        self.file_service = FileService(dir="/uploads/datasets")
        self.auth_service = AuthService()

    @log_execution
    def create_dataset(self, db: Session, data: DatasetRequest, user_id: UUID) -> DatasetResponse:
        # File was already uploaded via POST /file — just look it up
        file_orm = self.file_service.get_file_by_id(db=db, id=data.file_id)
        # Convert ORM object → Pydantic FileBase (ORM mode)
        from src.modules.file.schema import FileBase as FileBaseSchema

        file = FileBaseSchema.model_validate(file_orm, from_attributes=True)

        # Compute row/column counts from the actual file
        try:
            metadata = self.get_dataset_params_details(db=db, file_id=file_orm.id)
            rows = metadata.get("shape", {}).get("rows", data.rows)
            columns = metadata.get("shape", {}).get("columns", data.columns)
        except Exception:
            metadata = data.dataset_metadata
            rows = data.rows
            columns = data.columns

        from datetime import datetime, timezone
        from uuid import uuid4

        now = datetime.now(timezone.utc)
        dataset = self.repo.create(
            db=db,
            obj_in=DatasetBase(
                id=uuid4(),
                name=data.name,
                description=data.description,
                file_id=file.id,
                rows=rows,
                columns=columns,
                dataset_metadata=metadata,
                user_id=user_id,
                parent_id=None,
                version="1.0",
                created_at=now,
                updated_at=now,
                file=file,
            ).model_dump(exclude={"file", "created_at", "updated_at"}),
        )
        return dataset

    @log_execution
    def get_dataset(self, db: Session, dataset_id: UUID):
        dataset = self.repo.get_by_id(db=db, id=dataset_id)
        return dataset

    @log_execution
    def refresh_dataset_metadata(self, db: Session, dataset_id: UUID, user_id: UUID):
        """Recompute rows, columns, and dataset_metadata from the physical file."""
        dataset = self.repo.get_by_id(db=db, id=dataset_id)
        if dataset.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        metadata = self.get_dataset_params_details(db=db, file_id=dataset.file_id)
        dataset.rows = metadata["shape"]["rows"]
        dataset.columns = metadata["shape"]["columns"]
        dataset.dataset_metadata = metadata
        db.commit()
        db.refresh(dataset)
        return dataset

    @log_execution
    def get_datasets(self, db: Session, user_id: UUID) -> List[DatasetResponse]:
        return self.repo.get(db=db, filters={"user_id": user_id})

    @log_execution
    def update_dataset(
        self, db: Session, dataset_id: UUID, data: DatasetRequest, user_id: UUID
    ) -> DatasetResponse:
        dataset = self.repo.get_by_id(db=db, id=dataset_id)
        if dataset.user_id != user_id:
            raise HTTPException(
                status_code=403, detail="You are not authorized to update this dataset"
            )
        dataset = self.repo.update(db=db, obj_in=data, db_obj=dataset)
        return DatasetResponse(**dataset)

    @log_execution
    def delete_dataset(self, db: Session, dataset_id: UUID, user_id: UUID):
        dataset = self.repo.get_by_id(db=db, id=dataset_id)
        if dataset.user_id != user_id:
            raise HTTPException(
                status_code=403, detail="You are not authorized to delete this dataset"
            )
        file = self.file_service.get_file_by_id(db=db, id=dataset.file_id)
        # Prevent deletion if the dataset has children? Or just cascade.
        self.file_service.delete_file(db=db, data=file)
        return self.repo.delete(db=db, id=dataset_id)

    @log_execution
    def get_dataset_versions(
        self, db: Session, dataset_id: UUID, user_id: UUID
    ) -> List[DatasetResponse]:
        dataset = self.get_dataset(db=db, dataset_id=dataset_id)
        if dataset.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # If it has a parent, use the parent's ID as the root to find all siblings.
        root_id = dataset.parent_id if dataset.parent_id else dataset.id

        # We fetch the root dataset and all datasets where parent_id = root_id
        from sqlalchemy import or_

        datasets = (
            db.query(self.repo.model)
            .filter(or_(self.repo.model.id == root_id, self.repo.model.parent_id == root_id))
            .all()
        )
        return datasets

    @log_execution
    def _load_dataframe(self, db: Session, file_id: UUID):
        file = self.file_service.get_file_by_id(db=db, id=file_id)
        import os

        loc = file.location
        if not os.path.exists(loc):
            loc = os.path.join(os.getcwd(), loc.lstrip("/"))
        if not os.path.exists(loc):
            raise HTTPException(status_code=404, detail="Physical file not found")

        if file.file_type == "csv":
            return pd.read_csv(loc), file, loc
        elif file.file_type in ["xls", "xlsx"]:
            return pd.read_excel(loc), file, loc
        raise HTTPException(status_code=400, detail="Unsupported file format")

    @log_execution
    def _save_new_dataset_version(
        self,
        db: Session,
        df: pd.DataFrame,
        parent_dataset: DatasetBase,
        user_id: UUID,
        operation: str,
    ) -> DatasetResponse:
        import os
        from uuid import uuid4

        # Calculate new semantic version based on parent
        try:
            old_major, old_minor = map(int, str(parent_dataset.version).split("."))
            new_version = f"{old_major}.{old_minor + 1}"
        except Exception:
            new_version = "1.1"  # Fallback if parsing fails

        # Save to disk
        new_filename = f"{parent_dataset.name}_v{new_version}_{operation}_{uuid4().hex[:8]}.csv"
        upload_dir = self.file_service.dir.lstrip("/")
        os.makedirs(upload_dir, exist_ok=True)
        new_loc = os.path.join(upload_dir, new_filename)

        df.to_csv(new_loc, index=False)

        # Create file record
        file_obj = self.file_service.repo.create(
            db=db,
            obj_in={
                "name": new_filename,
                "size": str(os.path.getsize(new_loc)),
                "location": new_loc,
                "file_type": "csv",
                "category": "dataset",
                "user_id": user_id,
            },
        )

        # Create dataset record
        new_dataset = self.repo.create(
            db=db,
            obj_in=DatasetBase(
                id=uuid4(),
                name=f"{parent_dataset.name} ({operation})",
                description=parent_dataset.description,
                file_id=file_obj.id,
                rows=df.shape[0],
                columns=df.shape[1],
                dataset_metadata=self.get_dataset_params_details(db=db, file_id=file_obj.id),
                user_id=user_id,
                parent_id=parent_dataset.id,
                version=new_version,
                created_at=pd.Timestamp.utcnow(),
                updated_at=pd.Timestamp.utcnow(),
                file=file_obj,  # Bypassing strictly using object maps, as the repo mapping works based on DB fields
            ).model_dump(
                exclude={"file", "created_at", "updated_at"}
            ),  # remove relations / dates for DB insert
        )
        return new_dataset

    @log_execution
    def clean_dataset(
        self, db: Session, dataset_id: UUID, data: DatasetCleanRequest, user_id: UUID
    ):

        dataset = self.get_dataset(db=db, dataset_id=dataset_id)
        if dataset.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        df, file_obj, loc = self._load_dataframe(db=db, file_id=dataset.file_id)

        cols = data.columns if data.columns else df.columns
        for c in cols:
            if c not in df.columns:
                continue

            if data.strategy == "drop_nulls":
                df = df.dropna(subset=[c])
            elif data.strategy == "fill_mean":
                if pd.api.types.is_numeric_dtype(df[c]):
                    df[c] = df[c].fillna(df[c].mean())
            elif data.strategy == "fill_median":
                if pd.api.types.is_numeric_dtype(df[c]):
                    df[c] = df[c].fillna(df[c].median())

        return self._save_new_dataset_version(db, df, dataset, user_id, "cleaned")

    @log_execution
    def transform_dataset(
        self, db: Session, dataset_id: UUID, data: DatasetTransformRequest, user_id: UUID
    ):
        from sklearn.preprocessing import LabelEncoder, MinMaxScaler, StandardScaler

        dataset = self.get_dataset(db=db, dataset_id=dataset_id)
        if dataset.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        df, file_obj, loc = self._load_dataframe(db=db, file_id=dataset.file_id)

        cols = data.columns if data.columns else df.columns
        for c in cols:
            if c not in df.columns:
                continue

            if data.strategy == "standard_scaler":
                if pd.api.types.is_numeric_dtype(df[c]):
                    df[c] = StandardScaler().fit_transform(df[[c]])
            elif data.strategy == "min_max_scaler":
                if pd.api.types.is_numeric_dtype(df[c]):
                    df[c] = MinMaxScaler().fit_transform(df[[c]])
            elif data.strategy == "label_encoder":
                df[c] = LabelEncoder().fit_transform(df[c].astype(str))

        return self._save_new_dataset_version(db, df, dataset, user_id, "transformed")

    @log_execution
    def get_dataset_params_details(self, db: Session, file_id: UUID):
        import os

        file = self.file_service.get_file_by_id(db=db, id=file_id)

        # Resolve the path the same way as _load_dataframe — handle leading slash on Windows
        loc = file.location
        if not os.path.exists(loc):
            loc = os.path.join(os.getcwd(), loc.lstrip("/").lstrip("\\"))
        if not os.path.exists(loc):
            raise HTTPException(status_code=404, detail=f"Physical file not found: {file.location}")

        if file.file_type == "csv":
            dataset = pd.read_csv(loc)
        elif file.file_type in ["xls", "xlsx"]:
            dataset = pd.read_excel(loc)
        else:
            raise HTTPException(
                status_code=400, detail=f"Unsupported file format: {file.file_type}"
            )

        return {
            "shape": {
                "rows": dataset.shape[0],
                "columns": dataset.shape[1],
            },
            "dtypes": dataset.dtypes.astype(str).to_dict(),
            "missing_values": dataset.isnull().sum().to_dict(),
            "missing_percentage": (dataset.isnull().mean() * 100).round(2).to_dict(),
            "statistics": dataset.describe().to_dict(),
            "unique_values": dataset.nunique().to_dict(),
            "preview": dataset.head(5).to_dict(orient="records"),
        }

    @log_execution
    def get_dataset_columns(self, db: Session, dataset_id: UUID):
        dataset = self.repo.get_by_id(db=db, id=dataset_id)
        file = self.file_service.get_file(db=db, file_id=dataset.file_id)
        if file.file_type == "csv":
            dataset = pd.read_csv(file.location)
        elif file.file_type == "xlsx":
            dataset = pd.read_excel(file.location)
        return dataset.columns.tolist()

    @log_execution
    def get_dataset_columns_details(self, db: Session, dataset_id: UUID):
        dataset = self.repo.get_by_id(db=db, id=dataset_id)
        file = self.file_service.get_file(db=db, file_id=dataset.file_id)
        if file.file_type == "csv":
            dataset = pd.read_csv(file.location)
        elif file.file_type == "xlsx":
            dataset = pd.read_excel(file.location)
        return dataset.dtypes.astype(str).to_dict()

    @log_execution
    def visualization_dataset(self, db: Session, dataset_id: UUID):
        dataset = self.repo.get_by_id(db=db, id=dataset_id)
        file = self.file_service.get_file(db=db, file_id=dataset.file_id)
        if file.file_type == "csv":
            dataset = pd.read_csv(file.location)
        elif file.file_type == "xlsx":
            dataset = pd.read_excel(file.location)
        return dataset.hist().to_dict()

    @log_execution
    def correlation_matrix(self, db: Session, dataset_id: UUID):
        dataset = self.repo.get_by_id(db=db, id=dataset_id)
        file = self.file_service.get_file(db=db, file_id=dataset.file_id)
        if file.file_type == "csv":
            dataset = pd.read_csv(file.location)
        elif file.file_type == "xlsx":
            dataset = pd.read_excel(file.location)
        return dataset.corr().to_dict()
