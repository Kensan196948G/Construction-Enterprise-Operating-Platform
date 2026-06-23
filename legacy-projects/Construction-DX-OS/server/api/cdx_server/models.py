"""SQLAlchemy ORM models for cdx-server Phase 2 (PostgreSQL backend).

These models mirror the in-memory dataclasses in :mod:`cdx_server.storage`
but add database-level constraints:

- ``devices.shared_secret`` is stored as a bcrypt hash (never plaintext).
- ``heartbeats`` and ``inventories`` use UNIQUE constraints on
  ``(device_id, timestamp_bucket)`` so idempotency is enforced at the DB
  layer rather than the application layer.
- ``policies`` are seeded by a data migration and keyed by ``profile``.

All tables use ``timestamp with time zone`` (TIMESTAMPTZ) to avoid silent
timezone bugs — the application always passes ``datetime.now(UTC)``.
"""

from __future__ import annotations

from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Use JSONB on PostgreSQL for indexable JSON; fall back to JSON (auto-serialized TEXT)
# on SQLite so that dict values round-trip correctly in tests.
_JSONB_OR_TEXT = JSONB().with_variant(sa.JSON, "sqlite")


class Base(DeclarativeBase):
    pass


class DeviceModel(Base):
    __tablename__ = "devices"

    device_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    profile: Mapped[str] = mapped_column(String(64), nullable=False)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    # shared_secret is stored verbatim (required for HMAC-SHA256 verification).
    # A bcrypt wrapper for /admin login is tracked separately.
    shared_secret: Mapped[str] = mapped_column(Text, nullable=False)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class HeartbeatModel(Base):
    __tablename__ = "heartbeats"
    __table_args__ = (
        UniqueConstraint("device_id", "timestamp_bucket", name="uq_heartbeat_bucket"),
        Index("ix_heartbeats_device_id", "device_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(128), nullable=False)
    timestamp_bucket: Mapped[int] = mapped_column(BigInteger, nullable=False)
    agent_version: Mapped[str] = mapped_column(String(64), nullable=False)
    uptime_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    sent_at: Mapped[str] = mapped_column(String(64), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class InventoryModel(Base):
    __tablename__ = "inventories"
    __table_args__ = (
        UniqueConstraint("device_id", "timestamp_bucket", name="uq_inventory_bucket"),
        Index("ix_inventories_device_id", "device_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(128), nullable=False)
    timestamp_bucket: Mapped[int] = mapped_column(BigInteger, nullable=False)
    body: Mapped[dict] = mapped_column(_JSONB_OR_TEXT, nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class PolicyModel(Base):
    __tablename__ = "policies"

    profile: Mapped[str] = mapped_column(String(64), primary_key=True)
    update_ring: Mapped[str] = mapped_column(String(32), nullable=False)
    heartbeat_interval_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    inventory_interval_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    policy_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)


# ---------------------------------------------------------------------------
# Phase 2 — ISO Builder UI (Issue 0022/0023/0024)
# ---------------------------------------------------------------------------

# Allowed values are defined here once so models, migrations, and storage
# layers all share the source of truth.
ISO_BUILD_PROFILES = (
    "admin",
    "standard",
    "field",
    "kiosk",
    "admin-support",
)
ISO_BUILD_STATUSES = (
    "queued",
    "running",
    "succeeded",
    "failed",
    "cancelled",
)
ISO_BUILD_AUDIT_ACTIONS = (
    "enqueue",
    "cancel",
    "download",
    "view",
)


def _check_in(column: str, allowed: tuple[str, ...], name: str) -> CheckConstraint:
    """Render a portable IN-list CHECK constraint for SQLite + Postgres."""
    quoted = ", ".join(f"'{value}'" for value in allowed)
    return CheckConstraint(f"{column} IN ({quoted})", name=name)


class IsoBuildJobModel(Base):
    """A live-build job tracked from enqueue to terminal state.

    The ``id`` column uses ``String(36)`` rather than the postgres-only
    ``UUID`` type so SQLite-based unit tests round-trip cleanly. The
    application layer is responsible for generating uuid7-shaped values.
    """

    __tablename__ = "iso_build_jobs"
    __table_args__ = (
        _check_in("profile", ISO_BUILD_PROFILES, "ck_iso_build_jobs_profile"),
        _check_in("status", ISO_BUILD_STATUSES, "ck_iso_build_jobs_status"),
        Index(
            "ix_iso_build_jobs_status_created",
            "status",
            sa.desc("created_at"),
        ),
        Index(
            "ix_iso_build_jobs_profile_created",
            "profile",
            sa.desc("created_at"),
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    profile: Mapped[str] = mapped_column(String(32), nullable=False)
    requested_by: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    git_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    iso_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    iso_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    iso_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    log_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )


class IsoBuildAuditModel(Base):
    """Append-only audit trail of operator actions on an ISO build job."""

    __tablename__ = "iso_build_audit"
    __table_args__ = (
        _check_in("action", ISO_BUILD_AUDIT_ACTIONS, "ck_iso_build_audit_action"),
        Index("ix_iso_build_audit_job_at", "job_id", "at"),
        Index("ix_iso_build_audit_actor_at", "actor", sa.desc("at")),
    )

    # BIGINT on Postgres for the BIGSERIAL spec; INTEGER on SQLite so its
    # built-in rowid auto-increment kicks in for tests.
    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    job_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("iso_build_jobs.id", ondelete="CASCADE"),
        nullable=False,
    )
    actor: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(16), nullable=False)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )
    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


# ----------------------------------------------------------------------------
# Issue 0052: Serial-scan queue (GMSV0002 OCR pipeline persistence)
# ----------------------------------------------------------------------------

SERIAL_SCAN_STATUSES = ("pending", "confirmed", "discarded")
SERIAL_SCAN_PROFILES = ISO_BUILD_PROFILES  # reuse the same profile vocabulary


class SerialScanQueueModel(Base):
    """OCR queue item produced by the GMSV0002 serial-scan pipeline.

    Each row represents one image that arrived via the GMSV0002 SMB share,
    was OCR'd by easyocr, and is awaiting operator confirmation before being
    registered in the device deployment ledger.

    Lifecycle: ``pending`` -> ``confirmed`` (operator approves) or
    ``discarded`` (duplicate / unreadable). The router preserves backwards
    compatibility with the in-memory queue when ``SerialScanStorage`` is
    not implemented by the active storage backend (e.g. InMemoryStorage).
    """

    __tablename__ = "serial_scan_queue"
    __table_args__ = (
        _check_in("status", SERIAL_SCAN_STATUSES, "ck_serial_scan_queue_status"),
        _check_in("profile", SERIAL_SCAN_PROFILES, "ck_serial_scan_queue_profile"),
        Index(
            "ix_serial_scan_queue_status_scanned",
            "status",
            sa.desc("scanned_at"),
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    serial_extracted: Mapped[str] = mapped_column(String(64), nullable=False)
    serial_confirmed: Mapped[str | None] = mapped_column(String(64), nullable=True)
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    profile: Mapped[str] = mapped_column(String(32), nullable=False, default="standard")
    location: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    scanned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
