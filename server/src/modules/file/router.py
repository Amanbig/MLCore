from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.common.db.session import get_db
from src.modules.auth.schema import AuthToken
from src.modules.auth.service import AuthService
from src.modules.file.schema import FileCreate, FileDelete
from src.modules.file.service import FileService

router = APIRouter()

file_service = FileService(dir="/uploads")
auth_service = AuthService()


@router.post("/file")
def create_file(
    data: FileCreate = Depends(),
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.verify_token),
):
    return file_service.create_file(db=db, data=data)


@router.get("/file/{file_id}")
def get_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.verify_token),
):
    return file_service.get_file_by_id(db=db, id=file_id)


@router.get("/files")
def get_files(
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.verify_token),
):
    return file_service.get_file(db=db)


@router.delete("/file/{file_id}")
def delete_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    token_payload: AuthToken = Depends(auth_service.verify_token),
):
    data = FileDelete(id=file_id)
    return file_service.delete_file(db=db, data=data)
