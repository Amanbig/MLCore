from typing import Dict, Sequence

from uuid import UUID
from sqlalchemy.orm import Session

from src.common.security import Security
from src.modules.user.schema import (
    User,
    UserCreate,
    UserCreateResponse,
    UserDelete,
    UserDeleteResponse,
    UserUpdate,
    UserUpdateResponse,
)
from src.modules.user.store import UserRepository


class UserService:
    def __init__(self):
        self.repo = UserRepository()
        self.security = Security()

    def create_user(self, data: UserCreate, db: Session) -> UserCreateResponse:
        # Hash the password before storing
        hashed_password = self.security.hash_password(data.password)

        # Create user data with hashed password
        user_data = data.model_dump()
        user_data["password_hash"] = hashed_password
        del user_data["password"]  # Remove plain password

        # Store user with hashed password
        created_user = self.repo.create(db=db, obj_in=user_data)
        return created_user

    def get_user(self, db: Session, filters: Dict = {}) -> Sequence[User]:
        data = self.repo.get(db=db, filters=filters)
        return data

    def update_user(self, db: Session, data: UserUpdate) -> UserUpdateResponse:
        query = self.repo.get_by_id(db, data.id)

        # If password is being updated, hash it
        if hasattr(data, "password") and data.password:
            update_data = data.model_dump(exclude_unset=True)
            update_data["password_hash"] = self.security.hash_password(data.password)
            del update_data["password"]
            return self.repo.update(db=db, db_obj=query, obj_in=update_data)

        return self.repo.update(db=db, db_obj=query, obj_in=data)

    def delete_user(self, db: Session, data: UserDelete) -> UserDeleteResponse:
        return self.repo.delete(db, data.id)

    def get_by_id(self, db: Session , id:UUID) -> User:
        return self.repo.get_by_id(db, id)
