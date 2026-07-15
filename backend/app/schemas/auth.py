import uuid

from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.strip().lower() if isinstance(value, str) else value


class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.strip().lower() if isinstance(value, str) else value


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.strip().lower() if isinstance(value, str) else value


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: str

    class Config:
        from_attributes = True
