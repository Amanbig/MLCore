from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from src.modules.file import FileService
from src.modules.ml_model.schema import CreateMLModelRequest, CreateMLModelResponse
from src.modules.ml_model.store import MLModelRepository
from src.modules.user import UserService


import os
import joblib
import pandas as pd
from uuid import uuid4
from fastapi import HTTPException
from src.modules.dataset.service import DatasetService
from src.modules.file.schema import FileCreate


class MLModelService:
    def __init__(self):
        self.user_service = UserService()
        self.file_service = FileService(dir="/uploads")
        self.dataset_service = DatasetService()
        self.repo = MLModelRepository()

    def train_model(self, db: Session, data: TrainModelRequest, user_id: UUID):
        dataset = self.dataset_service.get_dataset(db=db, dataset_id=data.dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        file = self.file_service.get_file_by_id(db=db, id=dataset.file_id)
        if not file:
            raise HTTPException(status_code=404, detail="Dataset file not found")

        file_location = file.location
        if not os.path.exists(file_location):
            # Try to resolve relative to current dir
            file_location = os.path.join(os.getcwd(), file_location.lstrip("/"))
            if not os.path.exists(file_location):
                raise HTTPException(
                    status_code=404, detail=f"File not found on disk: {file.location}"
                )

        if file.file_type == "csv":
            df = pd.read_csv(file_location)
        elif file.file_type in ["xls", "xlsx"]:
            df = pd.read_excel(file_location)
        else:
            raise HTTPException(status_code=400, detail="Unsupported dataset format")

        if data.target_column not in df.columns:
            raise HTTPException(status_code=400, detail="Target column not found in dataset")

        if data.features:
            missing_features = [f for f in data.features if f not in df.columns]
            if missing_features:
                raise HTTPException(
                    status_code=400, detail=f"Features not found: {missing_features}"
                )
            X = df[data.features]
        else:
            X = df.drop(columns=[data.target_column])

        # Drop rows with NaNs in targets or features for simplicity
        df = pd.concat([X, df[data.target_column]], axis=1).dropna()
        y = df[data.target_column]
        X = df.drop(columns=[data.target_column])

        try:
            from sklearn.model_selection import train_test_split

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error in data split: {str(e)}")

        model = None
        algo = data.model_algorithm.lower()

        if algo in ["randomforestclassifier", "random_forest"]:
            from sklearn.ensemble import RandomForestClassifier

            model = RandomForestClassifier(**data.hyperparameters)
        elif algo in ["randomforestregressor"]:
            from sklearn.ensemble import RandomForestRegressor

            model = RandomForestRegressor(**data.hyperparameters)
        elif algo in ["logisticregression", "logistic_regression"]:
            from sklearn.linear_model import LogisticRegression

            model = LogisticRegression(**data.hyperparameters)
        elif algo in ["linearregression", "linear_regression"]:
            from sklearn.linear_model import LinearRegression

            model = LinearRegression(**data.hyperparameters)
        else:
            raise HTTPException(status_code=400, detail="Unsupported model algorithm")

        try:
            model.fit(X_train, y_train)
            accuracy = model.score(X_test, y_test)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error during training: {str(e)}")

        # Save Model to disk
        model_filename = f"model_{uuid4()}.joblib"
        upload_dir = self.file_service.dir.lstrip("/")
        os.makedirs(upload_dir, exist_ok=True)
        model_path = os.path.join(upload_dir, model_filename)

        try:
            joblib.dump(model, model_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving model: {str(e)}")

        # Create file record (using dict to bypass UploadFile validation in FileCreate schema)
        file_obj = self.file_service.repo.create(
            db=db,
            obj_in={
                "name": model_filename,
                "size": str(os.path.getsize(model_path)),
                "location": model_path,
                "file_type": "joblib",
                "user_id": user_id,
            },
        )

        # Save model metadata
        model_db_obj = self.repo.create(
            db=db,
            obj_in={
                "name": f"{data.model_algorithm} Model",
                "version": "1.0",
                "description": f"Trained {data.model_algorithm} on dataset",
                "model_type": data.model_algorithm,
                "inputs": str(X.columns.tolist()),
                "outputs": data.target_column,
                "accuracy": float(accuracy),
                "error": float(1 - accuracy),
                "file_id": file_obj.id,
                "id": uuid4(),  # ID is part of schema/model maybe
            },
        )

        return {
            "detail": "Model trained successfully",
            "id": model_db_obj.id,
            "name": model_db_obj.name,
            "version": model_db_obj.version,
            "description": model_db_obj.description,
            "model_type": model_db_obj.model_type,
            "inputs": model_db_obj.inputs,
            "outputs": model_db_obj.outputs,
            "accuracy": model_db_obj.accuracy,
            "error": model_db_obj.error,
            "file_id": model_db_obj.file_id,
        }

    def create_model(self, db: Session, data: CreateMLModelRequest) -> CreateMLModelResponse:
        file = self.file_service.create_file(db=db, **data.model_dump())
        self.repo.create(db=db, obj_in=data)

    def get_model(self, db: Session, model_id: UUID) -> CreateMLModelResponse:
        return self.repo.get_by_id(db=db, id=model_id)

    def get_models(self, db: Session) -> List[CreateMLModelResponse]:
        return self.repo.get(db=db)

    def update_model(
        self, db: Session, model_id: UUID, data: CreateMLModelRequest
    ) -> CreateMLModelResponse:
        model = self.repo.get_by_id(db=db, id=model_id)
        return self.repo.update(db=db, db_obj=model, obj_in=data)

    def delete_model(self, db: Session, model_id: UUID) -> CreateMLModelResponse:
        return self.repo.delete(db=db, id=model_id)
