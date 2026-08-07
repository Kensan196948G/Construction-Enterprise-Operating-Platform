"""SyncEngine dispatch / コンフリクト解決 単体テスト.

DB を起こさずに ``dispatch`` を直接テストするため、AsyncSession をモックする。
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from site_api.schemas.common import SyncEnvelopeItem
from site_api.services.sync_engine import SyncEngine


class _FakeSession:
    """SQLAlchemy AsyncSession の最低限のモック."""

    def __init__(self, existing: dict[tuple[type, Any], Any] | None = None) -> None:
        self.existing = existing or {}
        self.added: list[Any] = []
        self.deleted: list[Any] = []

    async def get(self, model: type, oid: Any) -> Any:
        return self.existing.get((model, oid))

    def add(self, obj: Any) -> None:
        # id を割り当てた風にする
        if not getattr(obj, "id", None):
            obj.id = 999
        self.added.append(obj)

    async def delete(self, obj: Any) -> None:
        self.deleted.append(obj)

    async def flush(self) -> None:
        return None


def _engine(session: _FakeSession) -> SyncEngine:
    return SyncEngine(session)  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_dispatch_project_create() -> None:
    session = _FakeSession()
    engine = _engine(session)
    item = SyncEnvelopeItem(
        entity_type="project",
        operation="create",
        data={"project_code": "P-001", "project_name": "テスト現場"},
        client_timestamp=datetime.now(tz=timezone.utc),
        client_version=1,
    )
    res = await engine.dispatch(item)
    assert res.status == "synced"
    assert res.entity_type == "project"
    assert res.server_id == 999
    assert len(session.added) == 1
    assert session.added[0].project_code == "P-001"


@pytest.mark.asyncio
async def test_dispatch_schedule_update_conflict() -> None:
    """サーバー側 updated_at がクライアントより新しい → conflict."""
    from site_api.models.schedule import ScheduleTask

    server_ts = datetime.now(tz=timezone.utc)
    client_ts = server_ts - timedelta(minutes=5)
    existing = MagicMock(spec=ScheduleTask)
    existing.id = 7
    existing.updated_at = server_ts
    existing.sync_version = 3
    session = _FakeSession({(ScheduleTask, 7): existing})
    engine = _engine(session)
    item = SyncEnvelopeItem(
        entity_type="schedule",
        operation="update",
        data={"id": 7, "task_name": "outdated"},
        client_timestamp=client_ts,
        client_version=2,
    )
    res = await engine.dispatch(item)
    assert res.status == "conflict"
    assert res.server_id == 7
    assert res.conflict_detail is not None
    assert res.conflict_detail["sync_version"] == 3


@pytest.mark.asyncio
async def test_dispatch_daily_report_update_accepted() -> None:
    from site_api.models.daily_report import DailySiteReport

    server_ts = datetime.now(tz=timezone.utc) - timedelta(hours=1)
    client_ts = datetime.now(tz=timezone.utc)
    existing = MagicMock(spec=DailySiteReport)
    existing.id = 3
    existing.updated_at = server_ts
    existing.sync_version = 1
    existing.weather = "old"
    session = _FakeSession({(DailySiteReport, 3): existing})
    engine = _engine(session)
    item = SyncEnvelopeItem(
        entity_type="daily_report",
        operation="update",
        data={"id": 3, "weather": "晴れ"},
        client_timestamp=client_ts,
        client_version=2,
    )
    res = await engine.dispatch(item)
    assert res.status == "synced"
    assert existing.weather == "晴れ"
    assert existing.sync_version == 2


@pytest.mark.asyncio
async def test_dispatch_photo_create() -> None:
    session = _FakeSession()
    engine = _engine(session)
    item = SyncEnvelopeItem(
        entity_type="photo",
        operation="create",
        data={"project_id": 1, "file_path": "/tmp/x.jpg"},
        client_timestamp=datetime.now(tz=timezone.utc),
        client_version=1,
    )
    res = await engine.dispatch(item)
    assert res.status == "synced"
    assert session.added[0].file_path == "/tmp/x.jpg"


@pytest.mark.asyncio
async def test_dispatch_attendance_create() -> None:
    session = _FakeSession()
    engine = _engine(session)
    item = SyncEnvelopeItem(
        entity_type="attendance",
        operation="create",
        data={"project_id": 1, "worker_name": "山田"},
        client_timestamp=datetime.now(tz=timezone.utc),
        client_version=1,
    )
    res = await engine.dispatch(item)
    assert res.status == "synced"
    assert session.added[0].worker_name == "山田"


@pytest.mark.asyncio
async def test_dispatch_equipment_create() -> None:
    session = _FakeSession()
    engine = _engine(session)
    item = SyncEnvelopeItem(
        entity_type="equipment",
        operation="create",
        data={"equipment_name": "ユンボA"},
        client_timestamp=datetime.now(tz=timezone.utc),
        client_version=1,
    )
    res = await engine.dispatch(item)
    assert res.status == "synced"
    assert session.added[0].equipment_name == "ユンボA"


@pytest.mark.asyncio
async def test_dispatch_blackboard_create() -> None:
    session = _FakeSession()
    engine = _engine(session)
    item = SyncEnvelopeItem(
        entity_type="blackboard",
        operation="create",
        data={"project_name": "現場A", "measurement_point": "杭#3"},
        client_timestamp=datetime.now(tz=timezone.utc),
        client_version=1,
    )
    res = await engine.dispatch(item)
    assert res.status == "synced"


@pytest.mark.asyncio
async def test_dispatch_unknown_entity() -> None:
    session = _FakeSession()
    engine = _engine(session)
    item = SyncEnvelopeItem(
        entity_type="bogus",
        operation="create",
        data={},
    )
    res = await engine.dispatch(item)
    assert res.status == "error"
    assert "unknown" in (res.error or "")


@pytest.mark.asyncio
async def test_process_batch_grouping() -> None:
    """accepted/conflicts/rejected の分類が正しいか."""
    from site_api.models.schedule import ScheduleTask

    # 1) 新規 project (synced) 2) conflict schedule 3) unknown entity (rejected)
    server_ts = datetime.now(tz=timezone.utc)
    client_ts = server_ts - timedelta(hours=1)
    existing = MagicMock(spec=ScheduleTask)
    existing.id = 1
    existing.updated_at = server_ts
    existing.sync_version = 2
    session = _FakeSession({(ScheduleTask, 1): existing})
    # log は SyncLog のため add で受ける ⇒ そのまま動く
    engine = _engine(session)

    # log() を NoOp に差し替え (DB を触らない)
    engine.log = AsyncMock(return_value=None)  # type: ignore[method-assign]

    items = [
        SyncEnvelopeItem(
            entity_type="project",
            operation="create",
            data={"project_code": "P", "project_name": "N"},
            client_timestamp=datetime.now(tz=timezone.utc),
        ),
        SyncEnvelopeItem(
            entity_type="schedule",
            operation="update",
            data={"id": 1, "task_name": "stale"},
            client_timestamp=client_ts,
        ),
        SyncEnvelopeItem(
            entity_type="bogus",
            operation="create",
            data={},
        ),
    ]
    grouped = await engine.process_batch("dev-1", items)
    assert len(grouped["accepted"]) == 1
    assert len(grouped["conflicts"]) == 1
    assert len(grouped["rejected"]) == 1
