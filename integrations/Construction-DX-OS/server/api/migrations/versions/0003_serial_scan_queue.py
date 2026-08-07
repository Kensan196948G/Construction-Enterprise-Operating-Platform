"""Issue 0052 — Serial-scan queue persistence (GMSV0002 OCR pipeline).

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-21

Adds a single table backing the serial-scan OCR queue so items survive a
``cdx-server`` restart. The router (``routers/serial_scan.py``) falls back
to its in-memory dictionary when the active storage backend does not
implement ``SerialScanStorage`` (e.g. dev mode without ``DATABASE_URL``).

CHECK constraints are spelled out in SQL form so they apply identically on
PostgreSQL (production) and SQLite (unit tests).
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


_STATUS_VALUES = ("pending", "confirmed", "discarded")
_PROFILE_VALUES = ("admin", "standard", "field", "kiosk", "admin-support")


def _in_check(column: str, values: tuple[str, ...]) -> str:
    quoted = ", ".join(f"'{v}'" for v in values)
    return f"{column} IN ({quoted})"


def upgrade() -> None:
    op.create_table(
        "serial_scan_queue",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("serial_extracted", sa.String(64), nullable=False),
        sa.Column("serial_confirmed", sa.String(64), nullable=True),
        sa.Column("hostname", sa.String(255), nullable=True),
        sa.Column("profile", sa.String(32), nullable=False, server_default="standard"),
        sa.Column("location", sa.String(255), nullable=False, server_default=""),
        sa.Column("notes", sa.Text, nullable=False, server_default=""),
        sa.Column("status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column(
            "scanned_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            _in_check("status", _STATUS_VALUES),
            name="ck_serial_scan_queue_status",
        ),
        sa.CheckConstraint(
            _in_check("profile", _PROFILE_VALUES),
            name="ck_serial_scan_queue_profile",
        ),
    )
    op.create_index(
        "ix_serial_scan_queue_status_scanned",
        "serial_scan_queue",
        ["status", sa.text("scanned_at DESC")],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_serial_scan_queue_status_scanned",
        table_name="serial_scan_queue",
    )
    op.drop_table("serial_scan_queue")
