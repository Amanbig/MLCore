from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.common.db.session import get_db
from src.modules.user.schema import (
    UserCreate,
    UserDelete,
    UserUpdate,
)
from src.modules.user.service import UserService

router = APIRouter(prefix="/user", redirect_slashes=True)

user_service = UserService()


def serialize_model(obj: Any) -> Dict:
    """Convert SQLAlchemy model to dictionary for JSON serialization."""
    if hasattr(obj, "__dict__"):
        return {key: value for key, value in obj.__dict__.items() if not key.startswith("_")}
    return obj


@router.get("")
def get_user(db: Session = Depends(get_db)) -> Dict[str, Any]:
    users = user_service.get_user(db)
    # Serialize SQLAlchemy models to dictionaries
    serialized_users = [serialize_model(user) for user in users]
    return {"detail": "Users fetched successfully", "data": serialized_users}


@router.post("")
def create_user(
    request: UserCreate,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    user = user_service.create_user(db=db, data=request)
    return {"detail": "User created successfully", "data": serialize_model(user)}


@router.patch("")
def update_user(
    request: UserUpdate,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    user = user_service.update_user(db=db, data=request)
    return {"detail": "User updated successfully", "data": serialize_model(user)}


@router.delete("")
def delete_user(request: UserDelete, db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = user_service.delete_user(db=db, data=request)
    return {"detail": "User deleted successfully", "data": serialize_model(user)}
