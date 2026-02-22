from uuid import UUID

from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy.orm import Session

from src.common.db.session import get_db
from src.modules.auth.schema import AuthToken
from src.modules.auth.service import AuthService
from src.modules.ml_model.schema import CreateMLModelRequest, PredictRequest, TrainModelRequest
from src.modules.ml_model.service import MLModelService
from src.modules.ml_model.utils.hyperparams import get_hyperparams

router = APIRouter()

ml_model_service = MLModelService()
auth_service = AuthService()


@router.post("/ml_model/train")
def train_model(
    request: Request,
    data: TrainModelRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    return ml_model_service.train_model(db=db, data=data, user_id=token_payload.id)


@router.get("/ml_model/hyperparameters/{algorithm}")
def get_hyperparameters(
    request: Request,
    algorithm: str,
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    """Return the hyperparameter schema for a given algorithm."""
    return {"algorithm": algorithm, "hyperparameters": get_hyperparams(algorithm)}


@router.get("/ml_model/{model_id}/download")
def download_model(
    request: Request,
    model_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    """Stream the trained .joblib file for download."""
    return ml_model_service.download_model(db=db, model_id=model_id, user_id=token_payload.id)


@router.post("/ml_model/{model_id}/predict")
def predict(
    request: Request,
    model_id: UUID,
    data: PredictRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    """Run inference on a trained model."""
    return ml_model_service.predict(db=db, model_id=model_id, data=data, user_id=token_payload.id)


@router.post("/ml_model/{model_id}/retrain")
def retrain_model(
    request: Request,
    model_id: UUID,
    data: TrainModelRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    return ml_model_service.retrain_model(
        db=db, model_id=model_id, data=data, user_id=token_payload.id
    )


@router.post("/ml_model")
def create_model(
    request: Request,
    file: UploadFile = File(...),
    data: CreateMLModelRequest = Depends(),
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    return ml_model_service.create_model(db=db, data=data, file=file, user_id=token_payload.id)


@router.get("/ml_model/{model_id}")
def get_model(
    request: Request,
    model_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    return ml_model_service.get_model(db=db, model_id=model_id)


@router.get("/ml_model/{model_id}/versions")
def get_model_versions(
    request: Request,
    model_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    return ml_model_service.get_model_versions(db=db, model_id=model_id)


@router.get("/ml_models")
def get_models(
    request: Request,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    return ml_model_service.get_models(db=db)


@router.put("/ml_model/{model_id}")
def update_model(
    request: Request,
    model_id: UUID,
    file: UploadFile = File(None),
    data: CreateMLModelRequest = Depends(),
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    return ml_model_service.update_model(
        db=db, model_id=model_id, data=data, file=file, user_id=token_payload.id
    )


@router.delete("/ml_model/{model_id}")
def delete_model(
    request: Request,
    model_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.security_service.verify_auth_token),
):
    return ml_model_service.delete_model(db=db, model_id=model_id, user_id=token_payload.id)
