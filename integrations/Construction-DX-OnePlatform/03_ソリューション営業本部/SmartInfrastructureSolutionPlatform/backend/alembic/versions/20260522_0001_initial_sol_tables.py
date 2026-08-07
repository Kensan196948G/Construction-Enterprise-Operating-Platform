"""initial smart infrastructure solution platform tables

Revision ID: 20260522_0001
Revises:
Create Date: 2026-05-22 00:00:00

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geometry
from sqlalchemy.dialects import postgresql

revision: str = "20260522_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _common_cols() -> list[sa.Column]:
    return [
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(128), nullable=True),
        sa.Column("updated_by", sa.String(128), nullable=True),
    ]


def upgrade() -> None:
    # ソリューションカタログ
    op.create_table(
        "t_sol_catalog",
        *_common_cols(),
        sa.Column("catalog_code", sa.String(32), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(32), nullable=False),
        sa.Column("summary", sa.Text),
        sa.Column("description", sa.Text),
        sa.Column("price_min", sa.Numeric(18, 2)),
        sa.Column("price_max", sa.Numeric(18, 2)),
        sa.Column("standard_duration_months", sa.Integer),
        sa.Column("application_examples", postgresql.JSONB),
        sa.Column("tags", postgresql.JSONB),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_t_sol_catalog_code", "t_sol_catalog", ["catalog_code"])
    op.create_index("ix_t_sol_catalog_category", "t_sol_catalog", ["category"])

    # 提案案件
    op.create_table(
        "t_sol_proposal",
        *_common_cols(),
        sa.Column("proposal_code", sa.String(32), nullable=False, unique=True),
        sa.Column("client_name", sa.String(255), nullable=False),
        sa.Column("theme", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("status", sa.String(20), nullable=False, server_default="lead"),
        sa.Column("expected_amount", sa.Numeric(18, 2)),
        sa.Column("proposal_deadline", sa.Date),
        sa.Column("expected_close_date", sa.Date),
        sa.Column("owner_employee_code", sa.String(64)),
        sa.Column("primary_category", sa.String(32)),
        sa.Column("lost_reason", sa.String(255)),
    )
    op.create_index("ix_t_sol_proposal_code", "t_sol_proposal", ["proposal_code"])
    op.create_index("ix_t_sol_proposal_status", "t_sol_proposal", ["status"])
    op.create_index("ix_t_sol_proposal_owner", "t_sol_proposal", ["owner_employee_code"])

    # 提案-カタログ紐付け
    op.create_table(
        "t_sol_proposal_solution",
        *_common_cols(),
        sa.Column(
            "proposal_id",
            sa.BigInteger,
            sa.ForeignKey("t_sol_proposal.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "catalog_id",
            sa.BigInteger,
            sa.ForeignKey("t_sol_catalog.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("quantity", sa.Numeric(18, 3), nullable=False, server_default="1"),
        sa.Column("unit_price", sa.Numeric(18, 2)),
        sa.Column("custom_amount", sa.Numeric(18, 2)),
        sa.Column("custom_label", sa.String(255)),
        sa.Column("notes", sa.Text),
    )
    op.create_index(
        "ix_t_sol_ps_proposal_id", "t_sol_proposal_solution", ["proposal_id"]
    )
    op.create_index("ix_t_sol_ps_catalog_id", "t_sol_proposal_solution", ["catalog_id"])

    # F/S
    op.create_table(
        "t_sol_feasibility_study",
        *_common_cols(),
        sa.Column(
            "proposal_id",
            sa.BigInteger,
            sa.ForeignKey("t_sol_proposal.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("technical_score", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("legal_score", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("environment_score", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("business_score", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("total_score", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("decision", sa.String(8), nullable=False, server_default="HOLD"),
        sa.Column("risks", postgresql.JSONB),
        sa.Column("conclusion", sa.Text),
        sa.Column("notes", sa.Text),
    )
    op.create_index(
        "ix_t_sol_fs_proposal_id", "t_sol_feasibility_study", ["proposal_id"]
    )
    op.create_index("ix_t_sol_fs_decision", "t_sol_feasibility_study", ["decision"])
    op.create_index("ix_t_sol_fs_total_score", "t_sol_feasibility_study", ["total_score"])

    # インフラ資産
    op.create_table(
        "t_sol_infrastructure_asset",
        *_common_cols(),
        sa.Column("asset_code", sa.String(32), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("asset_type", sa.String(32), nullable=False),
        sa.Column(
            "location",
            Geometry(geometry_type="POINT", srid=4326),
            nullable=True,
        ),
        sa.Column("address", sa.String(300)),
        sa.Column("region", sa.String(100)),
        sa.Column("scale_metric", sa.Numeric(18, 2)),
        sa.Column("scale_unit", sa.String(20)),
        sa.Column("built_year", sa.Integer),
        sa.Column("last_inspection_date", sa.Date),
        sa.Column("deterioration_score", sa.Numeric(5, 2)),
        sa.Column("importance_level", sa.String(8)),
        sa.Column("applicable_laws", postgresql.JSONB),
        sa.Column("description", sa.Text),
    )
    op.create_index("ix_t_sol_asset_code", "t_sol_infrastructure_asset", ["asset_code"])
    op.create_index("ix_t_sol_asset_type", "t_sol_infrastructure_asset", ["asset_type"])

    # パートナー
    op.create_table(
        "t_sol_partner_org",
        *_common_cols(),
        sa.Column("partner_code", sa.String(32), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("partner_type", sa.String(20), nullable=False),
        sa.Column("contact_name", sa.String(100)),
        sa.Column("contact_email", sa.String(200)),
        sa.Column("phone", sa.String(32)),
        sa.Column("address", sa.String(300)),
        sa.Column("website", sa.String(300)),
        sa.Column("specialties", postgresql.JSONB),
        sa.Column("collaboration_history", postgresql.JSONB),
        sa.Column("notes", sa.Text),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_t_sol_partner_code", "t_sol_partner_org", ["partner_code"])
    op.create_index("ix_t_sol_partner_type", "t_sol_partner_org", ["partner_type"])

    # 事例集
    op.create_table(
        "t_sol_case_study",
        *_common_cols(),
        sa.Column("case_code", sa.String(32), nullable=False, unique=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("client_name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(32), nullable=False),
        sa.Column("completed_at", sa.Date),
        sa.Column("duration_months", sa.Integer),
        sa.Column("contract_amount", sa.Numeric(18, 2)),
        sa.Column("roi_percent", sa.Numeric(7, 2)),
        sa.Column("customer_rating", sa.Numeric(3, 2)),
        sa.Column("summary", sa.Text),
        sa.Column("achievements", sa.Text),
        sa.Column("photo_urls", postgresql.JSONB),
        sa.Column("related_patents", postgresql.JSONB),
        sa.Column("tags", postgresql.JSONB),
    )
    op.create_index("ix_t_sol_case_code", "t_sol_case_study", ["case_code"])
    op.create_index("ix_t_sol_case_category", "t_sol_case_study", ["category"])


def downgrade() -> None:
    for t in (
        "t_sol_case_study",
        "t_sol_partner_org",
        "t_sol_infrastructure_asset",
        "t_sol_feasibility_study",
        "t_sol_proposal_solution",
        "t_sol_proposal",
        "t_sol_catalog",
    ):
        op.drop_table(t)
