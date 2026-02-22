from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.common.db.session import get_db
from src.modules.auth.schema import AuthToken
from src.modules.auth.service import AuthService
from src.modules.ml_model.schema import CreateMLModelRequest, TrainModelRequest
from src.modules.ml_model.service import MLModelService

router = APIRouter()

ml_model_service = MLModelService()
auth_service = AuthService()


@router.post("/ml_model/train")
def train_model(
    data: TrainModelRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.verify_token),
):
    return ml_model_service.train_model(db=db, data=data, user_id=token_payload.id)


@router.post("/ml_model")
def create_model(
    data: CreateMLModelRequest = Depends(),
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.verify_token),
):
    return ml_model_service.create_model(db=db, data=data)


@router.get("/ml_model/{model_id}")
def get_model(
    model_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.verify_token),
):
    return ml_model_service.get_model(db=db, model_id=model_id)


@router.get("/ml_models")
def get_models(
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.verify_token),
):
    return ml_model_service.get_models(db=db)


@router.put("/ml_model/{model_id}")
def update_model(
    model_id: UUID,
    data: CreateMLModelRequest = Depends(),
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.verify_token),
):
    return ml_model_service.update_model(db=db, model_id=model_id, data=data)


@router.delete("/ml_model/{model_id}")
def delete_model(
    model_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.verify_token),
):
    return ml_model_service.delete_model(db=db, model_id=model_id)
