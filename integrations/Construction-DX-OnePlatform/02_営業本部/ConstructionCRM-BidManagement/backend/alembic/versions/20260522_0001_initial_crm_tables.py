"""initial crm bid management tables

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
    # 顧客
    op.create_table(
        "t_crm_client",
        *_common_cols(),
        sa.Column("client_code", sa.String(32), nullable=False, unique=True),
        sa.Column("client_name", sa.String(255), nullable=False),
        sa.Column("client_type", sa.String(20), nullable=False, server_default="private"),
        sa.Column("industry", sa.String(100)),
        sa.Column("address", sa.String(300)),
        sa.Column("phone", sa.String(32)),
        sa.Column("email", sa.String(200)),
        sa.Column("credit_rank", sa.String(8), nullable=False, server_default="未評価"),
        sa.Column("credit_limit", sa.Numeric(18, 2)),
        sa.Column("relationship_score", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("transaction_summary", postgresql.JSONB),
        sa.Column("notes", sa.Text),
    )
    op.create_index("ix_t_crm_client_credit_rank", "t_crm_client", ["credit_rank"])
    op.create_index("ix_t_crm_client_client_code", "t_crm_client", ["client_code"])

    # 案件パイプライン
    op.create_table(
        "t_crm_opportunity",
        *_common_cols(),
        sa.Column("opportunity_code", sa.String(32), nullable=False, unique=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column(
            "client_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_client.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("stage", sa.String(20), nullable=False, server_default="lead"),
        sa.Column("project_type", sa.String(30), nullable=False, server_default="private"),
        sa.Column("work_category", sa.String(100)),
        sa.Column("win_probability", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("expected_amount", sa.Numeric(18, 2)),
        sa.Column("expected_close_date", sa.Date),
        sa.Column("owner_employee_code", sa.String(64)),
        sa.Column("branch_id", sa.BigInteger),
        sa.Column("description", sa.Text),
        sa.Column("lost_reason", sa.String(255)),
    )
    op.create_index("ix_t_crm_opportunity_stage", "t_crm_opportunity", ["stage"])
    op.create_index("ix_t_crm_opportunity_client_id", "t_crm_opportunity", ["client_id"])
    op.create_index("ix_t_crm_opportunity_owner", "t_crm_opportunity", ["owner_employee_code"])

    # 入札
    op.create_table(
        "t_crm_bid",
        *_common_cols(),
        sa.Column("bid_code", sa.String(64), nullable=False, unique=True),
        sa.Column(
            "opportunity_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_opportunity.id", ondelete="SET NULL"),
        ),
        sa.Column("bid_type", sa.String(10), nullable=False, server_default="public"),
        sa.Column("bid_method", sa.String(30)),
        sa.Column("issuer_name", sa.String(255), nullable=False),
        sa.Column("project_name", sa.String(255), nullable=False),
        sa.Column("announcement_date", sa.Date),
        sa.Column("bid_date", sa.Date),
        sa.Column("award_date", sa.Date),
        sa.Column("bid_price", sa.Numeric(18, 2)),
        sa.Column("estimated_price", sa.Numeric(18, 2)),
        sa.Column("award_price", sa.Numeric(18, 2)),
        sa.Column("technical_score", sa.Numeric(5, 2)),
        sa.Column("price_score", sa.Numeric(5, 2)),
        sa.Column("evaluation_score", sa.Numeric(5, 2)),
        sa.Column("result", sa.String(10), nullable=False, server_default="pending"),
        sa.Column("winner_name", sa.String(255)),
        sa.Column("remarks", sa.Text),
    )
    op.create_index("ix_t_crm_bid_result", "t_crm_bid", ["result"])
    op.create_index("ix_t_crm_bid_opportunity_id", "t_crm_bid", ["opportunity_id"])

    # 入札参加者
    op.create_table(
        "t_crm_bid_competitor",
        *_common_cols(),
        sa.Column(
            "bid_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_bid.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("competitor_name", sa.String(255), nullable=False),
        sa.Column("bid_price", sa.Numeric(18, 2)),
        sa.Column("technical_score", sa.Numeric(5, 2)),
        sa.Column("is_winner", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("rank", sa.Integer),
    )
    op.create_index("ix_t_crm_bid_competitor_bid_id", "t_crm_bid_competitor", ["bid_id"])

    # 見積
    op.create_table(
        "t_crm_quotation",
        *_common_cols(),
        sa.Column("quotation_number", sa.String(32), nullable=False),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column(
            "client_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_client.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "opportunity_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_opportunity.id", ondelete="SET NULL"),
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("work_description", sa.Text),
        sa.Column("subtotal_amount", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("tax_amount", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("issue_date", sa.Date),
        sa.Column("valid_until", sa.Date),
        sa.Column("status", sa.String(16), nullable=False, server_default="draft"),
        sa.Column("pdf_path", sa.String(500)),
        sa.Column("pdf_sha256", sa.String(64)),
        sa.Column("remarks", sa.Text),
        sa.UniqueConstraint("quotation_number", "version", name="uq_quotation_number_version"),
    )
    op.create_index("ix_t_crm_quotation_number", "t_crm_quotation", ["quotation_number"])
    op.create_index("ix_t_crm_quotation_status", "t_crm_quotation", ["status"])
    op.create_index("ix_t_crm_quotation_client_id", "t_crm_quotation", ["client_id"])

    # 見積明細
    op.create_table(
        "t_crm_quotation_item",
        *_common_cols(),
        sa.Column(
            "quotation_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_quotation.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("line_no", sa.Integer, nullable=False, server_default="1"),
        sa.Column("item_name", sa.String(255), nullable=False),
        sa.Column("unit", sa.String(20)),
        sa.Column("quantity", sa.Numeric(18, 3), nullable=False, server_default="1"),
        sa.Column("unit_price", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("remarks", sa.String(500)),
    )
    op.create_index(
        "ix_t_crm_quotation_item_quotation_id", "t_crm_quotation_item", ["quotation_id"]
    )

    # 契約
    op.create_table(
        "t_crm_contract",
        *_common_cols(),
        sa.Column("contract_number", sa.String(32), nullable=False, unique=True),
        sa.Column(
            "client_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_client.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "opportunity_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_opportunity.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "quotation_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_quotation.id", ondelete="SET NULL"),
        ),
        sa.Column("project_name", sa.String(255), nullable=False),
        sa.Column("work_site", sa.String(300)),
        sa.Column("contract_amount", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("contract_date", sa.Date),
        sa.Column("work_start_date", sa.Date),
        sa.Column("work_end_date", sa.Date),
        sa.Column("status", sa.String(16), nullable=False, server_default="draft"),
        sa.Column("payment_terms", sa.Text),
        sa.Column("remarks", sa.Text),
    )
    op.create_index("ix_t_crm_contract_status", "t_crm_contract", ["status"])

    # 営業活動
    op.create_table(
        "t_crm_sales_activity",
        *_common_cols(),
        sa.Column("activity_date", sa.Date, nullable=False),
        sa.Column("activity_type", sa.String(20), nullable=False),
        sa.Column(
            "client_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_client.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "opportunity_id",
            sa.BigInteger,
            sa.ForeignKey("t_crm_opportunity.id", ondelete="SET NULL"),
        ),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("contact_person", sa.String(100)),
        sa.Column("content", sa.Text),
        sa.Column("result", sa.String(100)),
        sa.Column("follow_up_date", sa.Date),
        sa.Column("follow_up_action", sa.Text),
        sa.Column("follow_up_completed_at", sa.DateTime(timezone=True)),
        sa.Column("reporter_employee_code", sa.String(64)),
    )
    op.create_index("ix_t_crm_activity_date", "t_crm_sales_activity", ["activity_date"])
    op.create_index("ix_t_crm_activity_type", "t_crm_sales_activity", ["activity_type"])
    op.create_index("ix_t_crm_activity_client", "t_crm_sales_activity", ["client_id"])
    op.create_index("ix_t_crm_activity_opp", "t_crm_sales_activity", ["opportunity_id"])
    op.create_index("ix_t_crm_activity_follow_up", "t_crm_sales_activity", ["follow_up_date"])
    op.create_index("ix_t_crm_activity_reporter", "t_crm_sales_activity", ["reporter_employee_code"])


def downgrade() -> None:
    for t in (
        "t_crm_sales_activity",
        "t_crm_contract",
        "t_crm_quotation_item",
        "t_crm_quotation",
        "t_crm_bid_competitor",
        "t_crm_bid",
        "t_crm_opportunity",
        "t_crm_client",
    ):
        op.drop_table(t)
