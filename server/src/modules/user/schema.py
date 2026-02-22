from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class User(BaseModel):
    id: UUID
    username: str | None
    email: EmailStr | None
    phone: str | None
    password_hash: str
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    username: str | None
    email: EmailStr | None
    phone: str | None
    password: str


class UserCreateResponse(BaseModel):
    id: UUID
    username: str | None
    email: EmailStr | None
    phone: str | None


class UserUpdate(BaseModel):
    id: UUID
    username: str | None
    email: str | None
    phone: str | None
    password: str | None


class UserUpdateResponse(BaseModel):
    id: UUID
    username: str | None
    email: str | None
    phone: str | None


class UserDelete(BaseModel):
    id: UUID


class UserDeleteResponse(BaseModel):
    id: UUID
