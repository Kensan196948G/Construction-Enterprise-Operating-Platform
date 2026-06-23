"""In-memory storage backend for cdx-server Phase 1.

The storage interface is fully async so that the same Protocol works for both
the in-memory backend and the asyncpg + AsyncSession PostgreSQL backend
(Phase 9, Issue #4).  In-memory operations are CPU-only (no IO), so wrapping
them in ``async def`` has negligible overhead and no correctness risk.

Thread-safety note: FastAPI runs in an async event loop; the threading lock
used in Phase 1 (sync) is replaced by simple ``async def`` methods — Python's
GIL provides sufficient mutual exclusion for dict operations inside a single
async event loop. If you need thread-pool dispatch you must add asyncio locks.
"""

from __future__ import annotations

import secrets
import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta


@dataclass(frozen=True, slots=True)
class DeviceRecord:
    device_id: str
    profile: str
    hostname: str
    shared_secret: str
    registered_at: datetime


@dataclass(frozen=True, slots=True)
class HeartbeatRecord:
    device_id: str
    timestamp_bucket: int
    agent_version: str
    uptime_seconds: int
    sent_at: str
    received_at: datetime


@dataclass(frozen=True, slots=True)
class InventoryRecord:
    device_id: str
    timestamp_bucket: int
    body: dict[str, object]
    received_at: datetime


@dataclass(frozen=True, slots=True)
class IsoBuildJobRecord:
    """A live-build job (Phase 2 ISO Builder UI, Issue 0022/0024).

    ``status`` follows the Issue 0024 enum: queued → running → succeeded /
    failed / cancelled. Terminal-state jobs keep ``iso_path`` / ``iso_sha256``
    / ``iso_size_bytes`` populated for download; non-terminal jobs leave
    those fields ``None``.
    """

    id: str
    profile: str
    requested_by: str
    status: str
    git_ref: str
    started_at: datetime | None
    finished_at: datetime | None
    iso_path: str | None
    iso_sha256: str | None
    iso_size_bytes: int | None
    log_path: str | None
    error_message: str | None
    notes: str | None
    created_at: datetime


@dataclass(frozen=True, slots=True)
class IsoBuildAuditRecord:
    """Append-only audit entry of an operator action on an ISO build job."""

    id: int
    job_id: str
    actor: str
    action: str
    at: datetime
    request_id: str | None


@dataclass(frozen=True, slots=True)
class SerialScanQueueRecord:
    """One image+OCR-result item awaiting operator confirmation.

    Issue 0052 — persists the GMSV0002 OCR queue so items survive a
    ``cdx-server`` restart. ``status`` follows the lifecycle
    ``pending`` -> ``confirmed`` or ``discarded``.
    """

    id: str
    filename: str
    serial_extracted: str
    serial_confirmed: str | None
    hostname: str | None
    profile: str
    location: str
    notes: str
    status: str
    scanned_at: datetime
    confirmed_at: datetime | None


@dataclass(frozen=True, slots=True)
class PolicyRecord:
    """A concrete policy applied to devices with a given profile.

    ``policy_version`` is monotonic per profile; it bumps on any field change
    so agents can cheaply detect "is my view stale?" without deep-comparing.
    """

    profile: str
    update_ring: str
    heartbeat_interval_seconds: int
    inventory_interval_seconds: int
    policy_version: int


# Phase 1 MVP defaults. These match the conservative cadences documented in
# cdx-agent specs: 60s heartbeat, 1h inventory. Field devices run on Ring 2
# (late updates) so a bad upgrade can be caught on office machines first.
_DEFAULT_POLICIES: dict[str, PolicyRecord] = {
    "standard": PolicyRecord(
        profile="standard",
        update_ring="ring1",
        heartbeat_interval_seconds=60,
        inventory_interval_seconds=3600,
        policy_version=1,
    ),
    "field": PolicyRecord(
        profile="field",
        update_ring="ring2",
        heartbeat_interval_seconds=60,
        inventory_interval_seconds=3600,
        policy_version=1,
    ),
    "kiosk": PolicyRecord(
        profile="kiosk",
        update_ring="ring1",
        heartbeat_interval_seconds=60,
        inventory_interval_seconds=3600,
        policy_version=1,
    ),
}


@dataclass(frozen=True, slots=True)
class RegistrationTokenRecord:
    """Ephemeral token issued to a bootstrapping device (Issue 0042 Phase 4.3).

    Tokens are single-use: ``consumed_at`` is set on first registration call.
    The ``fingerprint`` ties the token to the physical device identity.
    """

    token: str
    profile: str
    fingerprint: str
    created_at: datetime
    expires_at: datetime
    consumed_at: datetime | None = None


@dataclass(frozen=True, slots=True)
class DeviceTokenRecord:
    """Long-lived per-device auth token, replacing the ephemeral registration token."""

    device_id: str
    token: str
    created_at: datetime
    expires_at: datetime


@dataclass(slots=True)
class _State:
    devices: dict[str, DeviceRecord] = field(default_factory=dict)
    heartbeats: dict[tuple[str, int], HeartbeatRecord] = field(default_factory=dict)
    inventories: dict[tuple[str, int], InventoryRecord] = field(default_factory=dict)
    # Policies are keyed by profile name. The default dict is seeded on
    # construction so that get_policy() always has a fallback even for
    # profiles that operators haven't customised yet.
    policies: dict[str, PolicyRecord] = field(default_factory=dict)
    # Registration tokens: keyed by token string (ephemeral, single-use)
    registration_tokens: dict[str, RegistrationTokenRecord] = field(default_factory=dict)
    # Device tokens: keyed by device_id (long-lived, rotatable)
    device_tokens: dict[str, DeviceTokenRecord] = field(default_factory=dict)


class InMemoryStorage:
    """Phase 1 storage backend. Async interface, not durable.

    All methods are ``async def`` to satisfy the Storage Protocol (Phase 9,
    Issue #4).  Operations are purely in-memory (no IO), so they complete
    synchronously inside the coroutine — no ``await`` suspension points.

    Thread-safety: a threading.Lock is retained so that sync test helpers
    (e.g. ``reset()``) and any remaining threadpool-dispatched code stay safe.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._state = _State(policies=dict(_DEFAULT_POLICIES))

    # ---- device registry ----------------------------------------------------

    async def register_device(
        self, *, device_id: str, profile: str, hostname: str, shared_secret: str
    ) -> tuple[DeviceRecord, bool]:
        now = datetime.now(UTC)
        with self._lock:
            existing = self._state.devices.get(device_id)
            if existing is not None:
                return existing, True
            record = DeviceRecord(
                device_id=device_id,
                profile=profile,
                hostname=hostname,
                shared_secret=shared_secret,
                registered_at=now,
            )
            self._state.devices[device_id] = record
            return record, False

    async def get_device(self, device_id: str) -> DeviceRecord | None:
        with self._lock:
            return self._state.devices.get(device_id)

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
        now = datetime.now(UTC)
        key = (device_id, timestamp_bucket)
        with self._lock:
            existing = self._state.heartbeats.get(key)
            if existing is not None:
                return existing, True
            record = HeartbeatRecord(
                device_id=device_id,
                timestamp_bucket=timestamp_bucket,
                agent_version=agent_version,
                uptime_seconds=uptime_seconds,
                sent_at=sent_at,
                received_at=now,
            )
            self._state.heartbeats[key] = record
            return record, False

    async def count_heartbeats(self) -> int:
        with self._lock:
            return len(self._state.heartbeats)

    # ---- inventory ----------------------------------------------------------

    async def record_inventory(
        self,
        *,
        device_id: str,
        timestamp_bucket: int,
        body: dict[str, object],
    ) -> tuple[InventoryRecord, bool]:
        now = datetime.now(UTC)
        key = (device_id, timestamp_bucket)
        with self._lock:
            existing = self._state.inventories.get(key)
            if existing is not None:
                return existing, True
            record = InventoryRecord(
                device_id=device_id,
                timestamp_bucket=timestamp_bucket,
                body=body,
                received_at=now,
            )
            self._state.inventories[key] = record
            return record, False

    async def count_inventories(self) -> int:
        with self._lock:
            return len(self._state.inventories)

    # ---- policy -------------------------------------------------------------

    async def get_policy(self, profile: str) -> PolicyRecord | None:
        """Return the policy for *profile*, or ``None`` if the profile is unknown."""
        with self._lock:
            return self._state.policies.get(profile)

    async def list_devices(self) -> list[DeviceRecord]:
        """Return all registered devices, newest-first."""
        with self._lock:
            return sorted(
                self._state.devices.values(),
                key=lambda d: d.registered_at,
                reverse=True,
            )

    async def list_heartbeats(self, device_id: str, *, limit: int = 20) -> list[HeartbeatRecord]:
        """Return the most-recent heartbeats for *device_id*."""
        with self._lock:
            hbs = [h for h in self._state.heartbeats.values() if h.device_id == device_id]
            return sorted(hbs, key=lambda h: h.timestamp_bucket, reverse=True)[:limit]

    async def list_inventories(self, device_id: str, *, limit: int = 5) -> list[InventoryRecord]:
        """Return the most-recent inventory snapshots for *device_id*."""
        with self._lock:
            invs = [i for i in self._state.inventories.values() if i.device_id == device_id]
            return sorted(invs, key=lambda i: i.timestamp_bucket, reverse=True)[:limit]

    async def ping(self) -> bool:
        """Always healthy for in-memory storage."""
        return True

    # ---- registration tokens (Issue 0042 Phase 4.3) -------------------------

    async def create_registration_token(
        self,
        *,
        profile: str,
        fingerprint: str,
        ttl_seconds: int = 86400,
    ) -> RegistrationTokenRecord:
        now = datetime.now(UTC)
        token = secrets.token_urlsafe(32)
        record = RegistrationTokenRecord(
            token=token,
            profile=profile,
            fingerprint=fingerprint,
            created_at=now,
            expires_at=now + timedelta(seconds=ttl_seconds),
        )
        with self._lock:
            self._state.registration_tokens[token] = record
        return record

    async def consume_registration_token(
        self, token: str
    ) -> RegistrationTokenRecord | None:
        """Atomically mark *token* as consumed and return it, or None if invalid/expired/already used."""
        now = datetime.now(UTC)
        with self._lock:
            record = self._state.registration_tokens.get(token)
            if record is None:
                return None
            if record.consumed_at is not None or record.expires_at < now:
                return None
            # Replace with consumed copy (frozen dataclass — create new instance)
            consumed = RegistrationTokenRecord(
                token=record.token,
                profile=record.profile,
                fingerprint=record.fingerprint,
                created_at=record.created_at,
                expires_at=record.expires_at,
                consumed_at=now,
            )
            self._state.registration_tokens[token] = consumed
            return consumed

    # ---- device tokens (long-lived, rotatable) ------------------------------

    async def rotate_device_token(
        self,
        device_id: str,
        *,
        ttl_seconds: int = 172800,
    ) -> DeviceTokenRecord:
        now = datetime.now(UTC)
        token = secrets.token_urlsafe(32)
        record = DeviceTokenRecord(
            device_id=device_id,
            token=token,
            created_at=now,
            expires_at=now + timedelta(seconds=ttl_seconds),
        )
        with self._lock:
            self._state.device_tokens[device_id] = record
        return record

    async def get_device_token(self, device_id: str) -> DeviceTokenRecord | None:
        with self._lock:
            return self._state.device_tokens.get(device_id)

    # ---- test helpers -------------------------------------------------------

    def reset(self) -> None:
        with self._lock:
            self._state = _State(policies=dict(_DEFAULT_POLICIES))
