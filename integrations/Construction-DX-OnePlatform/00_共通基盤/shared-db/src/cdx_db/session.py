"""非同期 SQLAlchemy セッションファクトリ。"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from .config import DBSettings, get_db_settings

_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def get_engine(settings: DBSettings | None = None) -> AsyncEngine:
    """プロセス内で 1 つだけ AsyncEngine を保持する。"""
    global _engine
    if _engine is None:
        s = settings or get_db_settings()
        _engine = create_async_engine(
            s.async_dsn,
            pool_size=s.pool_size,
            max_overflow=s.max_overflow,
            echo=s.echo_sql,
            pool_pre_ping=True,
            future=True,
        )
    return _engine


def get_sessionmaker(
    settings: DBSettings | None = None,
) -> async_sessionmaker[AsyncSession]:
    """AsyncSession ファクトリ。"""
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(
            bind=get_engine(settings),
            expire_on_commit=False,
            autoflush=False,
            class_=AsyncSession,
        )
    return _sessionmaker


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    """`async with session_scope() as session:` で利用する。"""
    sm = get_sessionmaker()
    session = sm()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def dispose_engine() -> None:
    """テスト終了時などにコネクションプールを破棄する。"""
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None
