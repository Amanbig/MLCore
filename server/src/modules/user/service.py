from sqlalchemy.orm import Session
from src.modules.user.schema import User, UserCreate, UserDelete, UserUpdate
from src.modules.user.store import UserRepository


class UserService:
    def __init__(self):
        self.repo = UserRepository()
        
    def create_user(self,data:UserCreate, db:Session):
        data = self.repo.create(db=db,obj_in=data)
        return data
    
    def get_user(self, db:Session):
        data = self.repo.get(db=db)
        return data
        
    def update_user(self,db:Session,data:UserUpdate):
        query = self.repo.get_by_id(db,data.id)
        return self.repo.update(db=db,db_obj=query,obj_in=data)
    
    def delete_user(self,db:Session, data:UserDelete):
        return self.repo.delete(db,data.id)
    
    def get_by_id(self,db:Session,data:User):
        return self.repo.get_by_id(db,data.id)