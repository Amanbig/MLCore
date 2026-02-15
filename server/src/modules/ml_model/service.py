from sqlalchemy.orm import Session
from src.modules.file import FileService
from src.modules.user import UserService

class MLModelService:
    def __init__(self):
        self.user_service = UserService()
        self.file_service = FileService(dir="/uploads")
        