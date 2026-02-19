from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from src.modules.file.schema import FileResponse
from src.modules.user.schema import UserResponse


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
    user: UserResponse
    file: FileResponse


class DatasetRequest(BaseModel):
    name: str
    description: str
    file_id: UUID
    rows: int
    columns: int
    metadata: dict
