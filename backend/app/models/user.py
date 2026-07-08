"""User model with role-based access control and password hashing."""

import enum

import bcrypt
from sqlalchemy import Boolean, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models import BaseModel


class UserRole(str, enum.Enum):
    """Enumeration of user roles for RBAC."""

    ADMINISTRATOR = "administrator"
    DISPATCHER = "dispatcher"
    OPERATOR = "operator"
    MAINTENANCE_ENGINEER = "maintenance_engineer"
    VIEWER = "viewer"


class User(BaseModel):
    """Platform user with authentication credentials and role assignment.

    Attributes:
        username: Unique login identifier.
        email: Unique email address.
        full_name: Display name.
        hashed_password: bcrypt-hashed password (never stored in plain text).
        role: Assigned role for RBAC.
        is_active: Whether the user can authenticate.
        is_verified: Whether the email has been verified.
    """

    __tablename__ = "users"

    username: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=False, length=30),
        default=UserRole.VIEWER,
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)

    def set_password(self, plain_password: str) -> None:
        """Hash and store a plain-text password using bcrypt."""
        salt = bcrypt.gensalt(rounds=12)
        self.hashed_password = bcrypt.hashpw(
            plain_password.encode("utf-8"), salt
        ).decode("utf-8")

    def verify_password(self, plain_password: str) -> bool:
        """Verify a plain-text password against the stored hash."""
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            self.hashed_password.encode("utf-8"),
        )

    def __repr__(self) -> str:
        return f"<User(id={self.id!r}, username={self.username!r}, role={self.role.value!r})>"
