from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FileBase(BaseModel):
    id: UUID
    name: str
    size: str
    location: str
    file_type: str
    category: str = "general"
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class FileCreate(BaseModel):
    name: str | None = None
    size: str | None = None
    location: str
    file_type: str
    category: str = "general"
    user_id: UUID


class FileCreateResponse(FileBase):
    detail: str


class FileDelete(BaseModel):
    id: UUID


class FileDeleteResponse(FileBase):
    detail: str
