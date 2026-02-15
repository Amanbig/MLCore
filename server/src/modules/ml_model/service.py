from sqlalchemy.orm import Session
from src.modules.file import FileService
from src.modules.ml_model.schema import CreateMLModelRequest, CreateMLModelResponse
from src.modules.ml_model.store import MLModelRepository
from src.modules.user import UserService

class MLModelService:
    def __init__(self):
        self.user_service = UserService()
        self.file_service = FileService(dir="/uploads")
        self.repo = MLModelRepository()
        
    def create_model(self,db:Session, data:CreateMLModelRequest) ->CreateMLModelResponse:
        file = self.file_service.create_file(db=db,**data.model_dump())
        self.repo.create(db=db,obj_in=)