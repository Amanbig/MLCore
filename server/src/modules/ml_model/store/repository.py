from src.common.repository.base import BaseRepository
from src.modules.ml_model.store import MLModel

class MLModelRepository(BaseRepository):
    def __init__(self):
        super().__init__(MLModel)