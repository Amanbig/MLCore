from uuid import UUID
from fastapi import File
from pydantic import BaseModel
from starlette.datastructures import UploadFile

class MLModelBase(BaseModel):
    id: UUID
    name:str
    version: str
    description: str
    model_type: str
    inputs: str
    outputs: str
    accuracy: float
    error: float
    file_id:UUID
    
class CreateMLModelRequest(BaseModel):
    name:str
    version: str
    description: str
    model_type: str
    inputs: str
    outputs: str
    accuracy: float
    error: float
    file:UploadFile = File(...)
    
class CreateMLModelResponse(MLModelBase):
    detail: str