"""PostgreSQL storage backend for cdx-server Phase 9 (Issue #4).

Drop-in replacement for :class:`cdx_server.storage.InMemoryStorage`.
Implements the :class:`cdx_server.storage_protocol.Storage` and
:class:`cdx_server.storage_protocol.IsoBuildStorage` Protocols using
SQLAlchemy 2.x **async** core (``AsyncSession`` + ``asyncpg`` driver).

Configuration
-------------
Pass a database URL to the constructor::

    from cdx_server.storage_pg import PostgresStorage

    # Production (asyncpg):
    storage = PostgresStorage("postgresql+asyncpg://cdx:secret@localhost/cdx")

    # Tests (aiosqlite — no Postgres required):
    storage = PostgresStorage("sqlite+aiosqlite:///cdx_test.db")

Bootstrap (table creation + seed) is handled lazily on first use via
``_ensure_ready()``, which is called at the start of every coroutine that
touches the database.  This removes the need for a sync bootstrap call in
``create_app`` and works correctly whether the app is constructed at import
time (module-level ``app = create_app()``) or at test time.

Phase 1 compatibility note
---------------------------
``register_device`` stores ``shared_secret`` verbatim in the ``shared_secret``
column so that the HMAC-SHA256 verification path keeps working (hash would
break HMAC).  Column was renamed from ``shared_secret_hash`` in Issue 0018.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from cdx_server.models import (
    Base,
    DeviceModel,
    HeartbeatModel,
    InventoryModel,
    IsoBuildAuditModel,
    IsoBuildJobModel,
    PolicyModel,
    SerialScanQueueModel,
)
from cdx_server.storage import (
    DeviceRecord,
    HeartbeatRecord,
    InventoryRecord,
    IsoBuildAuditRecord,
    IsoBuildJobRecord,
    PolicyRecord,
    SerialScanQueueRecord,
)

logger = logging.getLogger(__name__)

# Phase 1 defaults seeded into the policies table on first startup.
_DEFAULT_POLICY_ROWS = [
    {
        "profile": "standard",
        "update_ring": "ring1",
        "heartbeat_interval_seconds": 60,
        "inventory_interval_seconds": 3600,
        "policy_version": 1,
    },
    {
        "profile": "field",
        "update_ring": "ring2",
        "heartbeat_interval_seconds": 60,
        "inventory_interval_seconds": 3600,
        "policy_version": 1,
    },
    {
        "profile": "kiosk",
        "update_ring": "ring1",
        "heartbeat_interval_seconds": 60,
        "inventory_interval_seconds": 3600,
        "policy_version": 1,
    },
]


async def _upsert_ignore_async(session: AsyncSession, model_class: Any, values: dict) -> None:
    """Insert a row; silently ignore if PK already exists (ON CONFLICT DO NOTHING)."""
    bind = await session.connection()
    dialect = bind.dialect.name
    if dialect == "postgresql":
        stmt = pg_insert(model_class).values(**values).on_conflict_do_nothing()
    else:
        # SQLite fallback (used in tests with aiosqlite)
        stmt = sqlite_insert(model_class).values(**values).prefix_with("OR IGNORE")
    await session.execute(stmt)


class PostgresStorage:
    """Async SQLAlchemy-backed storage implementing the Storage + IsoBuildStorage Protocols."""

    def __init__(self, database_url: str) -> None:
        # Normalise sync URLs to their async drivers so callers can pass
        # either form without having to know the driver suffix.
        db_url = _normalise_url(database_url)
        self._engine: AsyncEngine = create_async_engine(
            db_url,
            pool_pre_ping=True,
            # aiosqlite doesn't support pool_size / max_overflow; skip those
            # kwargs for SQLite to avoid a TypeError.
            **(_pool_kwargs(db_url)),
        )
        self._session_factory = sessionmaker(  # type: ignore[call-overload]
            self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        self._ready = False

    # ---- bootstrap ----------------------------------------------------------

    async def _ensure_ready(self) -> None:
        """Create tables and seed defaults on first use (idempotent)."""
        if self._ready:
            return
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await self._seed_defaults()
        self._ready = True

    async def _seed_defaults(self) -> None:
        """Seed default policies if they don't already exist."""
        async with self._session_factory() as session:
            for row_values in _DEFAULT_POLICY_ROWS:
                await _upsert_ignore_async(session, PolicyModel, row_values)
            await session.commit()

    # ---- device registry ----------------------------------------------------

    async def register_device(
        self,
        *,
        device_id: str,
        profile: str,
        hostname: str,
        shared_secret: str,
    ) -> tuple[DeviceRecord, bool]:
        await self._ensure_ready()
        now = datetime.now(UTC)
        async with self._session_factory() as session:
            existing = await session.get(DeviceModel, device_id)
            if existing is not None:
                return _device_to_record(existing), True
            row = DeviceModel(
                device_id=device_id,
                profile=profile,
                hostname=hostname,
                shared_secret=shared_secret,
                registered_at=now,
            )
            session.add(row)
            await session.commit()
            await session.refresh(row)
            return _device_to_record(row), False

    async def get_device(self, device_id: str) -> DeviceRecord | None:
        await self._ensure_ready()
        async with self._session_factory() as session:
            row = await session.get(DeviceModel, device_id)
            if row is None:
                return None
            return _device_to_record(row)

    # ---- heartbeat ----------------------------------------------------------

    async def record_heartbeat(
        self,
        *,
        device_id: str,
        timestamp_bucket: int,
        agent_version: str,
        uptime_seconds: int,
        sent_at: str,
    ) -> tuple[HeartbeatRecord, bool]:
        await self._ensure_ready()
        now = datetime.now(UTC)
        async with self._session_factory() as session:
            result = await session.execute(
                select(HeartbeatModel).where(
                    HeartbeatModel.device_id == device_id,
                    HeartbeatModel.timestamp_bucket == timestamp_bucket,
                )
            )
            existing = result.scalar_one_or_none()
            if existing is not None:
                return _heartbeat_to_record(existing), True
            row = HeartbeatModel(
                device_id=device_id,
                timestamp_bucket=timestamp_bucket,
                agent_version=agent_version,
                uptime_seconds=uptime_seconds,
                sent_at=sent_at,
                received_at=now,
            )
            session.add(row)
            await session.commit()
            await session.refresh(row)
            return _heartbeat_to_record(row), False

    async def count_heartbeats(self) -> int:
        await self._ensure_ready()
        async with self._session_factory() as session:
            result = await session.execute(select(func.count()).select_from(HeartbeatModel))
            return int(result.scalar_one())

    # ---- inventory ----------------------------------------------------------

    async def record_inventory(
        self,
        *,
        device_id: str,
        timestamp_bucket: int,
        body: dict[str, object],
    ) -> tuple[InventoryRecord, bool]:
        await self._ensure_ready()
        now = datetime.now(UTC)
        async with self._session_factory() as session:
            result = await session.execute(
                select(InventoryModel).where(
                    InventoryModel.device_id == device_id,
                    InventoryModel.timestamp_bucket == timestamp_bucket,
                )
            )
            existing = result.scalar_one_or_none()
            if existing is not None:
                return _inventory_to_record(existing), True
            row = InventoryModel(
                device_id=device_id,
                timestamp_bucket=timestamp_bucket,
                body=body,
                received_at=now,
            )
            session.add(row)
            await session.commit()
            await session.refresh(row)
            return _inventory_to_record(row), False

    async def count_inventories(self) -> int:
        await self._ensure_ready()
        async with self._session_factory() as session:
            result = await session.execute(select(func.count()).select_from(InventoryModel))
            return int(result.scalar_one())

    # ---- policy -------------------------------------------------------------

    async def get_policy(self, profile: str) -> PolicyRecord | None:
        await self._ensure_ready()
        async with self._session_factory() as session:
            row = await session.get(PolicyModel, profile)
            if row is None:
                return None
            return PolicyRecord(
                profile=row.profile,
                update_ring=row.update_ring,
                heartbeat_interval_seconds=row.heartbeat_interval_seconds,
                inventory_interval_seconds=row.inventory_interval_seconds,
                policy_version=row.policy_version,
            )

    async def list_devices(self) -> list[DeviceRecord]:
        """Return all registered devices, newest-first."""
        await self._ensure_ready()
        async with self._session_factory() as session:
            result = await session.execute(
                select(DeviceModel).order_by(DeviceModel.registered_at.desc())
            )
            rows = result.scalars().all()
            return [_device_to_record(r) for r in rows]

    async def list_heartbeats(self, device_id: str, *, limit: int = 20) -> list[HeartbeatRecord]:
        """Return the most-recent heartbeats for *device_id*."""
        await self._ensure_ready()
        async with self._session_factory() as session:
            result = await session.execute(
                select(HeartbeatModel)
                .where(HeartbeatModel.device_id == device_id)
                .order_by(HeartbeatModel.timestamp_bucket.desc())
                .limit(limit)
            )
            rows = result.scalars().all()
            return [_heartbeat_to_record(r) for r in rows]

    async def list_inventories(self, device_id: str, *, limit: int = 5) -> list[InventoryRecord]:
        """Return the most-recent inventory snapshots for *device_id*."""
        await self._ensure_ready()
        async with self._session_factory() as session:
            result = await session.execute(
                select(InventoryModel)
                .where(InventoryModel.device_id == device_id)
                .order_by(InventoryModel.timestamp_bucket.desc())
                .limit(limit)
            )
            rows = result.scalars().all()
            return [_inventory_to_record(r) for r in rows]

    async def ping(self) -> bool:
        """Issue a lightweight SELECT 1 to verify the database is reachable."""
        await self._ensure_ready()
        async with self._session_factory() as session:
            await session.execute(text("SELECT 1"))
            return True

    # ---- ISO build jobs (Phase 2, Issue 0022/0024) --------------------------

    async def insert_iso_build_job(
        self,
        *,
        job_id: str,
        profile: str,
        requested_by: str,
        git_ref: str,
        notes: str | None = None,
    ) -> IsoBuildJobRecord:
        await self._ensure_ready()
        now = datetime.now(UTC)
        async with self._session_factory() as session:
            row = IsoBuildJobModel(
                id=job_id,
                profile=profile,
                requested_by=requested_by,
                status="queued",
                git_ref=git_ref,
                notes=notes,
                created_at=now,
            )
            session.add(row)
            await session.commit()
            await session.refresh(row)
            return _iso_build_job_to_record(row)

    async def get_iso_build_job(self, job_id: str) -> IsoBuildJobRecord | None:
        await self._ensure_ready()
        async with self._session_factory() as session:
            row = await session.get(IsoBuildJobModel, job_id)
            return _iso_build_job_to_record(row) if row is not None else None

    async def list_iso_build_jobs(
        self,
        *,
        profile: str | None = None,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[IsoBuildJobRecord]:
        await self._ensure_ready()
        async with self._session_factory() as session:
            stmt = select(IsoBuildJobModel)
            if profile is not None:
                stmt = stmt.where(IsoBuildJobModel.profile == profile)
            if status is not None:
                stmt = stmt.where(IsoBuildJobModel.status == status)
            stmt = stmt.order_by(IsoBuildJobModel.created_at.desc()).limit(limit).offset(offset)
            result = await session.execute(stmt)
            rows = result.scalars().all()
            return [_iso_build_job_to_record(r) for r in rows]

    async def count_iso_build_jobs(self, *, status: str | None = None) -> int:
        await self._ensure_ready()
        async with self._session_factory() as session:
            stmt = select(func.count()).select_from(IsoBuildJobModel)
            if status is not None:
                stmt = stmt.where(IsoBuildJobModel.status == status)
            result = await session.execute(stmt)
            return int(result.scalar_one())

    async def update_iso_build_job(
        self,
        job_id: str,
        *,
        status: str | None = None,
        started_at: object | None = None,
        finished_at: object | None = None,
        iso_path: str | None = None,
        iso_sha256: str | None = None,
        iso_size_bytes: int | None = None,
        log_path: str | None = None,
        error_message: str | None = None,
    ) -> IsoBuildJobRecord | None:
        # ``None`` means "leave column untouched" (Protocol convention).
        updates: dict[str, object] = {}
        if status is not None:
            updates["status"] = status
        if started_at is not None:
            updates["started_at"] = started_at
        if finished_at is not None:
            updates["finished_at"] = finished_at
        if iso_path is not None:
            updates["iso_path"] = iso_path
        if iso_sha256 is not None:
            updates["iso_sha256"] = iso_sha256
        if iso_size_bytes is not None:
            updates["iso_size_bytes"] = iso_size_bytes
        if log_path is not None:
            updates["log_path"] = log_path
        if error_message is not None:
            updates["error_message"] = error_message

        await self._ensure_ready()
        async with self._session_factory() as session:
            row = await session.get(IsoBuildJobModel, job_id)
            if row is None:
                return None
            for key, value in updates.items():
                setattr(row, key, value)
            await session.commit()
            await session.refresh(row)
            return _iso_build_job_to_record(row)

    async def append_iso_build_audit(
        self,
        *,
        job_id: str,
        actor: str,
        action: str,
        request_id: str | None = None,
    ) -> IsoBuildAuditRecord:
        await self._ensure_ready()
        now = datetime.now(UTC)
        async with self._session_factory() as session:
            row = IsoBuildAuditModel(
                job_id=job_id,
                actor=actor,
                action=action,
                at=now,
                request_id=request_id,
            )
            session.add(row)
            await session.commit()
            await session.refresh(row)
            return _iso_build_audit_to_record(row)

    async def list_iso_build_audit(
        self,
        *,
        job_id: str | None = None,
        actor: str | None = None,
        limit: int = 50,
    ) -> list[IsoBuildAuditRecord]:
        await self._ensure_ready()
        async with self._session_factory() as session:
            stmt = select(IsoBuildAuditModel)
            if job_id is not None:
                stmt = stmt.where(IsoBuildAuditModel.job_id == job_id)
            if actor is not None:
                stmt = stmt.where(IsoBuildAuditModel.actor == actor)
            stmt = stmt.order_by(IsoBuildAuditModel.at.desc()).limit(limit)
            result = await session.execute(stmt)
            rows = result.scalars().all()
            return [_iso_build_audit_to_record(r) for r in rows]

    # ---- serial-scan queue (Issue 0052) -------------------------------------

    async def insert_serial_scan_item(
        self,
        *,
        item_id: str,
        filename: str,
        serial_extracted: str,
    ) -> SerialScanQueueRecord:
        await self._ensure_ready()
        async with self._session_factory() as session:
            row = SerialScanQueueModel(
                id=item_id,
                filename=filename,
                serial_extracted=serial_extracted,
                serial_confirmed=serial_extracted,
                hostname=None,
                profile="standard",
                location="",
                notes="",
                status="pending",
                scanned_at=datetime.now(UTC),
            )
            session.add(row)
            await session.commit()
            await session.refresh(row)
            return _serial_scan_to_record(row)

    async def get_serial_scan_item(self, item_id: str) -> SerialScanQueueRecord | None:
        await self._ensure_ready()
        async with self._session_factory() as session:
            row = await session.get(SerialScanQueueModel, item_id)
            return _serial_scan_to_record(row) if row is not None else None

    async def list_serial_scan_items(
        self,
        *,
        status: str | None = None,
        limit: int = 100,
    ) -> list[SerialScanQueueRecord]:
        await self._ensure_ready()
        async with self._session_factory() as session:
            stmt = select(SerialScanQueueModel)
            if status is not None:
                stmt = stmt.where(SerialScanQueueModel.status == status)
            stmt = stmt.order_by(SerialScanQueueModel.scanned_at.desc()).limit(limit)
            result = await session.execute(stmt)
            rows = result.scalars().all()
            return [_serial_scan_to_record(r) for r in rows]

    async def confirm_serial_scan_item(
        self,
        item_id: str,
        *,
        serial_confirmed: str,
        hostname: str,
        profile: str,
        location: str,
        notes: str,
    ) -> SerialScanQueueRecord | None:
        await self._ensure_ready()
        async with self._session_factory() as session:
            row = await session.get(SerialScanQueueModel, item_id)
            if row is None:
                return None
            row.serial_confirmed = serial_confirmed
            row.hostname = hostname
            row.profile = profile
            row.location = location
            row.notes = notes
            row.status = "confirmed"
            row.confirmed_at = datetime.now(UTC)
            await session.commit()
            await session.refresh(row)
            return _serial_scan_to_record(row)

    async def discard_serial_scan_item(self, item_id: str) -> bool:
        await self._ensure_ready()
        async with self._session_factory() as session:
            row = await session.get(SerialScanQueueModel, item_id)
            if row is None:
                return False
            row.status = "discarded"
            await session.commit()
            return True

    # ---- test helpers -------------------------------------------------------

    async def reset(self) -> None:
        """Drop and recreate all tables (use only in tests)."""
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        self._ready = False
        await self._seed_defaults()
        self._ready = True


# ---- URL helpers ------------------------------------------------------------


def _normalise_url(url: str) -> str:
    """Convert sync driver URLs to their async equivalents if needed.

    Allows callers (e.g. tests, old config) to pass the sync URL without
    knowing which async driver is required.
    """
    if url.startswith("postgresql://") or url.startswith("postgresql+psycopg2://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1).replace(
            "postgresql+psycopg2://", "postgresql+asyncpg://", 1
        )
    if url.startswith("sqlite:///") and "+aiosqlite" not in url:
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    if url == "sqlite://" and "+aiosqlite" not in url:
        return "sqlite+aiosqlite://"
    return url


def _pool_kwargs(db_url: str) -> dict:
    """Return engine pool kwargs appropriate for the dialect.

    aiosqlite / StaticPool does not accept pool_size / max_overflow.
    """
    if "sqlite" in db_url:
        return {}
    return {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_recycle": 300,
        "pool_timeout": 30,
    }


# ---- record converters ------------------------------------------------------


def _device_to_record(row: DeviceModel) -> DeviceRecord:
    return DeviceRecord(
        device_id=row.device_id,
        profile=row.profile,
        hostname=row.hostname,
        shared_secret=row.shared_secret,
        registered_at=row.registered_at,
    )


def _heartbeat_to_record(row: HeartbeatModel) -> HeartbeatRecord:
    return HeartbeatRecord(
        device_id=row.device_id,
        timestamp_bucket=row.timestamp_bucket,
        agent_version=row.agent_version,
        uptime_seconds=row.uptime_seconds,
        sent_at=row.sent_at,
        received_at=row.received_at,
    )


def _inventory_to_record(row: InventoryModel) -> InventoryRecord:
    return InventoryRecord(
        device_id=row.device_id,
        timestamp_bucket=row.timestamp_bucket,
        body=dict(row.body),
        received_at=row.received_at,
    )


def _iso_build_job_to_record(row: IsoBuildJobModel) -> IsoBuildJobRecord:
    return IsoBuildJobRecord(
        id=row.id,
        profile=row.profile,
        requested_by=row.requested_by,
        status=row.status,
        git_ref=row.git_ref,
        started_at=row.started_at,
        finished_at=row.finished_at,
        iso_path=row.iso_path,
        iso_sha256=row.iso_sha256,
        iso_size_bytes=row.iso_size_bytes,
        log_path=row.log_path,
        error_message=row.error_message,
        notes=row.notes,
        created_at=row.created_at,
    )


def _iso_build_audit_to_record(row: IsoBuildAuditModel) -> IsoBuildAuditRecord:
    return IsoBuildAuditRecord(
        id=row.id,
        job_id=row.job_id,
        actor=row.actor,
        action=row.action,
        at=row.at,
        request_id=row.request_id,
    )


def _serial_scan_to_record(row: SerialScanQueueModel) -> SerialScanQueueRecord:
    return SerialScanQueueRecord(
        id=row.id,
        filename=row.filename,
        serial_extracted=row.serial_extracted,
        serial_confirmed=row.serial_confirmed,
        hostname=row.hostname,
        profile=row.profile,
        location=row.location,
        notes=row.notes,
        status=row.status,
        scanned_at=row.scanned_at,
        confirmed_at=row.confirmed_at,
    )
