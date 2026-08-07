"""オフライン同期 (push/pull/status)."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import SyncLog
from ..schemas.common import SyncPushRequest, SyncPushResponse, SyncResultItem
from ..services.sync_engine import SyncEngine

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/push", response_model=SyncPushResponse)
async def sync_push(
    body: SyncPushRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SyncPushResponse:
    """クライアントからのオフラインバッチを受領.

    実 entity への反映は entity_type ごとに個別実装する想定。本骨格では
    SyncLog 書込と「synced」結果を返すだけ。
    """
    engine = SyncEngine(session)
    grouped = await engine.process_batch(body.device_id, list(body.sync_batch))
    all_results: list[SyncResultItem] = (
        grouped["accepted"] + grouped["conflicts"] + grouped["rejected"]
    )
    return SyncPushResponse(
        results=all_results,
        accepted=grouped["accepted"],
        conflicts=grouped["conflicts"],
        rejected=grouped["rejected"],
    )


@router.get("/pull")
async def sync_pull(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    since: datetime | None = None,
) -> dict[str, Any]:
    """サーバー側の更新を pull する (差分同期).

    `since` 以降に更新された各エンティティの ID 一覧を返す。
    実取得は各 routes が担う。
    """
    since = since or datetime(1970, 1, 1, tzinfo=timezone.utc)
    return {
        "since": since.isoformat(),
        "entities": {
            "projects": [],
            "schedules": [],
            "daily_reports": [],
            "photos": [],
            "progress": [],
        },
    }


@router.get("/status")
async def sync_status(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    device_id: str | None = None,
) -> dict[str, Any]:
    stmt = select(SyncLog).order_by(desc(SyncLog.id)).limit(50)
    if device_id:
        stmt = stmt.where(SyncLog.device_id == device_id)
    logs = (await session.execute(stmt)).scalars().all()
    return {
        "device_id": device_id,
        "recent": [
            {
                "id": log.id,
                "entity_type": log.entity_type,
                "operation": log.operation,
                "status": log.status,
                "server_timestamp": log.server_timestamp.isoformat() if log.server_timestamp else None,
            }
            for log in logs
        ],
    }
