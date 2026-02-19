from fastapi import APIRouter
from src.common.db.session import get_db
from src.modules.dataset.service import DatasetService
from src.modules.dataset.schema import DatasetRequest
from sqlalchemy.orm import Session
from fastapi import Depends
from src.common.auth import get_current_user
from src.common.auth.schema import AuthToken

router = APIRouter()

dataset_service = DatasetService()


@router.post("/dataset")
def create_dataset(
    data: DatasetRequest,
    user_id: int,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(dataset_service.auth_service.verify_token),
):
    return dataset_service.create_dataset(db=db, data=data)


@router.get("/dataset/{dataset_id}")
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(dataset_service.auth_service.verify_token),
):
    return dataset_service.get_dataset(db=db, dataset_id=dataset_id)


@router.get("/datasets")
def get_datasets(
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(dataset_service.auth_service.verify_token),
):
    return dataset_service.get_datasets(db=db)


@router.put("/dataset/{dataset_id}")
def update_dataset(
    dataset_id: int,
    data: DatasetRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(dataset_service.auth_service.verify_token),
):
    return dataset_service.update_dataset(db=db, dataset_id=dataset_id, data=data)


@router.delete("/dataset/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(dataset_service.auth_service.verify_token),
):
    return dataset_service.delete_dataset(db=db, dataset_id=dataset_id)
