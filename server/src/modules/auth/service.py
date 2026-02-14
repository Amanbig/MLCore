from fastapi import HTTPException
from sqlalchemy.orm import Session
from src.common.security import Security
from src.modules.auth.schema import AuthToken, LoginRequest, SignupRequest, SignupResponse, LoginResponse
from src.modules.user import UserService
from src.modules.user.schema import UserCreate


class AuthService:
    
    def __init__(self):
        self.user_service = UserService()
        self.security_service = Security()
        
    def signup(self,request:SignupRequest, db:Session) -> SignupResponse:
        user = self.user_service.get_user(db=db,filters={"email":request.email,"phone":request.phone})
        
        # Check if email exists
        existing_user = self.user_service.get_user(db=db, filters={"email": request.email})
        if existing_user is not None:
            raise HTTPException(status_code=409, detail="User with this email already exists")
        
        # Check if phone exists
        existing_user = self.user_service.get_user(db=db, filters={"phone": request.phone})
        if existing_user is not None:
            raise HTTPException(status_code=409, detail="User with this phone already exists")
            
        user = self.user_service.create_user(db=db,data=UserCreate(
            username=request.username,
            email=request.email,
            password=request.password,
            phone=request.phone
        ))
        
        token = self.security_service.generate_auth_token(data=AuthToken(**user.__dict__))
        
        return SignupResponse(**user.__dict__,token=token)
        
    def login(self, request: LoginRequest, db: Session) -> LoginResponse:
        # Build filters based on provided fields
        filters = {}
        if request.email:
            filters["email"] = request.email
        if request.phone:
            filters["phone"] = request.phone
        
        if not filters:
            raise HTTPException(status_code=400, detail="Email or phone is required")
        
        user = self.user_service.get_user(db=db, filters=filters)
        
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
            
        if request.password != user[0].password_hash:
            raise HTTPException(status_code=401,detail="Invalide credentials")
        
        token = self.security_service.generate_auth_token(data=AuthToken(**user.__dict__))
        
        return LoginResponse(**user.__dict__,token=token)