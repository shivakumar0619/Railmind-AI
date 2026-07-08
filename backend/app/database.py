"""Database engine and session configuration (synchronous SQLAlchemy).

Uses lazy initialization so the module can be imported without
requiring an active database connection. The engine is created on
first call to get_engine().
"""

from collections.abc import Generator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    """Return the SQLAlchemy engine, creating it on first call."""
    global _engine
    if _engine is None:
        from app.config import get_settings

        settings = get_settings()
        _engine = create_engine(
            settings.database_url,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            pool_pre_ping=True,
            echo=settings.app_debug,
        )
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    """Return the session factory, creating it on first call."""
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            bind=get_engine(),
            autocommit=False,
            autoflush=False,
            expire_on_commit=False,
        )
    return _session_factory


def get_db() -> Generator[Session, None, None]:
    """Yield a database session for FastAPI dependency injection."""
    factory = get_session_factory()
    db = factory()
    try:
        yield db
    finally:
        db.close()
