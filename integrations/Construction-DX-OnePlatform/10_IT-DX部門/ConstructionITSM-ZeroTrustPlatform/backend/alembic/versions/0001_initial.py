"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-22
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "t_itsm_ticket",
        sa.Column("ticket_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("ticket_number", sa.String(20), unique=True, nullable=False),
        sa.Column("ticket_type", sa.String(20), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("priority", sa.String(10), nullable=False, server_default="medium"),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("category", sa.String(50)),
        sa.Column("assignee_id", postgresql.UUID(as_uuid=True)),
        sa.Column("reporter_id", postgresql.UUID(as_uuid=True)),
        sa.Column("sla_target", sa.DateTime(timezone=True)),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
        sa.Column("resolution", sa.Text),
        sa.Column("ai_classified", sa.Boolean, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_ticket_status", "t_itsm_ticket", ["status", "priority"])

    op.create_table(
        "t_cmdb_item",
        sa.Column("ci_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("ci_type", sa.String(30), index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("serial_number", sa.String(50)),
        sa.Column("manufacturer", sa.String(100)),
        sa.Column("model", sa.String(100)),
        sa.Column("os", sa.String(100)),
        sa.Column("ip_address", postgresql.INET),
        sa.Column("mac_address", postgresql.MACADDR),
        sa.Column("location", sa.String(200)),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True)),
        sa.Column("lifecycle_status", sa.String(20), server_default="active"),
        sa.Column("purchase_date", sa.Date),
        sa.Column("warranty_end", sa.Date),
        sa.Column("entra_device_id", sa.String(200)),
        sa.Column("attributes", postgresql.JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "t_cmdb_relation",
        sa.Column("relation_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_ci_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("t_cmdb_item.ci_id"), nullable=False),
        sa.Column("target_ci_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("t_cmdb_item.ci_id"), nullable=False),
        sa.Column("relation_type", sa.String(30), nullable=False),
        sa.Column("description", sa.String(200)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "t_sla_contract",
        sa.Column("sla_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("priority", sa.String(10), nullable=False),
        sa.Column("response_target_min", sa.Integer, nullable=False),
        sa.Column("resolution_target_min", sa.Integer, nullable=False),
        sa.Column("description", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "t_audit_log",
        sa.Column("audit_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True)),
        sa.Column("actor_email", sa.String(255)),
        sa.Column("action", sa.String(50), nullable=False, index=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(64)),
        sa.Column("payload", postgresql.JSONB),
        sa.Column("ip_address", sa.String(64)),
        sa.Column("note", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
    )

    # Timescale hypertables: fortigate_log, cisco_event
    op.create_table(
        "t_fortigate_log",
        sa.Column("id", sa.BigInteger, autoincrement=True),
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("device_name", sa.String(100)),
        sa.Column("src_ip", postgresql.INET),
        sa.Column("dst_ip", postgresql.INET),
        sa.Column("src_port", sa.BigInteger),
        sa.Column("dst_port", sa.BigInteger),
        sa.Column("action", sa.String(30)),
        sa.Column("threat", sa.String(100)),
        sa.Column("severity", sa.String(20)),
        sa.Column("policy_id", sa.String(50)),
        sa.Column("message", sa.Text),
        sa.Column("raw", postgresql.JSONB),
        sa.PrimaryKeyConstraint("id", "time"),
    )
    op.create_index("idx_fortigate_time", "t_fortigate_log", ["time"])

    op.create_table(
        "t_cisco_event",
        sa.Column("id", sa.BigInteger, autoincrement=True),
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("device_ip", postgresql.INET),
        sa.Column("device_name", sa.String(100)),
        sa.Column("trap_oid", sa.String(120)),
        sa.Column("severity", sa.String(20)),
        sa.Column("interface", sa.String(80)),
        sa.Column("message", sa.Text),
        sa.Column("varbinds", postgresql.JSONB),
        sa.PrimaryKeyConstraint("id", "time"),
    )
    op.create_index("idx_cisco_time", "t_cisco_event", ["time"])

    # Activate Timescale extension + hypertables (no-op if extension absent in dev)
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")
    op.execute(
        "SELECT create_hypertable('t_fortigate_log', 'time', if_not_exists => TRUE, migrate_data => TRUE);"
    )
    op.execute(
        "SELECT create_hypertable('t_cisco_event', 'time', if_not_exists => TRUE, migrate_data => TRUE);"
    )

    op.create_table(
        "t_entra_signin",
        sa.Column("signin_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("graph_id", sa.String(64), unique=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("user_principal_name", sa.String(255)),
        sa.Column("user_id", sa.String(64)),
        sa.Column("app_display_name", sa.String(200)),
        sa.Column("client_app", sa.String(60)),
        sa.Column("ip_address", postgresql.INET),
        sa.Column("country", sa.String(2)),
        sa.Column("city", sa.String(80)),
        sa.Column("latitude", sa.Float),
        sa.Column("longitude", sa.Float),
        sa.Column("risk_state", sa.String(40), index=True),
        sa.Column("risk_level", sa.String(20)),
        sa.Column("conditional_access", sa.String(40)),
        sa.Column("success", sa.Boolean, server_default=sa.text("true")),
        sa.Column("raw", postgresql.JSONB),
        sa.Column("ingested_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "t_knowledge_article",
        sa.Column("article_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("category", sa.String(80), index=True),
        sa.Column("tags", postgresql.ARRAY(sa.String)),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("summary", sa.Text),
        sa.Column("embedding", postgresql.ARRAY(sa.Float)),
        sa.Column("source_ticket_id", postgresql.UUID(as_uuid=True)),
        sa.Column("author_id", postgresql.UUID(as_uuid=True)),
        sa.Column("metadata", postgresql.JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("t_knowledge_article")
    op.drop_table("t_entra_signin")
    op.drop_table("t_cisco_event")
    op.drop_table("t_fortigate_log")
    op.drop_table("t_audit_log")
    op.drop_table("t_sla_contract")
    op.drop_table("t_cmdb_relation")
    op.drop_table("t_cmdb_item")
    op.drop_table("t_itsm_ticket")
