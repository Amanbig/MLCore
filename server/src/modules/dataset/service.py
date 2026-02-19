from typing import List
from sqlalchemy.orm import Session
from src.modules.dataset.schema import DatasetRequest, DatasetResponse
from src.modules.dataset.store.repository import DatasetRepository
from src.modules.file.service import FileService
from src.modules.auth.service import AuthService
from src.modules.auth.schema import AuthToken
from uuid import UUID
import pandas as pd
import numpy as np


class DatasetService:
    def __init__(self):
        self.repo = DatasetRepository()
        self.file_service = FileService(dir="/uploads")
        self.auth_service = AuthService()

    def create_dataset(self, db: Session, data: DatasetRequest, user_id: UUID) -> DatasetResponse:
        file = self.file_service.create_file(db=db, **data.model_dump())
        self.repo.create(
            db=db,
            obj_in=DatasetRequest(**data.model_dump(), user_id=user_id, file_id=file.id, metadata=self.get_dataset_params_details(db=db, file_id=file.id)),
        )

    def get_dataset(self, db: Session, dataset_id: int) -> DatasetResponse:
        return self.repo.get(db=db, id=dataset_id)

    def get_datasets(self, db: Session, user_id: UUID) -> List[DatasetResponse]:
        return self.repo.get_all(db=db, filters={"user_id": user_id})

    def update_dataset(
        self, db: Session, dataset_id: int, data: DatasetRequest, user_id: UUID
    ) -> DatasetResponse:
        dataset = self.repo.get(db=db, id=dataset_id)
        if dataset.user_id != user_id:
            raise HTTPException(
                status_code=403, detail="You are not authorized to update this dataset"
            )
        return self.repo.update(db=db, id=dataset_id, obj_in=data)

    def delete_dataset(self, db: Session, dataset_id: int, user_id: UUID) -> DatasetResponse:
        dataset = self.repo.get(db=db, id=dataset_id)
        if dataset.user_id != user_id:
            raise HTTPException(
                status_code=403, detail="You are not authorized to delete this dataset"
            )
        file = self.file_service.get_file(db=db, file_id=dataset.file_id)
        self.file_service.delete_file(db=db, file_id=file.id)
        return self.repo.delete(db=db, id=dataset_id)

    
    def get_dataset_params_details(self, db: Session, file_id: UUID):
        file = self.file_service.get_file(db=db, file_id=file_id)
        if file.file_type == "csv":
            dataset = pd.read_csv(file.location)
        elif file.file_type == "xlsx":
            dataset = pd.read_excel(file.location)

        numeric_cols = dataset.select_dtypes(include="number").columns.tolist()
        categorical_cols = dataset.select_dtypes(exclude="number").columns.tolist()

        return {
            "shape": {
                "rows": dataset.shape[0],
                "columns": dataset.shape[1],
            },
            # "columns": dataset.columns.tolist(),
            "dtypes": dataset.dtypes.astype(str).to_dict(),
            # "numeric_columns": numeric_cols,
            # "categorical_columns": categorical_cols,
            "missing_values": dataset.isnull().sum().to_dict(),
            "missing_percentage": (
                dataset.isnull().mean() * 100
            ).round(2).to_dict(),
            "statistics": dataset.describe().to_dict(),
            "unique_values": dataset.nunique().to_dict(),
            "preview": dataset.head(5).to_dict(orient="records"),
        }


    def get_dataset_columns(self, db: Session, dataset_id: int):
        dataset = self.repo.get(db=db, id=dataset_id)
        file = self.file_service.get_file(db=db, file_id=dataset.file_id)
        if file.file_type == "csv":
            dataset = pd.read_csv(file.location)
        elif file.file_type == "xlsx":
            dataset = pd.read_excel(file.location)
        return dataset.columns.tolist()

    def get_dataset_columns_details(self, db: Session, dataset_id: int):
        dataset = self.repo.get(db=db, id=dataset_id)
        file = self.file_service.get_file(db=db, file_id=dataset.file_id)
        if file.file_type == "csv":
            dataset = pd.read_csv(file.location)
        elif file.file_type == "xlsx":
            dataset = pd.read_excel(file.location)
        return dataset.dtypes.astype(str).to_dict()