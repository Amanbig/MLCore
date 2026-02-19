from typing import List
from uuid import UUID

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

    def create_model(self, db: Session, data: CreateMLModelRequest) -> CreateMLModelResponse:
        file = self.file_service.create_file(db=db, **data.model_dump())
        self.repo.create(db=db, obj_in=data)

    def get_model(self, db: Session, model_id: UUID) -> CreateMLModelResponse:
        return self.repo.get_by_id(db=db, id=model_id)

    def get_models(self, db: Session) -> List[CreateMLModelResponse]:
        return self.repo.get(db=db)

    def update_model(
        self, db: Session, model_id: UUID, data: CreateMLModelRequest
    ) -> CreateMLModelResponse:
        model = self.repo.get_by_id(db=db, id=model_id)
        return self.repo.update(db=db, db_obj=model, obj_in=data)

    def delete_model(self, db: Session, model_id: UUID) -> CreateMLModelResponse:
        return self.repo.delete(db=db, id=model_id)
