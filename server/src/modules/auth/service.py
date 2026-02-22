from uuid import UUID

from fastapi import HTTPException, Response
from sqlalchemy.orm import Session

from src.common.security import Security
from src.modules.auth.schema import (
    AuthToken,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    ProfileResponse,
    SignupRequest,
    SignupResponse,
)
from src.modules.user.service import UserService
from src.modules.user.schema import UserCreate


class AuthService:
    def __init__(self):
        self.user_service = UserService()
        self.security_service = Security()

    def signup(self, request: SignupRequest, response: Response, db: Session) -> SignupResponse:
        # Check if email exists
        existing_user = self.user_service.get_user(db=db, filters={"email": request.email})
        if existing_user:
            raise HTTPException(status_code=409, detail="User with this email already exists")

        # Check if phone exists
        existing_user = self.user_service.get_user(db=db, filters={"phone": request.phone})
        if existing_user:
            raise HTTPException(status_code=409, detail="User with this phone already exists")

        # Create user (password hashing now handled in UserService)
        user = self.user_service.create_user(
            db=db,
            data=UserCreate(
                username=request.username,
                email=request.email,
                password=request.password,
                phone=request.phone,
            ),
        )

        # Generate token
        token = self.security_service.generate_auth_token(
            data=AuthToken(id=user.id, email=user.email, phone=user.phone, username=user.username)
        )

        # Set the token as a cookie for browser requests
        self.security_service.cookie_manager.set_cookie(response, token)

        # Explicitly construct SignupResponse
        return SignupResponse(
            username=user.username, email=user.email, phone=user.phone, token=token
        )

    def login(self, request: LoginRequest, response: Response, db: Session) -> LoginResponse:
        # Build filters based on provided fields
        filters = {}
        if request.email:
            filters["email"] = request.email
        if request.phone:
            filters["phone"] = request.phone

        if not filters:
            raise HTTPException(status_code=400, detail="Email or phone is required")

        users = self.user_service.get_user(db=db, filters=filters)

        if not users:
            raise HTTPException(status_code=401, detail="User not found")

        # get_user returns a list, take the first user
        user = users[0]

        # Use secure password verification
        if not self.security_service.verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Generate token
        token = self.security_service.generate_auth_token(
            data=AuthToken(id=user.id, email=user.email, phone=user.phone, username=user.username)
        )

        # Set the token as a cookie for browser requests
        self.security_service.cookie_manager.set_cookie(response, token)

        # Return LoginResponse with explicit fields
        return LoginResponse(
            email=user.email, phone=user.phone, username=user.username, token=token
        )

    def logout(self, response: Response) -> LogoutResponse:
        self.security_service.cookie_manager.clear_auth_cookie(response)
        return LogoutResponse(detail="Logout is successful")

    def getProfile(self, id: UUID, db: Session) -> ProfileResponse:
        user = self.user_service.get_by_id(db=db, id=id)

        return ProfileResponse(
            id=user.id, email=user.email, phone=user.phone, username=user.username
        )

    def verify_token(self, token: str) -> AuthToken:
        return self.security_service.verify_auth_token(token)
