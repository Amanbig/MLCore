from typing import Any
from uuid import UUID

from pydantic import BaseModel


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
    name: str | None = None  # custom model name; defaults to "<algo> Model"
    description: str | None = None  # custom description; defaults to auto-generated


class TrainModelResponse(MLModelBase):
    detail: str


class UpdateModelMetaRequest(BaseModel):
    name: str
    description: str | None = None


class PredictRequest(BaseModel):
    """
    inputs: dict mapping each feature name → value.
    Example: {"sepal_length": 5.1, "sepal_width": 3.5}
    """

    inputs: dict[str, Any]


class PredictResponse(BaseModel):
    model_id: str
    model_type: str
    target: str
    predictions: list[Any]
    probabilities: list[dict[str, float]] | None = None
