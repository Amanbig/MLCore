from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from src.modules.file.schema import FileBase


class DatasetBase(BaseModel):
    id: UUID
    name: str
    description: str
    file_id: UUID
    created_at: datetime
    rows: int
    columns: int
    metadata: dict
    updated_at: datetime
    user_id: UUID
    file: FileBase


class DatasetResponse(BaseModel):
    id: UUID
    name: str
    description: str
    file_id: UUID
    created_at: datetime
    rows: int
    columns: int
    metadata: dict
    updated_at: datetime
    user_id: UUID
    file: FileBase


class DatasetRequest(BaseModel):
    name: str
    description: str
    file_id: UUID
    rows: int
    columns: int
    metadata: dict
