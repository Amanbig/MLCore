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
    parent_id: UUID | None = None
    version: str = "1.0"
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
    parent_id: UUID | None = None
    version: str = "1.0"
    file: FileBase


class DatasetRequest(BaseModel):
    name: str
    description: str
    file_id: UUID
    rows: int
    columns: int
    metadata: dict


class DatasetCleanRequest(BaseModel):
    strategy: str  # 'drop_nulls', 'fill_mean', 'fill_median'
    columns: list[str] | None = None


class DatasetTransformRequest(BaseModel):
    strategy: str  # 'standard_scaler', 'min_max_scaler', 'label_encoder'
    columns: list[str]
