from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str = Field(min_length=10)


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    created_at: datetime
    is_verified: bool
    public_id: Optional[str] = None
    weekly_email: bool
    monthly_email: bool
    timezone: str
    subscription_status: str
    subscription_tier: Optional[str] = None

    class Config:
        from_attributes = True  # Allows SQLAlchemy model conversion
        # by default, pydantic only reads from dictionary.
        # from_attributes = True allows it to read from class attributes too.


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=10)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(default=None, min_length=10)
    weekly_email: Optional[bool] = None
    monthly_email: Optional[bool] = None
    timezone: Optional[str] = None


