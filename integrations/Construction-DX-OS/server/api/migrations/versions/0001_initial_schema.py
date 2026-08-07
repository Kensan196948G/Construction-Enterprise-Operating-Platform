"""Initial schema — devices, heartbeats, inventories, policies.

Revision ID: 0001
Revises:
Create Date: 2026-04-16
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---- devices ------------------------------------------------------------
    op.create_table(
        "devices",
        sa.Column("device_id", sa.String(128), nullable=False),
        sa.Column("profile", sa.String(64), nullable=False),
        sa.Column("hostname", sa.String(255), nullable=False),
        sa.Column("shared_secret", sa.Text, nullable=False),
        sa.Column("registered_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("device_id"),
    )

    # ---- heartbeats ---------------------------------------------------------
    op.create_table(
        "heartbeats",
        sa.Column("id", sa.Integer, nullable=False, autoincrement=True),
        sa.Column("device_id", sa.String(128), nullable=False),
        sa.Column("timestamp_bucket", sa.BigInteger, nullable=False),
        sa.Column("agent_version", sa.String(64), nullable=False),
        sa.Column("uptime_seconds", sa.Integer, nullable=False),
        sa.Column("sent_at", sa.String(64), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("device_id", "timestamp_bucket", name="uq_heartbeat_bucket"),
    )
    op.create_index("ix_heartbeats_device_id", "heartbeats", ["device_id"])

    # ---- inventories --------------------------------------------------------
    op.create_table(
        "inventories",
        sa.Column("id", sa.Integer, nullable=False, autoincrement=True),
        sa.Column("device_id", sa.String(128), nullable=False),
        sa.Column("timestamp_bucket", sa.BigInteger, nullable=False),
        # Use JSONB on PostgreSQL for indexable JSON; TEXT on SQLite fallback.
        sa.Column(
            "body",
            postgresql.JSONB().with_variant(sa.Text, "sqlite"),
            nullable=False,
        ),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("device_id", "timestamp_bucket", name="uq_inventory_bucket"),
    )
    op.create_index("ix_inventories_device_id", "inventories", ["device_id"])

    # ---- policies -----------------------------------------------------------
    op.create_table(
        "policies",
        sa.Column("profile", sa.String(64), nullable=False),
        sa.Column("update_ring", sa.String(32), nullable=False),
        sa.Column("heartbeat_interval_seconds", sa.Integer, nullable=False),
        sa.Column("inventory_interval_seconds", sa.Integer, nullable=False),
        sa.Column("policy_version", sa.Integer, nullable=False, server_default="1"),
        sa.PrimaryKeyConstraint("profile"),
    )

    # Seed default policies
    op.bulk_insert(
        sa.table(
            "policies",
            sa.column("profile"),
            sa.column("update_ring"),
            sa.column("heartbeat_interval_seconds"),
            sa.column("inventory_interval_seconds"),
            sa.column("policy_version"),
        ),
        [
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
        ],
    )


def downgrade() -> None:
    op.drop_table("policies")
    op.drop_index("ix_inventories_device_id", table_name="inventories")
    op.drop_table("inventories")
    op.drop_index("ix_heartbeats_device_id", table_name="heartbeats")
    op.drop_table("heartbeats")
    op.drop_table("devices")
