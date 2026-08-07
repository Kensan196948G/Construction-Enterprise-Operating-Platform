"""DB セッション依存性 (cdx-shared-db ラッパー)."""
from __future__ import annotations

from collections.abc import AsyncIterator

from cdx_db.session import get_sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession


async def get_db_session() -> AsyncIterator[AsyncSession]:
    """FastAPI 依存性: リクエストスコープの AsyncSession を yield する."""
    sm = get_sessionmaker()
    session: AsyncSession = sm()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
