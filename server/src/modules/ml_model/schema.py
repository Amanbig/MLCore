from uuid import UUID
from fastapi import File
from pydantic import BaseModel, ConfigDict
from starlette.datastructures import UploadFile


class MLModelBase(BaseModel):
    id: UUID
    name: str
    version: str
    description: str
    model_type: str
    inputs: str
    outputs: str
    accuracy: float
    error: float
    file_id: UUID
    parent_id: UUID | None = None


class CreateMLModelRequest(BaseModel):
    name: str
    version: str
    description: str
    model_type: str
    inputs: str
    outputs: str
    accuracy: float
    error: float


class CreateMLModelResponse(MLModelBase):
    detail: str


class TrainModelRequest(BaseModel):
    dataset_id: UUID
    model_algorithm: str
    target_column: str
    features: list[str] | None = None
    hyperparameters: dict = {}


class TrainModelResponse(MLModelBase):
    detail: str
