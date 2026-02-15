from uuid import UUID
from pydantic import BaseModel

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
    
class CreateMLModelResponse(MLModelBase):
    detail: str