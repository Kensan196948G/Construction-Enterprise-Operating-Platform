"""DB session via cdx-shared-db, with local fallback."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from ..config import settings

try:  # pragma: no cover
    from cdx_db import get_engine  # type: ignore

    engine = get_engine(settings.database_url)
except Exception:  # pragma: no cover
    engine = create_engine(settings.database_url, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
