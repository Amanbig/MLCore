from src.common.db.repository import BaseRepository
from src.modules.dataset.store.models import Dataset
from sqlalchemy.orm import Session


class DatasetRepository(BaseRepository):
    def __init__(self, db: Session):
        super().__init__(db=db, model=Dataset)
