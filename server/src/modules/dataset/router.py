from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.common.db.session import get_db
from src.modules.auth.schema import AuthToken
from src.modules.dataset.schema import DatasetRequest
from src.modules.dataset.service import DatasetService

router = APIRouter()

dataset_service = DatasetService()


@router.post("/dataset")
def create_dataset(
    request: Request,
    data: DatasetRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(dataset_service.auth_service.verify_token),
):
    return dataset_service.create_dataset(db=db, data=data, user_id=token_payload.id)


@router.get("/dataset/{dataset_id}")
def get_dataset(
    request: Request,
    dataset_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(dataset_service.auth_service.verify_token),
):
    return dataset_service.get_dataset(db=db, dataset_id=dataset_id)


@router.get("/datasets")
def get_datasets(
    request: Request,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(dataset_service.auth_service.verify_token),
):
    return dataset_service.get_datasets(db=db, user_id=token_payload.id)


@router.put("/dataset/{dataset_id}")
def update_dataset(
    request: Request,
    dataset_id: UUID,
    data: DatasetRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(dataset_service.auth_service.verify_token),
):
    return dataset_service.update_dataset(
        db=db, dataset_id=dataset_id, data=data, user_id=token_payload.id
    )


@router.delete("/dataset/{dataset_id}")
def delete_dataset(
    request: Request,
    dataset_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(dataset_service.auth_service.verify_token),
):
    return dataset_service.delete_dataset(db=db, dataset_id=dataset_id, user_id=token_payload.id)
