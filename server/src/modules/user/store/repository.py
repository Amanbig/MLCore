from src.common.repository.base import BaseRepository
from src.modules.user.store.model import User

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)