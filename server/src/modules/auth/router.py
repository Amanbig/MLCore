from fastapi import APIRouter, Depends
from sqlalchemy.orm.session import Session
from src.common.db.session import get_db
from src.modules.auth.schema import LoginRequest, LoginResponse, SignupRequest, SignupResponse
from src.modules.auth.service import AuthService

auth_service = AuthService()
router = APIRouter(redirect_slashes=True,prefix="/auth")

@router.post("/login")
def login(request:LoginRequest, db:Session = Depends(get_db))->LoginResponse:
    return auth_service.login(request=request, db=db)
    
@router.post("/signup")
def signup(request: SignupRequest, db:Session = Depends(get_db)) -> SignupResponse:
    return auth_service.signup(request=request,db=db)