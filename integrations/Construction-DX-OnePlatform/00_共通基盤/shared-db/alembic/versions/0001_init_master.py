"""init master tables

Revision ID: 0001
Revises:
Create Date: 2026-05-22

共通マスタ初期スキーマ:
- PostGIS / TimescaleDB 拡張
- t_department, t_branch, t_employee, t_client_org, t_project, t_material
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _timestamp_audit_cols() -> list[sa.Column]:
    """全テーブル共通の監査カラム。"""
    return [
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(128), nullable=True),
        sa.Column("updated_by", sa.String(128), nullable=True),
    ]


def upgrade() -> None:
    # ---- 拡張 ----
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")

    # ---- t_department ----
    op.create_table(
        "t_department",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("dept_code", sa.String(32), nullable=False),
        sa.Column("dept_name", sa.String(128), nullable=False),
        sa.Column(
            "parent_id",
            sa.BigInteger,
            sa.ForeignKey("t_department.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("valid_from", sa.Date, nullable=True),
        sa.Column("valid_to", sa.Date, nullable=True),
        *_timestamp_audit_cols(),
        sa.UniqueConstraint("dept_code", name="uq_t_department_dept_code"),
    )
    op.create_index(
        "ix_t_department_dept_code", "t_department", ["dept_code"], unique=False
    )

    # ---- t_branch ----
    op.create_table(
        "t_branch",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("branch_code", sa.String(32), nullable=False),
        sa.Column("branch_name", sa.String(128), nullable=False),
        sa.Column("address", sa.String(255), nullable=True),
        sa.Column(
            "geom",
            Geometry(geometry_type="POINT", srid=4326, spatial_index=False),
            nullable=True,
        ),
        sa.Column(
            "dept_id",
            sa.BigInteger,
            sa.ForeignKey("t_department.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        *_timestamp_audit_cols(),
        sa.UniqueConstraint("branch_code", name="uq_t_branch_branch_code"),
    )
    op.create_index(
        "ix_t_branch_branch_code", "t_branch", ["branch_code"], unique=False
    )
    op.execute("CREATE INDEX ix_t_branch_geom ON t_branch USING GIST (geom)")

    # ---- t_client_org ----
    op.create_table(
        "t_client_org",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("client_code", sa.String(32), nullable=False),
        sa.Column("client_name", sa.String(255), nullable=False),
        sa.Column(
            "client_type", sa.String(16), nullable=False, server_default="private"
        ),
        sa.Column("address", sa.String(255), nullable=True),
        sa.Column("contact_name", sa.String(128), nullable=True),
        sa.Column("contact_email", sa.String(255), nullable=True),
        sa.Column("contact_phone", sa.String(32), nullable=True),
        *_timestamp_audit_cols(),
        sa.UniqueConstraint("client_code", name="uq_t_client_org_client_code"),
    )
    op.create_index(
        "ix_t_client_org_client_code", "t_client_org", ["client_code"], unique=False
    )

    # ---- t_employee ----
    op.create_table(
        "t_employee",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("employee_code", sa.String(32), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("name_kana", sa.String(128), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("entra_oid", sa.String(64), nullable=True),
        sa.Column(
            "dept_id",
            sa.BigInteger,
            sa.ForeignKey("t_department.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column(
            "branch_id",
            sa.BigInteger,
            sa.ForeignKey("t_branch.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column("position", sa.String(64), nullable=True),
        sa.Column("hire_date", sa.Date, nullable=True),
        sa.Column("valid_to", sa.Date, nullable=True),
        *_timestamp_audit_cols(),
        sa.UniqueConstraint("employee_code", name="uq_t_employee_employee_code"),
        sa.UniqueConstraint("entra_oid", name="uq_t_employee_entra_oid"),
    )
    op.create_index(
        "ix_t_employee_employee_code", "t_employee", ["employee_code"], unique=False
    )
    op.create_index("ix_t_employee_email", "t_employee", ["email"], unique=False)
    op.create_index(
        "ix_t_employee_entra_oid", "t_employee", ["entra_oid"], unique=False
    )

    # ---- t_project ----
    op.create_table(
        "t_project",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("project_code", sa.String(32), nullable=False),
        sa.Column("project_name", sa.String(255), nullable=False),
        sa.Column(
            "client_id",
            sa.BigInteger,
            sa.ForeignKey("t_client_org.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column(
            "dept_id",
            sa.BigInteger,
            sa.ForeignKey("t_department.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column(
            "branch_id",
            sa.BigInteger,
            sa.ForeignKey("t_branch.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column("contract_amount", sa.Numeric(18, 2), nullable=True),
        sa.Column("start_date", sa.Date, nullable=True),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="planned"),
        sa.Column(
            "geom",
            Geometry(geometry_type="POLYGON", srid=4326, spatial_index=False),
            nullable=True,
        ),
        *_timestamp_audit_cols(),
        sa.UniqueConstraint("project_code", name="uq_t_project_project_code"),
    )
    op.create_index(
        "ix_t_project_project_code", "t_project", ["project_code"], unique=False
    )
    op.execute("CREATE INDEX ix_t_project_geom ON t_project USING GIST (geom)")

    # ---- t_material ----
    op.create_table(
        "t_material",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("material_code", sa.String(32), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(64), nullable=True),
        sa.Column("unit", sa.String(16), nullable=False, server_default="個"),
        sa.Column("unit_price", sa.Numeric(14, 2), nullable=True),
        sa.Column("supplier_id", sa.BigInteger, nullable=True),
        sa.Column("latest_price_at", sa.DateTime(timezone=True), nullable=True),
        *_timestamp_audit_cols(),
        sa.UniqueConstraint("material_code", name="uq_t_material_material_code"),
    )
    op.create_index(
        "ix_t_material_material_code", "t_material", ["material_code"], unique=False
    )
    op.create_index("ix_t_material_category", "t_material", ["category"], unique=False)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_t_project_geom")
    op.execute("DROP INDEX IF EXISTS ix_t_branch_geom")

    op.drop_table("t_material")
    op.drop_table("t_project")
    op.drop_table("t_employee")
    op.drop_table("t_client_org")
    op.drop_table("t_branch")
    op.drop_table("t_department")
    # 拡張は他モジュールも使うため downgrade では落とさない
