"""initial schema for Data Lake & Digital Twin platform

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
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "t_data_source",
        sa.Column("source_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("department_id", sa.String(10), nullable=False, index=True),
        sa.Column("system_name", sa.String(120), nullable=False),
        sa.Column("source_type", sa.String(20), nullable=False),
        sa.Column("connection_info", postgresql.JSONB),
        sa.Column("schedule_cron", sa.String(60)),
        sa.Column("description", sa.String(500)),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true")),
        sa.Column("last_ingested_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "t_etl_job",
        sa.Column("job_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(200), unique=True, nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("t_data_source.source_id"), index=True),
        sa.Column("airflow_dag_id", sa.String(120)),
        sa.Column("transform_steps", postgresql.JSONB),
        sa.Column("output_table", sa.String(200), nullable=False),
        sa.Column("schedule_cron", sa.String(60)),
        sa.Column("last_run_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(20), server_default="idle"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "t_etl_run",
        sa.Column("run_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("t_etl_job.job_id"), nullable=False, index=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(20), nullable=False, server_default="running"),
        sa.Column("rows_in", sa.BigInteger),
        sa.Column("rows_out", sa.BigInteger),
        sa.Column("error_message", sa.Text),
    )

    op.create_table(
        "t_data_lake_table",
        sa.Column("table_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("table_name", sa.String(200), unique=True, nullable=False),
        sa.Column("zone", sa.String(20), nullable=False, server_default="curated", index=True),
        sa.Column("schema_def", postgresql.JSONB),
        sa.Column("row_count", sa.BigInteger),
        sa.Column("partition_keys", postgresql.ARRAY(sa.String)),
        sa.Column("description", sa.String(500)),
        sa.Column("source_systems", postgresql.ARRAY(sa.String)),
        sa.Column("last_updated", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "t_analytics_dataset",
        sa.Column("dataset_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(200), unique=True, nullable=False),
        sa.Column("dbt_model", sa.String(200)),
        sa.Column("purpose", sa.String(500)),
        sa.Column("owner", sa.String(120)),
        sa.Column("tags", postgresql.ARRAY(sa.String)),
        sa.Column("row_count", sa.BigInteger),
        sa.Column("freshness_sla_min", sa.Integer),
        sa.Column("last_refreshed_at", sa.DateTime(timezone=True)),
        sa.Column("extra", postgresql.JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "t_ai_model",
        sa.Column("model_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("version", sa.String(40), nullable=False, server_default="v1"),
        sa.Column("model_type", sa.String(30), nullable=False, index=True),
        sa.Column("framework", sa.String(60)),
        sa.Column("trained_at", sa.Date),
        sa.Column("metrics", postgresql.JSONB),
        sa.Column("accuracy", sa.Float),
        sa.Column("artifact_uri", sa.String(500)),
        sa.Column("deploy_status", sa.String(20), server_default="experiment"),
        sa.Column("description", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "t_iot_device",
        sa.Column("device_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("kind", sa.String(30), nullable=False, index=True),
        sa.Column("location_name", sa.String(200)),
        sa.Column("latitude", sa.Float),
        sa.Column("longitude", sa.Float),
        sa.Column("altitude_m", sa.Float),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), index=True),
        sa.Column("mqtt_topic", sa.String(255)),
        sa.Column("connection_info", postgresql.JSONB),
        sa.Column("status", sa.String(20), server_default="offline"),
        sa.Column("last_seen_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # IoT telemetry - Timescale hypertable
    op.create_table(
        "t_iot_telemetry",
        sa.Column("id", sa.BigInteger, autoincrement=True),
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("metric_kind", sa.String(40), nullable=False),
        sa.Column("payload", postgresql.JSONB, nullable=False),
        sa.PrimaryKeyConstraint("id", "time"),
    )
    op.create_index("idx_iot_telemetry_device", "t_iot_telemetry", ["device_id", "time"])
    op.create_index("idx_iot_telemetry_metric", "t_iot_telemetry", ["metric_kind", "time"])

    # Digital Twin Object with PostGIS geometry
    op.create_table(
        "t_digital_twin_object",
        sa.Column("object_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("kind", sa.String(30), nullable=False, index=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), index=True),
        sa.Column("asset_3d_uri", sa.String(500)),
        sa.Column("geom", sa.Text),  # Replaced post-create with PostGIS geometry below
        sa.Column("latitude", sa.Float),
        sa.Column("longitude", sa.Float),
        sa.Column("altitude_m", sa.Float),
        sa.Column("heading_deg", sa.Float),
        sa.Column("attributes", postgresql.JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.execute("ALTER TABLE t_digital_twin_object ALTER COLUMN geom TYPE geometry(GEOMETRY,4326) USING NULL")
    op.execute("CREATE INDEX idx_twin_geom_gist ON t_digital_twin_object USING GIST (geom)")

    # KPI - Timescale hypertable
    op.create_table(
        "t_kpi_metric",
        sa.Column("id", sa.BigInteger, autoincrement=True),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source", sa.String(60), nullable=False),
        sa.Column("metric_name", sa.String(120), nullable=False),
        sa.Column("value", sa.Float, nullable=False),
        sa.Column("dimensions", postgresql.JSONB),
        sa.PrimaryKeyConstraint("id", "observed_at"),
    )
    op.create_index("idx_kpi_metric_name", "t_kpi_metric", ["metric_name", "observed_at"])

    # Activate Timescale extension + hypertables (no-op if extension absent in dev)
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")
    op.execute(
        "SELECT create_hypertable('t_iot_telemetry', 'time', if_not_exists => TRUE, migrate_data => TRUE);"
    )
    op.execute(
        "SELECT create_hypertable('t_kpi_metric', 'observed_at', if_not_exists => TRUE, migrate_data => TRUE);"
    )


def downgrade() -> None:
    op.drop_table("t_kpi_metric")
    op.execute("DROP INDEX IF EXISTS idx_twin_geom_gist")
    op.drop_table("t_digital_twin_object")
    op.drop_table("t_iot_telemetry")
    op.drop_table("t_iot_device")
    op.drop_table("t_ai_model")
    op.drop_table("t_analytics_dataset")
    op.drop_table("t_data_lake_table")
    op.drop_table("t_etl_run")
    op.drop_table("t_etl_job")
    op.drop_table("t_data_source")
