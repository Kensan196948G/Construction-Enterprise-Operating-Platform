"""Phase 2 — ISO Builder UI: iso_build_jobs + iso_build_audit.

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-29

Adds two tables backing the asynchronous ISO build orchestrator
(Issue 0022 / 0023 / 0024):

- ``iso_build_jobs``: lifecycle of a single live-build run
- ``iso_build_audit``: append-only audit trail of operator actions

CHECK constraints are spelled out in SQL form so they apply identically on
PostgreSQL (production) and SQLite (unit tests). The ``ON DELETE CASCADE``
on ``iso_build_audit.job_id`` is enforced by the database, not the ORM,
to guarantee no orphan rows even if the application skips the cascade.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


_PROFILE_VALUES = ("admin", "standard", "field", "kiosk", "admin-support")
_STATUS_VALUES = ("queued", "running", "succeeded", "failed", "cancelled")
_AUDIT_ACTION_VALUES = ("enqueue", "cancel", "download", "view")


def _in_check(column: str, values: tuple[str, ...]) -> str:
    quoted = ", ".join(f"'{v}'" for v in values)
    return f"{column} IN ({quoted})"


def upgrade() -> None:
    op.create_table(
        "iso_build_jobs",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("profile", sa.String(32), nullable=False),
        sa.Column("requested_by", sa.String(255), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("git_ref", sa.String(255), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("iso_path", sa.Text, nullable=True),
        sa.Column("iso_sha256", sa.String(64), nullable=True),
        sa.Column("iso_size_bytes", sa.BigInteger, nullable=True),
        sa.Column("log_path", sa.Text, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            _in_check("profile", _PROFILE_VALUES),
            name="ck_iso_build_jobs_profile",
        ),
        sa.CheckConstraint(
            _in_check("status", _STATUS_VALUES),
            name="ck_iso_build_jobs_status",
        ),
    )
    op.create_index(
        "ix_iso_build_jobs_status_created",
        "iso_build_jobs",
        ["status", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_iso_build_jobs_profile_created",
        "iso_build_jobs",
        ["profile", sa.text("created_at DESC")],
    )

    op.create_table(
        "iso_build_audit",
        # BIGSERIAL on Postgres, INTEGER PRIMARY KEY (rowid) on SQLite tests.
        sa.Column(
            "id",
            sa.BigInteger().with_variant(sa.Integer, "sqlite"),
            nullable=False,
            autoincrement=True,
        ),
        sa.Column("job_id", sa.String(36), nullable=False),
        sa.Column("actor", sa.String(255), nullable=False),
        sa.Column("action", sa.String(16), nullable=False),
        sa.Column(
            "at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("request_id", sa.String(64), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["job_id"],
            ["iso_build_jobs.id"],
            ondelete="CASCADE",
            name="fk_iso_build_audit_job_id",
        ),
        sa.CheckConstraint(
            _in_check("action", _AUDIT_ACTION_VALUES),
            name="ck_iso_build_audit_action",
        ),
    )
    op.create_index(
        "ix_iso_build_audit_job_at",
        "iso_build_audit",
        ["job_id", "at"],
    )
    op.create_index(
        "ix_iso_build_audit_actor_at",
        "iso_build_audit",
        ["actor", sa.text("at DESC")],
    )


def downgrade() -> None:
    op.drop_index("ix_iso_build_audit_actor_at", table_name="iso_build_audit")
    op.drop_index("ix_iso_build_audit_job_at", table_name="iso_build_audit")
    op.drop_table("iso_build_audit")
    op.drop_index("ix_iso_build_jobs_profile_created", table_name="iso_build_jobs")
    op.drop_index("ix_iso_build_jobs_status_created", table_name="iso_build_jobs")
    op.drop_table("iso_build_jobs")
