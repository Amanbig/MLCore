from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from src.common.db.session import get_db
from src.modules.user.service import UserService

router = APIRouter(prefix="/user",redirect_slashes=True)

user_service = UserService()

@router.get("")
def get_user(
    db:Session = Depends(get_db)
):
    users = user_service.get_user(db)
    return JSONResponse({"detail":"user fetched successfully","data":users})