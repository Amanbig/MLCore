from pydantic import BaseModel, EmailStr, model_validator

class SignupRequest(BaseModel):
    username:str
    email: EmailStr
    password: str
    phone: str
    
class SignupResponse(BaseModel):
    username:str
    email: EmailStr
    phone:str
    token:str
    
class LoginRequest(BaseModel):
    email: str | None
    phone: str | None
    password: str
    
class LoginResponse(BaseModel):
    email:str
    phone: str
    username: str
    token: str
    
class AuthToken(BaseModel):
    email:str
    phone:str
    username:str