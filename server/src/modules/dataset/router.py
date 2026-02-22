from uuid import UUID

from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy.orm import Session

from src.common.db.session import get_db
from src.modules.auth.schema import AuthToken
from src.modules.dataset.schema import DatasetCleanRequest, DatasetRequest, DatasetTransformRequest
from src.modules.dataset.service import DatasetService
from src.modules.file.service import FileService

router = APIRouter()

dataset_service = DatasetService()
dataset_file_service = FileService(dir="/uploads/datasets")


@router.post("/dataset/upload")
def upload_dataset_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(
        dataset_service.auth_service.security_service.verify_auth_token
    ),
):
    return dataset_file_service.create_file(
        db=db, file=file, user_id=token_payload.id, category="dataset"
    )


@router.post("/dataset")
def create_dataset(
    request: Request,
    data: DatasetRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(
        dataset_service.auth_service.security_service.verify_auth_token
    ),
):
    return dataset_service.create_dataset(db=db, data=data, user_id=token_payload.id)


@router.get("/dataset/{dataset_id}")
def get_dataset(
    request: Request,
    dataset_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(
        dataset_service.auth_service.security_service.verify_auth_token
    ),
):
    return dataset_service.get_dataset(db=db, dataset_id=dataset_id)


@router.get("/datasets")
def get_datasets(
    request: Request,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(
        dataset_service.auth_service.security_service.verify_auth_token
    ),
):
    return dataset_service.get_datasets(db=db, user_id=token_payload.id)


@router.put("/dataset/{dataset_id}")
def update_dataset(
    request: Request,
    dataset_id: UUID,
    data: DatasetRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(
        dataset_service.auth_service.security_service.verify_auth_token
    ),
):
    return dataset_service.update_dataset(
        db=db, dataset_id=dataset_id, data=data, user_id=token_payload.id
    )


@router.delete("/dataset/{dataset_id}")
def delete_dataset(
    request: Request,
    dataset_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(
        dataset_service.auth_service.security_service.verify_auth_token
    ),
):
    return dataset_service.delete_dataset(db=db, dataset_id=dataset_id, user_id=token_payload.id)


@router.post("/dataset/{dataset_id}/clean")
def clean_dataset(
    request: Request,
    dataset_id: UUID,
    data: DatasetCleanRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(
        dataset_service.auth_service.security_service.verify_auth_token
    ),
):
    return dataset_service.clean_dataset(
        db=db, dataset_id=dataset_id, data=data, user_id=token_payload.id
    )


@router.post("/dataset/{dataset_id}/transform")
def transform_dataset(
    request: Request,
    dataset_id: UUID,
    data: DatasetTransformRequest,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(
        dataset_service.auth_service.security_service.verify_auth_token
    ),
):
    return dataset_service.transform_dataset(
        db=db, dataset_id=dataset_id, data=data, user_id=token_payload.id
    )


@router.post("/dataset/{dataset_id}/refresh")
def refresh_dataset_metadata(
    request: Request,
    dataset_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(
        dataset_service.auth_service.security_service.verify_auth_token
    ),
):
    """Recompute rows, columns, and metadata from the physical file."""
    return dataset_service.refresh_dataset_metadata(
        db=db, dataset_id=dataset_id, user_id=token_payload.id
    )


@router.get("/dataset/{dataset_id}/versions")
def get_dataset_versions(
    request: Request,
    dataset_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(
        dataset_service.auth_service.security_service.verify_auth_token
    ),
):
    """Return the full version history for a dataset lineage."""
    return dataset_service.get_dataset_versions(
        db=db, dataset_id=dataset_id, user_id=token_payload.id
    )
