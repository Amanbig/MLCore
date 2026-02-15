import shutil
from typing import Sequence
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.orm import Session
from src.modules.file.schema import (
    FileBase,
    FileCreate,
    FileCreateResponse,
    FileDelete,
    FileDeleteResponse,
)
from src.modules.file.store.repository import FileRepository
from pathlib import Path


class FileService:
    def __init__(self, dir: str):
        self.repo = FileRepository()
        self.dir = dir

    def create_file(self, db: Session, data: FileCreate) -> FileCreateResponse:
        with open(f"{dir}/{data.file.filename}", "wb") as buffer:
            shutil.copyfileobj(data.file.file, buffer)

        files = self.repo.create(
            db=db,
            obj_in=FileCreate(
                name=data.file.filename,
                size=str(data.file.size),
                location=f"{dir}/{data.file.filename}",
                user_id=data.user_id,
            ),
        )

        return FileCreateResponse(**files, detail="File Created Successfully")

    def get_file(self, db: Session) -> Sequence[FileBase]:
        files = self.repo.get(db=db)
        return files

    def get_file_by_id(self, db: Session, id: UUID) -> FileBase:
        file = self.repo.get_by_id(db=db, id=id)
        if file is None:
            raise HTTPException(status_code=404, detail="File Not found")
        return file

    def delete_file(self, db: Session, data: FileDelete) -> FileDeleteResponse:
        file = self.get_file_by_id(db, data.id)
        file_path = Path(file.location)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        file_path.unlink()
        return FileDeleteResponse(**file.model_dump(), detail="File deleted successfully")
