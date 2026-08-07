"""SQLAlchemy session management.

Uses cdx-shared-db base if available, otherwise falls back to local
configuration. Provides FastAPI dependency `get_db`.
"""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from itsm_api.config import get_settings

try:  # Prefer shared DB module when available
    from cdx_shared_db.base import Base as SharedBase  # type: ignore

    Base = SharedBase
except Exception:  # pragma: no cover - fallback for local dev

    class Base(DeclarativeBase):
        pass


settings = get_settings()
engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
