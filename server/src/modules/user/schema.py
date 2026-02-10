from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id :UUID
    username :Optional[str]
    email :Optional[EmailStr]
    phone: Optional[str]

class UserCreate(User):
    password: str

class UserCreateResponse(User):
    detail :str
    
class UserUpdate(BaseModel):
    id: UUID
    username: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    password: Optional[str]

class UserUpdateResponse(User):
    detail :str

class UserDelete(BaseModel):
    id: UUID

class UserDeleteResponse(BaseModel):
    detail: str