"""Storage interface as a structural Protocol.

Routers / auth code should depend on this Protocol, NOT on a concrete class.
That way the Phase 2 PostgreSQL backend can drop in by implementing the same
methods, with no type annotations to hunt down.

We use ``runtime_checkable`` so tests can assert at import time that a given
backend satisfies the interface (catches "forgot to implement a method" bugs
without hitting a router).

Phase 9 (Issue #4): All methods are now ``async def`` to support the
asyncpg + AsyncSession storage layer.  InMemoryStorage uses trivial
``async def`` wrappers (no IO), while PostgresStorage uses AsyncSession.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from cdx_server.storage import (
    DeviceRecord,
    DeviceTokenRecord,
    HeartbeatRecord,
    InventoryRecord,
    IsoBuildAuditRecord,
    IsoBuildJobRecord,
    PolicyRecord,
    RegistrationTokenRecord,
    SerialScanQueueRecord,
)

__all__ = [
    "IsoBuildStorage",
    "RegistrationTokenStorage",
    "SerialScanStorage",
    "Storage",
]


@runtime_checkable
class Storage(Protocol):
    async def register_device(
        self,
        *,
        device_id: str,
        profile: str,
        hostname: str,
        shared_secret: str,
    ) -> tuple[DeviceRecord, bool]: ...

    async def get_device(self, device_id: str) -> DeviceRecord | None: ...

    async def record_heartbeat(
        self,
        *,
        device_id: str,
        timestamp_bucket: int,
        agent_version: str,
        uptime_seconds: int,
        sent_at: str,
    ) -> tuple[HeartbeatRecord, bool]: ...

    async def count_heartbeats(self) -> int: ...

    async def record_inventory(
        self,
        *,
        device_id: str,
        timestamp_bucket: int,
        body: dict[str, object],
    ) -> tuple[InventoryRecord, bool]: ...

    async def count_inventories(self) -> int: ...

    async def get_policy(self, profile: str) -> PolicyRecord | None: ...

    async def list_devices(self) -> list[DeviceRecord]: ...

    async def list_heartbeats(
        self, device_id: str, *, limit: int = 20
    ) -> list[HeartbeatRecord]: ...

    async def list_inventories(
        self, device_id: str, *, limit: int = 5
    ) -> list[InventoryRecord]: ...

    async def ping(self) -> bool:
        """Return True if the storage backend is reachable, raise on failure."""
        ...


@runtime_checkable
class IsoBuildStorage(Protocol):
    """Persistence Protocol for the Phase 2 ISO Builder UI (Issue 0022/0024).

    Kept as a separate Protocol so that backends can adopt it independently —
    the in-memory ``InMemoryStorage`` (used by Phase 1 unit tests) does not
    need to support ISO builds, while the production ``PostgresStorage``
    implements both ``Storage`` and ``IsoBuildStorage``.

    Phase 9 (Issue #4): All methods are now ``async def``.
    """

    # ---- jobs ---------------------------------------------------------------

    async def insert_iso_build_job(
        self,
        *,
        job_id: str,
        profile: str,
        requested_by: str,
        git_ref: str,
        notes: str | None = None,
    ) -> IsoBuildJobRecord:
        """Insert a queued job and return the persisted record."""
        ...

    async def get_iso_build_job(self, job_id: str) -> IsoBuildJobRecord | None: ...

    async def list_iso_build_jobs(
        self,
        *,
        profile: str | None = None,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[IsoBuildJobRecord]: ...

    async def count_iso_build_jobs(self, *, status: str | None = None) -> int: ...

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
        """Apply a partial update; ``None`` arguments leave the column untouched."""
        ...

    # ---- audit --------------------------------------------------------------

    async def append_iso_build_audit(
        self,
        *,
        job_id: str,
        actor: str,
        action: str,
        request_id: str | None = None,
    ) -> IsoBuildAuditRecord: ...

    async def list_iso_build_audit(
        self,
        *,
        job_id: str | None = None,
        actor: str | None = None,
        limit: int = 50,
    ) -> list[IsoBuildAuditRecord]: ...


@runtime_checkable
class SerialScanStorage(Protocol):
    """Persistence Protocol for the serial-scan OCR queue (Issue 0052).

    The GMSV0002 SMB→easyocr pipeline stores intermediate items in a queue
    awaiting operator confirmation. This Protocol is implemented by
    ``PostgresStorage`` so items survive a process restart. ``InMemoryStorage``
    deliberately does NOT implement it: the ``serial_scan`` router falls back
    to its in-memory dict when this Protocol is unavailable, preserving the
    Phase 1 dev/CI behavior (no DB required).
    """

    async def insert_serial_scan_item(
        self,
        *,
        item_id: str,
        filename: str,
        serial_extracted: str,
    ) -> SerialScanQueueRecord:
        """Insert a new pending item. ``serial_confirmed`` mirrors ``serial_extracted`` initially."""
        ...

    async def get_serial_scan_item(self, item_id: str) -> SerialScanQueueRecord | None: ...

    async def list_serial_scan_items(
        self,
        *,
        status: str | None = None,
        limit: int = 100,
    ) -> list[SerialScanQueueRecord]: ...

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
        """Mark item as confirmed and capture operator inputs. Returns updated row or None."""
        ...

    async def discard_serial_scan_item(self, item_id: str) -> bool:
        """Mark item as discarded. Returns True on success, False if not found."""
        ...


@runtime_checkable
class RegistrationTokenStorage(Protocol):
    """Persistence Protocol for ephemeral registration tokens (Issue 0042 Phase 4.3).

    Kept separate from ``Storage`` and ``IsoBuildStorage`` so that
    ``PostgresStorage`` can adopt it independently.  ``InMemoryStorage``
    satisfies all three Protocols via structural typing.

    Phase 9 (Issue #4): All methods are ``async def``.
    """

    async def create_registration_token(
        self,
        *,
        profile: str,
        fingerprint: str,
        ttl_seconds: int = 86400,
    ) -> RegistrationTokenRecord: ...

    async def consume_registration_token(
        self, token: str
    ) -> RegistrationTokenRecord | None: ...

    async def rotate_device_token(
        self,
        device_id: str,
        *,
        ttl_seconds: int = 172800,
    ) -> DeviceTokenRecord: ...

    async def get_device_token(self, device_id: str) -> DeviceTokenRecord | None: ...
