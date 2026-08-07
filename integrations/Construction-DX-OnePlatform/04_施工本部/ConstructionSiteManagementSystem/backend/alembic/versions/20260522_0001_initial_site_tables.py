"""initial site tables

Revision ID: 20260522_0001
Revises:
Create Date: 2026-05-22 00:00:00
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260522_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _common_cols() -> list[sa.Column]:
    return [
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(128), nullable=True),
        sa.Column("updated_by", sa.String(128), nullable=True),
    ]


def upgrade() -> None:
    op.create_table(
        "t_construction_project",
        *_common_cols(),
        sa.Column("project_code", sa.String(32), nullable=False, unique=True),
        sa.Column("project_name", sa.String(255), nullable=False),
        sa.Column("site_address", sa.String(300)),
        sa.Column("contract_amount", sa.Numeric(18, 2)),
        sa.Column("start_date", sa.Date),
        sa.Column("end_date", sa.Date),
        sa.Column("manager_id", sa.BigInteger),
        sa.Column("branch_id", sa.BigInteger),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("site_location_wkt", sa.String(255)),
    )
    op.create_index("ix_t_construction_project_project_code", "t_construction_project", ["project_code"])

    op.create_table(
        "t_schedule",
        *_common_cols(),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_id", sa.String(64), nullable=False),
        sa.Column("task_name", sa.String(200), nullable=False),
        sa.Column("parent_task_id", sa.String(64)),
        sa.Column("predecessor_task_id", sa.String(64)),
        sa.Column("planned_start", sa.Date),
        sa.Column("planned_end", sa.Date),
        sa.Column("actual_start", sa.Date),
        sa.Column("actual_end", sa.Date),
        sa.Column("progress_rate", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("is_critical", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("sync_version", sa.BigInteger, nullable=False, server_default="1"),
    )
    op.create_index("ix_t_schedule_task_id", "t_schedule", ["task_id"])

    op.create_table(
        "t_progress_record",
        *_common_cols(),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("record_date", sa.Date, nullable=False),
        sa.Column("task_id", sa.BigInteger),
        sa.Column("progress_rate", sa.Numeric(5, 2), nullable=False),
        sa.Column("earned_value", sa.Numeric(18, 2)),
        sa.Column("remarks", sa.Text),
        sa.Column("client_id", sa.String(50)),
        sa.Column("sync_version", sa.BigInteger, nullable=False, server_default="1"),
    )
    op.create_index("ix_t_progress_record_client_id", "t_progress_record", ["client_id"])

    op.create_table(
        "t_cost_record",
        *_common_cols(),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("record_date", sa.Date, nullable=False),
        sa.Column("cost_category", sa.String(50), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("vendor", sa.String(200)),
        sa.Column("invoice_no", sa.String(100)),
        sa.Column("description", sa.Text),
        sa.Column("metadata_json", postgresql.JSONB),
        sa.Column("client_id", sa.String(50)),
        sa.Column("sync_version", sa.BigInteger, nullable=False, server_default="1"),
    )
    op.create_index("ix_t_cost_record_client_id", "t_cost_record", ["client_id"])

    op.create_table(
        "t_daily_site_report",
        *_common_cols(),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("report_date", sa.Date, nullable=False),
        sa.Column("weather", sa.String(20)),
        sa.Column("temperature_max", sa.Numeric(4, 1)),
        sa.Column("temperature_min", sa.Numeric(4, 1)),
        sa.Column("work_content", postgresql.JSONB),
        sa.Column("safety_notes", sa.Text),
        sa.Column("ky_records", postgresql.JSONB),
        sa.Column("reporter_id", sa.BigInteger),
        sa.Column("approval_status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("approved_by", sa.BigInteger),
        sa.Column("approved_at", sa.DateTime(timezone=True)),
        sa.Column("sync_version", sa.BigInteger, nullable=False, server_default="1"),
        sa.Column("client_id", sa.String(50)),
        sa.UniqueConstraint("project_id", "report_date", "client_id", name="uq_daily_report_dedupe"),
    )
    op.create_index("ix_t_daily_site_report_report_date", "t_daily_site_report", ["report_date"])

    op.create_table(
        "t_site_photo",
        *_common_cols(),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("thumbnail_path", sa.String(500)),
        sa.Column("captured_at", sa.DateTime(timezone=True)),
        sa.Column("category", sa.String(30)),
        sa.Column("work_type", sa.String(100)),
        sa.Column("description", sa.Text),
        sa.Column("ai_tags", postgresql.JSONB),
        sa.Column("exif_data", postgresql.JSONB),
        sa.Column("sha256", sa.String(64)),
        sa.Column("client_id", sa.String(50)),
    )
    op.create_index("ix_t_site_photo_captured_at", "t_site_photo", ["captured_at"])

    op.create_table(
        "t_electronic_board",
        *_common_cols(),
        sa.Column("photo_id", sa.BigInteger, sa.ForeignKey("t_site_photo.id", ondelete="SET NULL")),
        sa.Column("project_name", sa.String(200)),
        sa.Column("work_type", sa.String(100)),
        sa.Column("measurement_point", sa.String(100)),
        sa.Column("design_value", sa.String(50)),
        sa.Column("actual_value", sa.String(50)),
        sa.Column("contractor", sa.String(100)),
        sa.Column("record_date", sa.Date),
        sa.Column("hash_value", sa.String(64)),
    )

    op.create_table(
        "t_worker_attendance",
        *_common_cols(),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("worker_id", sa.BigInteger),
        sa.Column("worker_name", sa.String(100), nullable=False),
        sa.Column("company_name", sa.String(100)),
        sa.Column("check_in_at", sa.DateTime(timezone=True)),
        sa.Column("check_out_at", sa.DateTime(timezone=True)),
        sa.Column("method", sa.String(20), nullable=False, server_default="qr_code"),
        sa.Column("qualifications", postgresql.JSONB),
        sa.Column("qr_token_jti", sa.String(64)),
    )

    op.create_table(
        "t_equipment",
        *_common_cols(),
        sa.Column("equipment_name", sa.String(100), nullable=False),
        sa.Column("equipment_type", sa.String(50)),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("t_construction_project.id", ondelete="SET NULL")),
        sa.Column("gps_device_id", sa.String(50)),
        sa.Column("current_location_wkt", sa.String(255)),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("operating_hours", sa.Numeric(10, 1)),
    )

    op.create_table(
        "t_sync_log",
        *_common_cols(),
        sa.Column("device_id", sa.String(64), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(64)),
        sa.Column("operation", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("client_timestamp", sa.DateTime(timezone=True)),
        sa.Column("server_timestamp", sa.DateTime(timezone=True)),
        sa.Column("payload", postgresql.JSONB),
        sa.Column("conflict_detail", postgresql.JSONB),
        sa.Column("error_message", sa.Text),
    )
    op.create_index("ix_t_sync_log_device_id", "t_sync_log", ["device_id"])


def downgrade() -> None:
    for t in (
        "t_sync_log",
        "t_equipment",
        "t_worker_attendance",
        "t_electronic_board",
        "t_site_photo",
        "t_daily_site_report",
        "t_cost_record",
        "t_progress_record",
        "t_schedule",
        "t_construction_project",
    ):
        op.drop_table(t)
