from src.common.repository.base import BaseRepository
from src.modules.dataset.store.models import Dataset


class DatasetRepository(BaseRepository):
    def __init__(self):
        super().__init__(model=Dataset)
