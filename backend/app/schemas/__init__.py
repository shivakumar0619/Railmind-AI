"""Pydantic schemas for authentication and user data transfer."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Request Schemas ──


class UserRegisterRequest(BaseModel):
    """Schema for user registration."""

    username: str = Field(
        min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$",
        description="Unique username (alphanumeric and underscores only)",
    )
    email: EmailStr = Field(description="Unique email address")
    full_name: str = Field(min_length=1, max_length=100, description="Display name")
    password: str = Field(
        min_length=8, max_length=128,
        description="Password (minimum 8 characters)",
    )
    role: str = Field(
        default="viewer",
        description="User role (administrator, dispatcher, operator, maintenance_engineer, viewer)",
    )


class UserLoginRequest(BaseModel):
    """Schema for user login."""

    username: str = Field(description="Username or email")
    password: str = Field(description="Plain-text password")


class TokenRefreshRequest(BaseModel):
    """Schema for token refresh (refresh token comes from HttpOnly cookie)."""

    pass


class PasswordChangeRequest(BaseModel):
    """Schema for changing password."""

    current_password: str = Field(description="Current password for verification")
    new_password: str = Field(
        min_length=8, max_length=128, description="New password"
    )


# ── Response Schemas ──


class UserResponse(BaseModel):
    """Schema for user data in API responses."""

    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Schema for authentication token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Token expiry in seconds")
    user: UserResponse


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str
    detail: str | None = None
