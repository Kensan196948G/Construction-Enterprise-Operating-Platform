"""Unit tests for app.core.access_control — IDOR 防止ヘルパー"""

from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.access_control import assert_project_access
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.rbac import UserRole
from app.db.base import Base
from app.models.project import Project
from app.models.user import User

# ---------------------------------------------------------------------------
# DB setup
# ---------------------------------------------------------------------------

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

ADMIN_ID = uuid.UUID("00000000-0000-0000-0001-000000000001")
PM_ID = uuid.UUID("00000000-0000-0000-0001-000000000002")
OTHER_PM_ID = uuid.UUID("00000000-0000-0000-0001-000000000003")
VIEWER_ID = uuid.UUID("00000000-0000-0000-0001-000000000099")
PROJECT_ID = uuid.UUID("00000000-0000-0000-0001-aaaaaaaaaaaa")
NONEXISTENT_PROJECT_ID = uuid.UUID("00000000-0000-0000-0001-bbbbbbbbbbbb")


def _make_user(user_id: uuid.UUID, role: UserRole) -> User:
    # Use the last 12 hex chars of the UUID to keep emails unique even when
    # two users share the same role (e.g. PM_ID and OTHER_PM_ID).
    uid_suffix = str(user_id).replace("-", "")[-12:]
    return User(
        id=user_id,
        email=f"{role.value}-{uid_suffix}@test.example.com",
        full_name=f"Test {role.value}",
        hashed_password="hashed",
        role=role.value,
        is_active=True,
    )


@pytest_asyncio.fixture
async def session():
    """Fresh in-memory SQLite session pre-populated with test data."""
    engine = create_async_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as sess:
        # Users
        sess.add(_make_user(ADMIN_ID, UserRole.ADMIN))
        sess.add(_make_user(PM_ID, UserRole.PROJECT_MANAGER))
        sess.add(_make_user(OTHER_PM_ID, UserRole.PROJECT_MANAGER))

        # Project owned by PM_ID
        sess.add(
            Project(
                id=PROJECT_ID,
                project_code="TEST-001",
                name="テストプロジェクト",
                client_name="テストクライアント",
                status="ACTIVE",
                manager_id=PM_ID,
            )
        )
        await sess.commit()
        yield sess
        await sess.rollback()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_bypasses_ownership(session: AsyncSession):
    """ADMIN ロールはプロジェクト所有者チェックをバイパスする。"""
    admin = _make_user(ADMIN_ID, UserRole.ADMIN)
    # Should not raise
    await assert_project_access(admin, PROJECT_ID, session)


@pytest.mark.asyncio
async def test_admin_nonexistent_project_raises_not_found(session: AsyncSession):
    """ADMIN も存在しないプロジェクトでは NotFoundError になる。

    ADMIN は ownership チェック（manager_id 一致）をバイパスするが、
    プロジェクト自体の存在チェックはバイパスしない。
    存在しないリソースへの暗黙の成功は information leakage の温床になるため、
    全ロールに対して一律に NotFoundError を返す設計とする。
    """
    admin = _make_user(ADMIN_ID, UserRole.ADMIN)
    with pytest.raises(NotFoundError):
        await assert_project_access(admin, NONEXISTENT_PROJECT_ID, session)


@pytest.mark.asyncio
async def test_pm_owner_passes(session: AsyncSession):
    """PROJECT_MANAGER が自分の manager_id プロジェクトにアクセスできる。"""
    pm = _make_user(PM_ID, UserRole.PROJECT_MANAGER)
    await assert_project_access(pm, PROJECT_ID, session)


@pytest.mark.asyncio
async def test_pm_non_owner_raises_forbidden(session: AsyncSession):
    """他プロジェクトの PROJECT_MANAGER は ForbiddenError になる。"""
    other_pm = _make_user(OTHER_PM_ID, UserRole.PROJECT_MANAGER)
    with pytest.raises(ForbiddenError):
        await assert_project_access(other_pm, PROJECT_ID, session)


@pytest.mark.asyncio
async def test_nonexistent_project_raises_not_found(session: AsyncSession):
    """存在しないプロジェクト UUID は NotFoundError を返す（ADMIN 以外）。"""
    pm = _make_user(PM_ID, UserRole.PROJECT_MANAGER)
    with pytest.raises(NotFoundError):
        await assert_project_access(pm, NONEXISTENT_PROJECT_ID, session)


@pytest.mark.asyncio
async def test_viewer_non_owner_raises_forbidden(session: AsyncSession):
    """VIEWER も非オーナーであれば ForbiddenError になる。"""
    viewer = _make_user(VIEWER_ID, UserRole.VIEWER)
    with pytest.raises(ForbiddenError):
        await assert_project_access(viewer, PROJECT_ID, session)
