from datetime import datetime
from uuid import UUID

from fastapi import File, UploadFile
from pydantic import BaseModel, ConfigDict


class FileBase(BaseModel):
    id: UUID
    name: str
    size: str
    location: str
    file_type: str
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class FileCreate(BaseModel):
    name: str | None = None
    size: str | None = None
    location: str
    file_type: str
    user_id: UUID


class FileCreateResponse(FileBase):
    detail: str


class FileDelete(BaseModel):
    id: UUID


class FileDeleteResponse(FileBase):
    detail: str
