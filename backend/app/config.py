"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "postgresql+psycopg://railmind:railmind@localhost:5432/railmind"
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Security
    jwt_secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_STRING"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # CORS — allow all origins in development
    cors_origins: list[str] = ["*"]

    # Application
    app_name: str = "RailMind AI"
    app_env: str = "development"
    app_debug: bool = False
    app_version: str = "0.1.0"

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
