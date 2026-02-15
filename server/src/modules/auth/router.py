from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm.session import Session

from src.common.db.session import get_db
from src.modules.auth.schema import AuthToken, LoginRequest, LoginResponse, SignupRequest, SignupResponse
from src.modules.auth.service import AuthService

auth_service = AuthService()
router = APIRouter(redirect_slashes=True, prefix="/auth")


@router.post("/login")
def login(
    request: LoginRequest, response: Response, db: Session = Depends(get_db)
) -> LoginResponse:
    return auth_service.login(request=request, response=response, db=db)


@router.post("/signup")
def signup(
    request: SignupRequest, response: Response, db: Session = Depends(get_db)
) -> SignupResponse:
    return auth_service.signup(request=request, response=response, db=db)


@router.post("/logout")
def logout(
    response: Response
):
    return auth_service.logout(response)
    
@router.get("/profile")
def getProfile(
    token:AuthToken = Depends(auth_service.security_service.verify_auth_token),
    db:Session = Depends(get_db)
):
    return auth_service.getProfile(db=db,id=token.id)