"""Database engine and session factory for policy-service.

Priority: DATABASE_URL > SQLITE_DB > sqlite:///:memory: (tests)
"""
from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

def _resolve_db_config(
    database_url: str = "", sqlite_raw: str = ""
) -> tuple[str, dict]:
    """Return (DB_URL, engine_kwargs) from env-var values.

    Priority: DATABASE_URL > SQLITE_DB > sqlite:///:memory:
    """
    database_url = database_url.strip()
    sqlite_raw = sqlite_raw.strip()
    if database_url:
        return database_url, {}
    if not sqlite_raw:
        return "sqlite:///:memory:", {
            "connect_args": {"check_same_thread": False},
            "poolclass": StaticPool,
        }
    if sqlite_raw.startswith("sqlite"):
        return sqlite_raw, {"connect_args": {"check_same_thread": False}}
    return f"sqlite:///{sqlite_raw}", {"connect_args": {"check_same_thread": False}}


DB_URL, _engine_kwargs = _resolve_db_config(
    database_url=os.environ.get("DATABASE_URL", "").strip(),
    sqlite_raw=os.environ.get("SQLITE_DB", "").strip(),
)

engine = create_engine(DB_URL, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from . import orm_models  # noqa: F401 - register models
    Base.metadata.create_all(bind=engine)
