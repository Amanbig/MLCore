import ast
import json
import os
from uuid import UUID, uuid4

import joblib
import pandas as pd
from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from src.common.logging.logger import log_execution
from src.modules.dataset.service import DatasetService
from src.modules.file import FileService
from src.modules.ml_model.schema import (
    CreateMLModelRequest,
    CreateMLModelResponse,
    PredictRequest,
    PredictResponse,
    TrainModelRequest,
)
from src.modules.ml_model.store import MLModelRepository
from src.modules.user.service import UserService


class MLModelService:
    def __init__(self):
        self.user_service = UserService()
        self.file_service = FileService(dir="/uploads/models")
        self.dataset_service = DatasetService()
        self.repo = MLModelRepository()

    @log_execution
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

        # ── Coerce hyperparameter types ──────────────────────────────────────
        # The frontend may send everything as strings (e.g. select inputs).
        # Convert "None"→None, integer strings→int, float strings→float.
        safe_params: dict = {}
        for k, v in data.hyperparameters.items():
            if v == "None" or v is None:
                continue  # omit — let sklearn use its own default
            if isinstance(v, str):
                # try int first, then float, then keep as string
                try:
                    safe_params[k] = int(v)
                    continue
                except ValueError:
                    pass
                try:
                    safe_params[k] = float(v)
                    continue
                except ValueError:
                    pass
            safe_params[k] = v

        if algo in ["random_forest_classifier", "randomforestclassifier", "random_forest"]:
            from sklearn.ensemble import RandomForestClassifier

            model = RandomForestClassifier(**safe_params)

        elif algo in ["random_forest_regressor", "randomforestregressor"]:
            from sklearn.ensemble import RandomForestRegressor

            model = RandomForestRegressor(**safe_params)

        elif algo in ["logistic_regression", "logisticregression"]:
            from sklearn.linear_model import LogisticRegression

            model = LogisticRegression(**safe_params)

        elif algo in ["linear_regression", "linearregression"]:
            from sklearn.linear_model import LinearRegression

            model = LinearRegression(**safe_params)

        elif algo in ["ridge", "ridge_regression"]:
            from sklearn.linear_model import Ridge

            model = Ridge(**safe_params)

        elif algo in ["lasso", "lasso_regression"]:
            from sklearn.linear_model import Lasso

            model = Lasso(**safe_params)

        elif algo in ["svm", "svc", "support_vector_machine"]:
            from sklearn.svm import SVC

            model = SVC(**safe_params)

        elif algo in ["svr", "support_vector_regressor"]:
            from sklearn.svm import SVR

            model = SVR(**safe_params)

        elif algo in ["decision_tree", "decision_tree_classifier", "decisiontreeclassifier"]:
            from sklearn.tree import DecisionTreeClassifier

            model = DecisionTreeClassifier(**safe_params)

        elif algo in ["decision_tree_regressor", "decisiontreeregressor"]:
            from sklearn.tree import DecisionTreeRegressor

            model = DecisionTreeRegressor(**safe_params)

        elif algo in [
            "gradient_boosting",
            "gradient_boosting_classifier",
            "gradientboostingclassifier",
        ]:
            from sklearn.ensemble import GradientBoostingClassifier

            model = GradientBoostingClassifier(**safe_params)

        elif algo in ["gradient_boosting_regressor", "gradientboostingregressor"]:
            from sklearn.ensemble import GradientBoostingRegressor

            model = GradientBoostingRegressor(**safe_params)

        elif algo in ["knn", "kneighbors", "k_nearest_neighbors"]:
            from sklearn.neighbors import KNeighborsClassifier

            model = KNeighborsClassifier(**safe_params)

        elif algo in ["naive_bayes", "gaussiannb", "gaussian_naive_bayes"]:
            from sklearn.naive_bayes import GaussianNB

            model = GaussianNB(**safe_params)

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported algorithm: '{data.model_algorithm}'. Supported: random_forest_classifier, random_forest_regressor, logistic_regression, linear_regression, ridge, lasso, svm, svr, decision_tree, decision_tree_regressor, gradient_boosting, gradient_boosting_regressor, knn, naive_bayes",
            )

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
                "category": "model",
                "user_id": user_id,
            },
        )

        # Save model metadata
        model_db_obj = self.repo.create(
            db=db,
            obj_in={
                "id": uuid4(),
                "name": data.name or f"{data.model_algorithm} Model",
                "version": "1.0",
                "description": data.description or f"Trained {data.model_algorithm} on dataset",
                "model_type": data.model_algorithm,
                "inputs": str(X.columns.tolist()),
                "outputs": data.target_column,
                "accuracy": float(accuracy),
                "error": float(1 - accuracy),
                "file_id": file_obj.id,
                "user_id": user_id,
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

    @log_execution
    def get_model_versions(self, db: Session, model_id: UUID) -> list[CreateMLModelResponse]:
        model = self.get_model(db=db, model_id=model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")

        root_id = model.parent_id if model.parent_id else model.id
        from sqlalchemy import or_

        models = (
            db.query(self.repo.model)
            .filter(or_(self.repo.model.id == root_id, self.repo.model.parent_id == root_id))
            .all()
        )
        return models

    @log_execution
    def retrain_model(self, db: Session, model_id: UUID, data: TrainModelRequest, user_id: UUID):
        parent_model = self.get_model(db=db, model_id=model_id)
        if not parent_model:
            raise HTTPException(status_code=404, detail="Parent model not found")

        # Calculate new semantic version based on parent
        try:
            old_major, old_minor = map(int, str(parent_model.version).split("."))
            new_version = f"{old_major}.{old_minor + 1}"
        except Exception:
            new_version = "1.1"  # Fallback if parsing fails

        # Re-use train_model logic but we simply change the version and parent_id right after
        # This is a bit duplicative but simpler. Let's just run train_model and then UPDATE the returned model's version and parent_id
        res = self.train_model(db, data, user_id)

        # Now update the created model to link it
        new_model_db = self.repo.get_by_id(db=db, id=res["id"])
        new_model_db = self.repo.update(
            db=db,
            db_obj=new_model_db,
            obj_in={
                "parent_id": parent_model.id,
                "version": new_version,
                "name": f"{parent_model.name} (Retrained v{new_version})",
            },
        )

        res["parent_id"] = new_model_db.parent_id
        res["version"] = new_model_db.version
        res["name"] = new_model_db.name
        return res

    @log_execution
    def create_model(
        self, db: Session, data: CreateMLModelRequest, file: UploadFile, user_id: UUID
    ) -> CreateMLModelResponse:
        file_res = self.file_service.create_file(
            db=db, file=file, user_id=user_id, category="model"
        )
        data_dict = data.model_dump()
        data_dict["file_id"] = file_res.id
        data_dict["user_id"] = user_id
        model_obj = self.repo.create(db=db, obj_in=data_dict)
        return CreateMLModelResponse(**model_obj.__dict__, detail="Model created successfully")

    @log_execution
    def get_model(self, db: Session, model_id: UUID) -> CreateMLModelResponse:
        return self.repo.get_by_id(db=db, id=model_id)

    @log_execution
    def get_models(self, db: Session) -> list[CreateMLModelResponse]:
        return self.repo.get(db=db)

    @log_execution
    def update_model(
        self,
        db: Session,
        model_id: UUID,
        data: CreateMLModelRequest,
        file: UploadFile,
        user_id: UUID,
    ) -> CreateMLModelResponse:
        model_obj = self.repo.get_by_id(db=db, id=model_id)

        data_dict = data.model_dump()
        if file:
            file_res = self.file_service.create_file(db=db, file=file, user_id=user_id)
            data_dict["file_id"] = file_res.id

        model_obj = self.repo.update(db=db, db_obj=model_obj, obj_in=data_dict)
        return CreateMLModelResponse(**model_obj.__dict__, detail="Model updated successfully")

    @log_execution
    def delete_model(self, db: Session, model_id: UUID, user_id: UUID):
        model = self.repo.get_by_id(db=db, id=model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        if model.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this model")

        # Delete physical file + file DB record
        if model.file_id:
            from src.modules.file.schema import FileDelete

            try:
                self.file_service.delete_file(db=db, data=FileDelete(id=model.file_id))
            except HTTPException:
                pass  # File already gone – don't block model deletion

        # Delete model DB record
        self.repo.delete(db=db, id=model_id)
        return {"detail": "Model deleted successfully", "id": str(model_id)}

    @log_execution
    def update_model_meta(
        self, db: Session, model_id: UUID, name: str, description: str | None, user_id: UUID
    ):
        model = self.repo.get_by_id(db=db, id=model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        if model.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        updated = self.repo.update(
            db=db,
            db_obj=model,
            obj_in={
                "name": name,
                "description": description or model.description,
            },
        )
        return updated

    @log_execution
    def download_model(self, db: Session, model_id: UUID, user_id: UUID) -> FileResponse:
        model = self.repo.get_by_id(db=db, id=model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        if model.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        file = self.file_service.get_file_by_id(db=db, id=model.file_id)
        loc = file.location
        if not os.path.exists(loc):
            loc = os.path.join(os.getcwd(), loc.lstrip("/").lstrip("\\"))
        if not os.path.exists(loc):
            raise HTTPException(status_code=404, detail="Model file not found on disk")

        filename = f"{model.name.replace(' ', '_')}_v{model.version}.joblib"
        return FileResponse(
            path=loc,
            media_type="application/octet-stream",
            filename=filename,
        )

    @log_execution
    def predict(
        self, db: Session, model_id: UUID, data: PredictRequest, user_id: UUID
    ) -> PredictResponse:
        model_record = self.repo.get_by_id(db=db, id=model_id)
        if not model_record:
            raise HTTPException(status_code=404, detail="Model not found")
        if model_record.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Resolve feature column list stored as a Python-repr string or JSON
        try:
            stored_inputs = model_record.inputs
            # Try JSON first, then ast.literal_eval for Python list repr
            try:
                feature_cols: list[str] = json.loads(stored_inputs)
            except (json.JSONDecodeError, TypeError):
                feature_cols = ast.literal_eval(stored_inputs)
        except Exception:
            raise HTTPException(
                status_code=500,
                detail=f"Could not parse model input schema: {model_record.inputs}",
            )

        # Validate all required features are provided
        missing = [f for f in feature_cols if f not in data.inputs]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Missing required feature(s): {missing}",
            )

        # Build DataFrame in the same column order as training
        row = {col: [data.inputs[col]] for col in feature_cols}
        X = pd.DataFrame(row)

        # Load model from disk
        file = self.file_service.get_file_by_id(db=db, id=model_record.file_id)
        loc = file.location
        if not os.path.exists(loc):
            loc = os.path.join(os.getcwd(), loc.lstrip("/").lstrip("\\"))
        if not os.path.exists(loc):
            raise HTTPException(status_code=404, detail="Model file not found on disk")

        try:
            sklearn_model = joblib.load(loc)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load model: {e}")

        try:
            predictions = sklearn_model.predict(X).tolist()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

        # Probabilities for classifiers
        probabilities = None
        if hasattr(sklearn_model, "predict_proba"):
            try:
                proba = sklearn_model.predict_proba(X)
                classes = [str(c) for c in sklearn_model.classes_]
                probabilities = [
                    {cls: round(float(p), 4) for cls, p in zip(classes, row_proba)}
                    for row_proba in proba
                ]
            except Exception:
                pass

        return PredictResponse(
            model_id=str(model_id),
            model_type=model_record.model_type,
            target=model_record.outputs,
            predictions=predictions,
            probabilities=probabilities,
        )
