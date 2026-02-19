from typing import List
from sqlalchemy.orm import Session
from src.modules.dataset.schema import DatasetRequest, DatasetResponse
from src.modules.dataset.store.repository import DatasetRepository
from src.modules.file.service import FileService
from src.modules.auth.service import AuthService
from src.modules.auth.schema import AuthToken
from uuid import UUID


class DatasetService:
    def __init__(self):
        self.repo = DatasetRepository()
        self.file_service = FileService(dir="/uploads")
        self.auth_service = AuthService()

    def create_dataset(self, db: Session, data: DatasetRequest, user_id: UUID) -> DatasetResponse:
        file = self.file_service.create_file(db=db, **data.model_dump())
        self.repo.create(
            db=db,
            obj_in=DatasetRequest(**data.model_dump(), user_id=user_id, file_id=file.id),
        )

    def get_dataset(self, db: Session, dataset_id: int) -> DatasetResponse:
        return self.repo.get(db=db, id=dataset_id)

    def get_datasets(self, db: Session, user_id: UUID) -> List[DatasetResponse]:
        return self.repo.get_all(db=db, filters={"user_id": user_id})

    def update_dataset(
        self, db: Session, dataset_id: int, data: DatasetRequest, user_id: UUID
    ) -> DatasetResponse:
        dataset = self.repo.get(db=db, id=dataset_id)
        if dataset.user_id != user_id:
            raise HTTPException(
                status_code=403, detail="You are not authorized to update this dataset"
            )
        return self.repo.update(db=db, id=dataset_id, obj_in=data)

    def delete_dataset(self, db: Session, dataset_id: int, user_id: UUID) -> DatasetResponse:
        dataset = self.repo.get(db=db, id=dataset_id)
        if dataset.user_id != user_id:
            raise HTTPException(
                status_code=403, detail="You are not authorized to delete this dataset"
            )
        file = self.file_service.get_file(db=db, file_id=dataset.file_id)
        self.file_service.delete_file(db=db, file_id=file.id)
        return self.repo.delete(db=db, id=dataset_id)
