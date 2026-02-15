from pydantic import BaseModel, EmailStr
from uuid import UUID

class SignupRequest(BaseModel):
    username:str
    email: EmailStr
    password: str
    phone: str
    
class SignupResponse(BaseModel):
    email:EmailStr | None
    phone: str | None
    username: str | None
    token:str
    
class LoginRequest(BaseModel):
    email: str | None
    phone: str | None
    password: str
    
class LoginResponse(BaseModel):
    email:EmailStr | None
    phone: str | None
    username: str | None
    token: str
    
class AuthToken(BaseModel):
    id: UUID
    email:EmailStr | None
    phone:str | None
    username:str | None