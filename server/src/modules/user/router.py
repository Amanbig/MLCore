from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from src.common.db.session import get_db
from src.modules.user.schema import UserCreate, UserDelete, UserUpdate
from src.modules.user.service import UserService

router = APIRouter(prefix="/user",redirect_slashes=True)

user_service = UserService()

@router.get("")
def get_user(
    db:Session = Depends(get_db)
):
    users = user_service.get_user(db)
    return JSONResponse({"detail":"user fetched successfully","data":users})

@router.post("")
def create_user(
    user: UserCreate,
    db:Session = Depends(get_db),
):
    user = user_service.create_user(db=db,data=user)
    return JSONResponse({"detail":"User created successfully","data":user})

@router.patch("")
def update_user(
    user: UserUpdate,
    db:Session = Depends(get_db),
):
    user = user_service.update_user(db=db,data=user)
    return JSONResponse({"detail":"User created successfully","data":user})
    
@router.delete("")
def delete_user(
    user:UserDelete,
    db:Session = Depends(get_db)
):
    user = user_service.delete_user(db=db,data=user)
    return JSONResponse({"detail":"User deleted successfully"})