from src.common.repository.base import BaseRepository
from src.modules.file.store.model import Files


class FileRepository(BaseRepository):
    def __init__(self):
        super().__init__(Files)
