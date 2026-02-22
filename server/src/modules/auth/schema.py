from uuid import UUID

from pydantic import BaseModel, EmailStr, model_validator


class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    phone: str


class SignupResponse(BaseModel):
    email: EmailStr | None
    phone: str | None
    username: str | None
    token: str


class LoginRequest(BaseModel):
    email: str | None = None
    phone: str | None = None
    password: str

    @model_validator(mode="after")
    def email_or_phone_required(self) -> "LoginRequest":
        if not self.email and not self.phone:
            raise ValueError("Either email or phone is required to login")
        return self


class LoginResponse(BaseModel):
    email: EmailStr | None
    phone: str | None
    username: str | None
    token: str


class AuthToken(BaseModel):
    id: UUID
    email: EmailStr | None
    phone: str | None
    username: str | None


class ProfileResponse(BaseModel):
    id: UUID
    email: EmailStr | None
    phone: str | None
    username: str | None


class LogoutResponse(BaseModel):
    detail: str
