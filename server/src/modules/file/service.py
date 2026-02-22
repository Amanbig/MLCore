import shutil
from pathlib import Path
from typing import Sequence
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from src.common.logging.logger import log_execution
from src.modules.file.schema import (
    FileBase,
    FileCreate,
    FileCreateResponse,
    FileDelete,
    FileDeleteResponse,
)
from src.modules.file.store.repository import FileRepository


class FileService:
    def __init__(self, dir: str):
        self.repo = FileRepository()
        self.dir = dir

    @log_execution
    def create_file(
        self, db: Session, file: UploadFile, user_id: UUID, category: str = "general"
    ) -> FileCreateResponse:
        import os

        os.makedirs(self.dir.lstrip("/"), exist_ok=True)
        file_path = f"{self.dir}/{file.filename}"
        with open(file_path.lstrip("/"), "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        files = self.repo.create(
            db=db,
            obj_in=FileCreate(
                name=file.filename,
                size=str(file.size or 0),
                location=file_path,
                user_id=user_id,
                file_type=file.filename.split(".")[-1],
            ).model_dump()
            | {"category": category},
        )

        return FileCreateResponse(**files.__dict__, detail="File Created Successfully")

    @log_execution
    def get_file(self, db: Session) -> Sequence[FileBase]:
        files = self.repo.get(db=db)
        return files

    @log_execution
    def get_file_by_id(self, db: Session, id: UUID) -> FileBase:
        file = self.repo.get_by_id(db=db, id=id)
        if file is None:
            raise HTTPException(status_code=404, detail="File Not found")
        return file

    @log_execution
    def delete_file(self, db: Session, data: FileDelete) -> FileDeleteResponse:
        file = self.get_file_by_id(db, data.id)
        file_path = Path(file.location)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        file_path.unlink()
        return FileDeleteResponse(**file.model_dump(), detail="File deleted successfully")
