"""Pydantic schemas for cdx-server.

Request bodies mirror the shape emitted by cdx-agent (inventory snapshot,
heartbeat record). Fields are intentionally loose in Phase 1 — most are
Optional — so agents running slightly older versions can still be ingested
while the MVP schema stabilises.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Identifier alphabet: keep tight so canonicalisation in
# cdx_agent.sign / cdx_server.auth cannot be confused by control chars.
DEVICE_ID_PATTERN = r"^[A-Za-z0-9_\-]+$"


class RegisterRequest(BaseModel):
    """Provisioning payload: registers a device and its shared secret."""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "device_id": "PC-SITE-A-001",
                "profile": "standard",
                "hostname": "cdx-site-a-001.local",
                "shared_secret": "change-me-before-prod-use",
            }
        },
    )

    device_id: str = Field(min_length=1, max_length=128, pattern=DEVICE_ID_PATTERN)
    profile: Literal["standard", "field", "kiosk"] = "standard"
    hostname: str = Field(min_length=1, max_length=253)
    shared_secret: str = Field(min_length=16, max_length=512)


class RegisterResponse(BaseModel):
    device_id: str
    registered_at: datetime
    already_registered: bool


class HeartbeatRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    device_id: str = Field(min_length=1, max_length=128, pattern=DEVICE_ID_PATTERN)
    agent_version: str = Field(min_length=1)
    uptime_seconds: int = Field(ge=0)
    sent_at: str
    kind: Literal["heartbeat"] = "heartbeat"


class HeartbeatResponse(BaseModel):
    accepted: bool
    duplicate: bool
    received_at: datetime


class InventoryRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    device_id: str = Field(min_length=1, max_length=128, pattern=DEVICE_ID_PATTERN)
    hostname: str
    cpu: str
    cpu_count: int = Field(ge=0)
    memory_bytes: int = Field(ge=0)
    os_version: str
    kernel_version: str
    timezone: str
    collected_at: str


class InventoryResponse(BaseModel):
    accepted: bool
    duplicate: bool
    received_at: datetime


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"] = "ok"
    service: str = "cdx-server"
    version: str
    storage: Literal["ok", "error"] = "ok"
    storage_backend: str = "InMemoryStorage"
    redis: Literal["ok", "error", "disabled"] = "disabled"
    uptime_seconds: float = 0.0


class LivenessResponse(BaseModel):
    """Liveness probe response — process-level vitals only.

    Deliberately excludes storage/redis status: a downstream outage must not
    trigger pod restart. Use ``/health/ready`` (or legacy ``/health``) for
    deep dependency checks.
    """

    status: Literal["ok"] = "ok"
    service: str = "cdx-server"
    version: str
    uptime_seconds: float = 0.0


# ---- dashboard summary --------------------------------------------------


class DeviceSummary(BaseModel):
    total: int = 0
    online: int = 0
    offline: int = 0
    warning: int = 0


class IsoBuildSummary(BaseModel):
    total: int = 0
    running: int = 0
    succeeded: int = 0
    failed: int = 0
    cancelled: int = 0


class ServerSummary(BaseModel):
    storage: str = "ok"
    redis: str = "disabled"
    uptime_seconds: float = 0.0


class DashboardResponse(BaseModel):
    devices: DeviceSummary = Field(default_factory=DeviceSummary)
    iso_builds: IsoBuildSummary = Field(default_factory=IsoBuildSummary)
    server: ServerSummary = Field(default_factory=ServerSummary)


# ---- policy pull --------------------------------------------------------
# Phase 1 MVP: policy is per-profile with no per-device override and no
# persistence (an in-memory default dict). Fields cover only the knobs the
# agent needs to pace its work and know which update ring it belongs to.
# ``policy_version`` is monotonic per profile so the agent can short-circuit
# re-applying an unchanged policy.


class PolicyResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    profile: Literal["standard", "field", "kiosk"]
    update_ring: Literal["ring0", "ring1", "ring2", "ring3"]
    heartbeat_interval_seconds: int = Field(ge=10, le=86400)
    inventory_interval_seconds: int = Field(ge=60, le=86400)
    policy_version: int = Field(ge=1)


# ---- ISO Builder UI (Phase 2, Issue 0022) ----------------------------------
# These schemas wrap the IsoBuildJob lifecycle for the management API.
# Allowed-value lists mirror the SSoT in ``cdx_server.models``
# (ISO_BUILD_PROFILES / ISO_BUILD_STATUSES) — Pydantic Literals catch
# typos at request validation time, before they reach the DB CHECK
# constraint and produce an opaque IntegrityError.

IsoBuildProfile = Literal["admin", "standard", "field", "kiosk", "admin-support"]
IsoBuildStatus = Literal["queued", "running", "succeeded", "failed", "cancelled"]


class IsoBuildJobCreateRequest(BaseModel):
    """Operator-supplied parameters for enqueuing a new ISO build."""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "profile": "field",
                "git_ref": "main",
                "notes": "現場向け 2026-Q2 リリース",
            }
        },
    )

    profile: IsoBuildProfile
    git_ref: str = Field(min_length=1, max_length=255)
    notes: str | None = Field(default=None, max_length=2000)


class IsoBuildJobResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    profile: IsoBuildProfile
    requested_by: str
    status: IsoBuildStatus
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


class IsoBuildJobListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[IsoBuildJobResponse]
    total: int


# ---- Registration Token API (Issue 0042 Phase 4.3) -------------------------
# Ephemeral tokens are issued to bootstrapping devices via agent-bootstrap.sh.
# They are single-use (consumed on first /api/v1/devices/register call) and
# expire after 24 hours.  After registration, the agent switches to a
# long-lived device token managed by the rotation API.

class RegistrationTokenRequest(BaseModel):
    """Body for POST /api/v1/devices/registration-tokens."""

    model_config = ConfigDict(extra="forbid")

    profile: Literal["standard", "field", "kiosk"]
    fingerprint: str = Field(
        min_length=64,
        max_length=64,
        pattern=r"^[0-9a-f]{64}$",
        description="SHA-256 hex digest of machine-id:MAC",
    )


class RegistrationTokenResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str
    expires_at: datetime


class TokenRotateRequest(BaseModel):
    """Body for POST /api/v1/auth/rotate."""

    model_config = ConfigDict(extra="forbid")

    device_id: str = Field(pattern=DEVICE_ID_PATTERN)


class TokenRotateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str
    expires_at: datetime


# ---- PXE Boot Event API (Issue 0042 Phase 4.4) -----------------------------
# agent-bootstrap.sh reports lifecycle events via POST /api/v1/pxe/events.
# The endpoint is stateless — it only increments Prometheus counters.
# No DB write; audit trail lives in structured logs + Prometheus.


class PXEBootEvent(StrEnum):
    """PXE boot lifecycle events recorded by agent-bootstrap.sh."""

    TOKEN_ISSUED = "token_issued"
    BOOTSTRAP_COMPLETE = "bootstrap_complete"
    BOOTSTRAP_FAILED = "bootstrap_failed"
    FIRST_REGISTRATION = "first_registration"


class PXEEventRequest(BaseModel):
    """Payload from agent-bootstrap.sh reporting a boot event."""

    model_config = ConfigDict(str_strip_whitespace=True)

    event: PXEBootEvent
    profile: str = Field(..., pattern=r"^(standard|field|kiosk)$")
    fingerprint: str = Field(..., min_length=64, max_length=64)
    duration_seconds: float | None = Field(
        default=None, ge=0, description="Seconds from token_issued to this event."
    )
    error_message: str | None = Field(default=None, max_length=500)


class PXEEventResponse(BaseModel):
    """Acknowledgement returned to agent-bootstrap.sh."""

    recorded: bool = True
    event: PXEBootEvent


# ---- PXE Rollback API (Issue 0042 Phase 4.5) --------------------------------
# POST /api/v1/pxe/rollback records rollback intent + returns script snippet.
# Actual script execution is performed by a human operator on the PXE server.


class PXERollbackPattern(StrEnum):
    """Six rollback patterns defined in Issue 0041 § 4.7."""

    FULL = "full"
    PROFILE = "profile"
    RING = "ring"
    SITE = "site"
    SINGLE = "single"
    ABORT = "abort"


class PXERollbackRequest(BaseModel):
    """Operator-initiated rollback request (from Admin WebUI or CLI)."""

    model_config = ConfigDict(str_strip_whitespace=True)

    pattern: PXERollbackPattern
    reason: str = Field(..., min_length=10, max_length=500, description="Reason for rollback (audit trail).")
    # Pattern-specific parameters (all optional; validated per pattern in the handler)
    target_version: str | None = Field(default=None, max_length=64)
    profile: str | None = Field(default=None, pattern=r"^(standard|field|kiosk)$")
    ring: str | None = Field(default=None, pattern=r"^ring[0-3]$")
    site: str | None = Field(default=None, max_length=64)
    device_mac: str | None = Field(default=None, max_length=17)
    backup_pxe_ip: str | None = Field(default=None, max_length=45)


class PXERollbackResponse(BaseModel):
    """Rollback intent recorded + script command returned for operator execution."""

    recorded: bool = True
    pattern: PXERollbackPattern
    audit_id: str = Field(description="Request-ID for audit trail correlation.")
    script_name: str = Field(description="Script file to execute on the PXE server.")
    command: str = Field(description="Exact command to run (with --dry-run for preview).")
