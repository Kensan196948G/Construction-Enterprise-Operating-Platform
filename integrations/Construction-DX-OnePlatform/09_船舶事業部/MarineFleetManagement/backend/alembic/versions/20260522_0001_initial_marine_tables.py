"""initial marine fleet tables

Revision ID: 20260522_0001
Revises:
Create Date: 2026-05-22 00:00:00
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geometry

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
    # 船舶マスタ
    op.create_table(
        "t_marine_vessel",
        *_common_cols(),
        sa.Column("vessel_code", sa.String(20), nullable=False, unique=True),
        sa.Column("vessel_name", sa.String(100), nullable=False),
        sa.Column("vessel_type", sa.String(30), nullable=False, server_default="作業船"),
        sa.Column("imo_number", sa.String(10)),
        sa.Column("mmsi", sa.String(9)),
        sa.Column("gross_tonnage", sa.Numeric(10, 2)),
        sa.Column("length_overall_m", sa.Numeric(7, 2)),
        sa.Column("draft_m", sa.Numeric(5, 2)),
        sa.Column("main_engine_kw", sa.Numeric(8, 2)),
        sa.Column("build_year", sa.Integer),
        sa.Column("home_port", sa.String(100)),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("current_location", Geometry(geometry_type="POINT", srid=4326)),
        sa.Column("last_known_at", sa.Date),
        sa.Column("remarks", sa.Text),
    )
    op.create_index("ix_t_marine_vessel_code", "t_marine_vessel", ["vessel_code"])
    op.create_index("ix_t_marine_vessel_imo", "t_marine_vessel", ["imo_number"])
    op.create_index("ix_t_marine_vessel_mmsi", "t_marine_vessel", ["mmsi"])

    # 運航計画
    op.create_table(
        "t_marine_voyage",
        *_common_cols(),
        sa.Column("voyage_no", sa.String(30), nullable=False, unique=True),
        sa.Column("vessel_id", sa.BigInteger,
                  sa.ForeignKey("t_marine_vessel.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("project_code", sa.String(32)),
        sa.Column("departure_port", sa.String(100), nullable=False),
        sa.Column("arrival_port", sa.String(100), nullable=False),
        sa.Column("planned_departure_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("planned_arrival_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actual_departure_at", sa.DateTime(timezone=True)),
        sa.Column("actual_arrival_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(20), nullable=False, server_default="planned"),
        sa.Column("purpose", sa.String(200)),
        sa.Column("remarks", sa.Text),
    )
    op.create_index("ix_t_marine_voyage_no", "t_marine_voyage", ["voyage_no"])
    op.create_index("ix_t_marine_voyage_project", "t_marine_voyage", ["project_code"])

    # 船位履歴 (TimescaleDB hypertable 想定)
    op.create_table(
        "t_marine_vessel_position",
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("vessel_id", sa.BigInteger,
                  sa.ForeignKey("t_marine_vessel.id", ondelete="CASCADE"), nullable=False),
        sa.Column("geom", Geometry(geometry_type="POINT", srid=4326)),
        sa.Column("speed_knots", sa.Numeric(5, 1)),
        sa.Column("heading_deg", sa.Numeric(5, 1)),
        sa.Column("source", sa.String(10), nullable=False, server_default="AIS"),
        sa.PrimaryKeyConstraint("time", "vessel_id"),
    )
    # TimescaleDB hypertable 化 (TimescaleDB 拡張が入っていない環境ではコメントアウト可)
    op.execute(
        "SELECT create_hypertable('t_marine_vessel_position', 'time', "
        "if_not_exists => TRUE, migrate_data => TRUE) "
        "FROM (SELECT 1 WHERE EXISTS "
        "(SELECT 1 FROM pg_extension WHERE extname='timescaledb')) AS _;"
    )

    # 海象データ
    op.create_table(
        "t_marine_weather",
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("station_code", sa.String(30), nullable=False),
        sa.Column("station_name", sa.String(100)),
        sa.Column("location", Geometry(geometry_type="POINT", srid=4326)),
        sa.Column("wind_speed_mps", sa.Numeric(5, 2)),
        sa.Column("wind_direction_deg", sa.Numeric(5, 1)),
        sa.Column("wave_height_m", sa.Numeric(5, 2)),
        sa.Column("wave_period_s", sa.Numeric(5, 2)),
        sa.Column("tide_level_m", sa.Numeric(5, 2)),
        sa.Column("visibility_km", sa.Numeric(5, 2)),
        sa.Column("source", sa.String(20), nullable=False, server_default="JMA"),
        sa.PrimaryKeyConstraint("time", "station_code"),
    )
    op.execute(
        "SELECT create_hypertable('t_marine_weather', 'time', "
        "if_not_exists => TRUE, migrate_data => TRUE) "
        "FROM (SELECT 1 WHERE EXISTS "
        "(SELECT 1 FROM pg_extension WHERE extname='timescaledb')) AS _;"
    )

    # 燃料記録
    op.create_table(
        "t_marine_fuel_record",
        *_common_cols(),
        sa.Column("vessel_id", sa.BigInteger,
                  sa.ForeignKey("t_marine_vessel.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fuel_type", sa.String(20), nullable=False, server_default="A重油"),
        sa.Column("refuel_liters", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("unit_price", sa.Numeric(8, 2)),
        sa.Column("remaining_liters", sa.Numeric(12, 2)),
        sa.Column("consumption_liters_per_hour", sa.Numeric(8, 3)),
        sa.Column("engine_hours", sa.Numeric(10, 2)),
        sa.Column("remarks", sa.Text),
    )

    # 乗組員
    op.create_table(
        "t_marine_crew_member",
        *_common_cols(),
        sa.Column("crew_code", sa.String(20), nullable=False, unique=True),
        sa.Column("full_name", sa.String(100), nullable=False),
        sa.Column("rank", sa.String(30), nullable=False, server_default="甲板員"),
        sa.Column("license_grade", sa.String(50)),
        sa.Column("license_no", sa.String(50)),
        sa.Column("license_expiry", sa.Date),
        sa.Column("sea_service_days_total", sa.Integer, nullable=False, server_default="0"),
        sa.Column("current_consecutive_days", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_rest_at", sa.Date),
        sa.Column("contact_phone", sa.String(50)),
        sa.Column("remarks", sa.Text),
    )
    op.create_index("ix_t_marine_crew_code", "t_marine_crew_member", ["crew_code"])

    # 乗船割当
    op.create_table(
        "t_marine_crew_assignment",
        *_common_cols(),
        sa.Column("voyage_id", sa.BigInteger,
                  sa.ForeignKey("t_marine_voyage.id", ondelete="CASCADE"), nullable=False),
        sa.Column("crew_member_id", sa.BigInteger,
                  sa.ForeignKey("t_marine_crew_member.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("onboard_role", sa.String(30), nullable=False, server_default="甲板員"),
        sa.Column("boarded_at", sa.Date, nullable=False),
        sa.Column("disembarked_at", sa.Date),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
    )

    # 寄港記録
    op.create_table(
        "t_marine_port_call",
        *_common_cols(),
        sa.Column("vessel_id", sa.BigInteger,
                  sa.ForeignKey("t_marine_vessel.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("voyage_id", sa.BigInteger,
                  sa.ForeignKey("t_marine_voyage.id", ondelete="SET NULL")),
        sa.Column("port_name", sa.String(100), nullable=False),
        sa.Column("port_unlocode", sa.String(10)),
        sa.Column("arrived_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("departed_at", sa.DateTime(timezone=True)),
        sa.Column("purpose", sa.String(100)),
        sa.Column("cost_jpy", sa.Numeric(15, 0)),
        sa.Column("remarks", sa.Text),
    )

    # 工事案件紐付
    op.create_table(
        "t_marine_construction_link",
        *_common_cols(),
        sa.Column("vessel_id", sa.BigInteger,
                  sa.ForeignKey("t_marine_vessel.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("project_code", sa.String(32), nullable=False),
        sa.Column("project_name", sa.String(200)),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date),
        sa.Column("used_days", sa.Integer, nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="in_progress"),
        sa.Column("remarks", sa.Text),
    )
    op.create_index("ix_t_marine_cl_project", "t_marine_construction_link", ["project_code"])


def downgrade() -> None:
    for tbl in [
        "t_marine_construction_link",
        "t_marine_port_call",
        "t_marine_crew_assignment",
        "t_marine_crew_member",
        "t_marine_fuel_record",
        "t_marine_weather",
        "t_marine_vessel_position",
        "t_marine_voyage",
        "t_marine_vessel",
    ]:
        op.drop_table(tbl)
