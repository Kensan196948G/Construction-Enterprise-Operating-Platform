"""initial schema for Safety & Quality Governance.

Revision ID: 0001
Revises:
Create Date: 2026-05-22
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
    op.create_table(
        "t_near_miss",
        sa.Column("near_miss_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True)),
        sa.Column("reporter_id", postgresql.UUID(as_uuid=True)),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("location", sa.String(200)),
        sa.Column("location_geom", sa.String(100)),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("cause_analysis", postgresql.JSONB),
        sa.Column("risk_level", sa.String(10)),
        sa.Column("severity", sa.String(20)),
        sa.Column("corrective_action", sa.Text),
        sa.Column("photo_ids", postgresql.JSONB),
        sa.Column("status", sa.String(20)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_ky_activity",
        sa.Column("ky_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True)),
        sa.Column("activity_date", sa.Date, nullable=False),
        sa.Column("work_content", sa.String(200)),
        sa.Column("hazards", postgresql.JSONB),
        sa.Column("participants", postgresql.JSONB),
        sa.Column("leader_id", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_accident",
        sa.Column("accident_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True)),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("severity", sa.String(20)),
        sa.Column("injury_type", sa.String(50)),
        sa.Column("description", sa.Text),
        sa.Column("root_cause", sa.Text),
        sa.Column("corrective_actions", postgresql.JSONB),
        sa.Column("lost_days", sa.Integer),
        sa.Column("total_work_hours", sa.Float),
        sa.Column("injuries", sa.Integer),
        sa.Column("reported_to", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_safety_patrol",
        sa.Column("patrol_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True)),
        sa.Column("patrol_date", sa.Date, nullable=False),
        sa.Column("inspector_id", postgresql.UUID(as_uuid=True)),
        sa.Column("checklist", postgresql.JSONB),
        sa.Column("overall_rating", sa.String(10)),
        sa.Column("corrective_orders", postgresql.JSONB),
        sa.Column("photo_ids", postgresql.JSONB),
        sa.Column("follow_up_date", sa.Date),
        sa.Column("correction_status", sa.String(20)),
        sa.Column("status", sa.String(20)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_quality_record",
        sa.Column("quality_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True)),
        sa.Column("record_type", sa.String(30)),
        sa.Column("title", sa.String(200)),
        sa.Column("description", sa.Text),
        sa.Column("measurement_value", sa.Float),
        sa.Column("spec_upper", sa.Float),
        sa.Column("spec_lower", sa.Float),
        sa.Column("result", sa.String(20)),
        sa.Column("evidence_files", postgresql.JSONB),
        sa.Column("inspector_id", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_nonconformity",
        sa.Column("nc_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True)),
        sa.Column("detected_at", sa.DateTime(timezone=True)),
        sa.Column("title", sa.String(200)),
        sa.Column("description", sa.Text),
        sa.Column("severity", sa.String(20)),
        sa.Column("corrective_action", sa.Text),
        sa.Column("preventive_action", sa.Text),
        sa.Column("effectiveness_verification", sa.Text),
        sa.Column("capa_status", sa.String(20)),
        sa.Column("due_date", sa.Date),
        sa.Column("closed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_iso_audit",
        sa.Column("audit_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("audit_type", sa.String(20)),
        sa.Column("iso_standard", sa.String(20)),
        sa.Column("plan_date", sa.Date),
        sa.Column("audit_date", sa.Date),
        sa.Column("follow_up_date", sa.Date),
        sa.Column("scope", sa.Text),
        sa.Column("findings", postgresql.JSONB),
        sa.Column("lead_auditor", sa.String(100)),
        sa.Column("status", sa.String(20)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_environmental_record",
        sa.Column("env_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True)),
        sa.Column("record_type", sa.String(30)),
        sa.Column("record_date", sa.Date),
        sa.Column("scope", sa.String(10)),
        sa.Column("quantity", sa.Numeric(15, 4)),
        sa.Column("unit", sa.String(20)),
        sa.Column("manifest_number", sa.String(30)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )


def downgrade() -> None:
    for t in [
        "t_environmental_record",
        "t_iso_audit",
        "t_nonconformity",
        "t_quality_record",
        "t_safety_patrol",
        "t_accident",
        "t_ky_activity",
        "t_near_miss",
    ]:
        op.drop_table(t)
