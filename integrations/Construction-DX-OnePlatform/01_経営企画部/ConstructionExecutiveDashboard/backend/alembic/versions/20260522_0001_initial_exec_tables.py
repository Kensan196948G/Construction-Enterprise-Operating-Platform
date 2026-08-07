"""initial executive dashboard tables

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
        "t_exec_kpi_snapshot",
        *_common_cols(),
        sa.Column("snapshot_date", sa.Date, nullable=False),
        sa.Column("period_type", sa.String(10), nullable=False, server_default="daily"),
        sa.Column("fiscal_year", sa.Integer),
        sa.Column("fiscal_month", sa.Integer),
        sa.Column("department_code", sa.String(50)),
        sa.Column("branch_code", sa.String(50)),
        sa.Column("kpi_type", sa.String(50), nullable=False),
        sa.Column("target_value", sa.Numeric(18, 4)),
        sa.Column("actual_value", sa.Numeric(18, 4), nullable=False, server_default="0"),
        sa.Column("achievement_rate", sa.Numeric(7, 4)),
        sa.Column("unit", sa.String(20)),
        sa.Column("source", sa.String(50)),
        sa.Column("extra", postgresql.JSONB),
    )
    op.create_index("ix_exec_kpi_snapshot_date", "t_exec_kpi_snapshot", ["snapshot_date"])
    op.create_index("ix_exec_kpi_snapshot_type", "t_exec_kpi_snapshot", ["kpi_type"])
    op.create_index("ix_exec_kpi_snapshot_dept", "t_exec_kpi_snapshot", ["department_code"])

    op.create_table(
        "t_exec_forecast",
        *_common_cols(),
        sa.Column("target_metric", sa.String(50), nullable=False),
        sa.Column("model_name", sa.String(50), nullable=False),
        sa.Column("horizon_days", sa.Integer, nullable=False, server_default="90"),
        sa.Column("confidence_interval", sa.Numeric(5, 4), nullable=False, server_default="0.8"),
        sa.Column("risk_score", sa.Numeric(5, 2)),
        sa.Column("predicted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("predictions", postgresql.JSONB),
        sa.Column("feature_importance", postgresql.JSONB),
        sa.Column("summary", sa.String(500)),
    )
    op.create_index("ix_exec_forecast_metric", "t_exec_forecast", ["target_metric"])

    op.create_table(
        "t_exec_alert",
        *_common_cols(),
        sa.Column("alert_code", sa.String(32), nullable=False, unique=True),
        sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("level", sa.String(10), nullable=False, server_default="warning"),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("kpi_type", sa.String(50)),
        sa.Column("threshold_value", sa.Numeric(18, 4)),
        sa.Column("actual_value", sa.Numeric(18, 4)),
        sa.Column("status", sa.String(16), nullable=False, server_default="open"),
        sa.Column("notify_targets", postgresql.JSONB),
        sa.Column("notification_log", postgresql.JSONB),
        sa.Column("acknowledged_by", sa.String(128)),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_exec_alert_level", "t_exec_alert", ["level"])
    op.create_index("ix_exec_alert_status", "t_exec_alert", ["status"])

    op.create_table(
        "t_exec_bcp_status",
        *_common_cols(),
        sa.Column("branch_code", sa.String(50), nullable=False),
        sa.Column("branch_name", sa.String(100), nullable=False),
        sa.Column("latitude", sa.Numeric(9, 6)),
        sa.Column("longitude", sa.Numeric(9, 6)),
        sa.Column("operation_status", sa.String(20), nullable=False, server_default="normal"),
        sa.Column("disaster_type", sa.String(30)),
        sa.Column("disaster_severity", sa.String(10)),
        sa.Column("impact_summary", sa.Text),
        sa.Column("affected_projects", postgresql.JSONB),
        sa.Column("recovery_plan", sa.Text),
        sa.Column("recovery_target_date", sa.Date),
        sa.Column("last_reported_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_exec_bcp_branch", "t_exec_bcp_status", ["branch_code"])

    op.create_table(
        "t_exec_esg_indicator",
        *_common_cols(),
        sa.Column("fiscal_year", sa.Integer, nullable=False),
        sa.Column("fiscal_month", sa.Integer),
        sa.Column("report_date", sa.Date, nullable=False),
        sa.Column("axis", sa.String(15), nullable=False),
        sa.Column("indicator_code", sa.String(50), nullable=False),
        sa.Column("indicator_name", sa.String(200), nullable=False),
        sa.Column("value", sa.Numeric(18, 4), nullable=False, server_default="0"),
        sa.Column("unit", sa.String(20)),
        sa.Column("target_value", sa.Numeric(18, 4)),
        sa.Column("sdgs_goal", sa.Integer),
        sa.Column("breakdown", postgresql.JSONB),
    )
    op.create_index("ix_exec_esg_year", "t_exec_esg_indicator", ["fiscal_year"])
    op.create_index("ix_exec_esg_axis", "t_exec_esg_indicator", ["axis"])
    op.create_index("ix_exec_esg_code", "t_exec_esg_indicator", ["indicator_code"])

    op.create_table(
        "t_exec_board_report",
        *_common_cols(),
        sa.Column("report_code", sa.String(32), nullable=False, unique=True),
        sa.Column("fiscal_year", sa.Integer, nullable=False),
        sa.Column("fiscal_period", sa.String(10), nullable=False),
        sa.Column("report_date", sa.Date, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("kpi_excerpt", postgresql.JSONB),
        sa.Column("ai_summary", sa.Text),
        sa.Column("body_markdown", sa.Text, nullable=False, server_default=""),
        sa.Column("pdf_path", sa.String(500)),
        sa.Column("status", sa.String(16), nullable=False, server_default="draft"),
        sa.Column("author_employee_code", sa.String(64)),
    )
    op.create_index("ix_exec_board_year", "t_exec_board_report", ["fiscal_year"])


def downgrade() -> None:
    for t in (
        "t_exec_board_report",
        "t_exec_esg_indicator",
        "t_exec_bcp_status",
        "t_exec_alert",
        "t_exec_forecast",
        "t_exec_kpi_snapshot",
    ):
        op.drop_table(t)
