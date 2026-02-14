from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id :UUID
    username :Optional[str]
    email :Optional[EmailStr]
    phone: Optional[str]
    password_hash: str
    created_at: datetime
    updated_at: datetime

class UserCreate(BaseModel):
    username :Optional[str]
    email :Optional[EmailStr]
    phone: Optional[str]
    password: str

class UserCreateResponse(BaseModel):
    username :Optional[str]
    email :Optional[EmailStr]
    phone: Optional[str]
    
class UserUpdate(BaseModel):
    id: UUID
    username: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    password: Optional[str]

class UserUpdateResponse(BaseModel):
    id: UUID
    username: Optional[str]
    email: Optional[str]
    phone: Optional[str]

class UserDelete(BaseModel):
    id: UUID

class UserDeleteResponse(BaseModel):
    id: UUID