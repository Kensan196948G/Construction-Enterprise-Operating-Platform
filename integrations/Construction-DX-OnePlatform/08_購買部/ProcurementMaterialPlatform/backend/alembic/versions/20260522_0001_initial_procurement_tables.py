"""initial procurement tables

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
    # 協力会社
    op.create_table(
        "t_proc_supplier",
        *_common_cols(),
        sa.Column("supplier_code", sa.String(20), nullable=False, unique=True),
        sa.Column("company_name", sa.String(200), nullable=False),
        sa.Column("category", sa.String(30), nullable=False, server_default="資材"),
        sa.Column("construction_license_no", sa.String(50)),
        sa.Column("qualified_invoice_no", sa.String(14)),
        sa.Column("credit_limit", sa.Numeric(18, 2)),
        sa.Column("current_balance", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("evaluation_rank", sa.String(1)),
        sa.Column("evaluation_score", sa.Numeric(5, 2)),
        sa.Column("safety_score", sa.Numeric(5, 2)),
        sa.Column("last_evaluated_at", sa.Date),
        sa.Column("trade_summary", postgresql.JSONB),
        sa.Column("contact_email", sa.String(200)),
        sa.Column("contact_phone", sa.String(50)),
        sa.Column("address", sa.String(300)),
        sa.Column("remarks", sa.Text),
        sa.Column("branch_id", sa.BigInteger),
    )
    op.create_index("ix_t_proc_supplier_code", "t_proc_supplier", ["supplier_code"])

    # 購買依頼
    op.create_table(
        "t_proc_purchase_request",
        *_common_cols(),
        sa.Column("request_no", sa.String(20), nullable=False, unique=True),
        sa.Column("project_code", sa.String(32)),
        sa.Column("requester_id", sa.BigInteger),
        sa.Column("requester_name", sa.String(100)),
        sa.Column("items", postgresql.JSONB),
        sa.Column("estimated_total", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("desired_delivery_date", sa.Date),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("current_approval_step", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("total_approval_steps", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("approval_history", postgresql.JSONB),
        sa.Column("note", sa.Text),
    )
    op.create_index("ix_t_proc_pr_no", "t_proc_purchase_request", ["request_no"])
    op.create_index("ix_t_proc_pr_project", "t_proc_purchase_request", ["project_code"])

    # 発注
    op.create_table(
        "t_proc_purchase_order",
        *_common_cols(),
        sa.Column("po_number", sa.String(20), nullable=False, unique=True),
        sa.Column("request_id", sa.BigInteger, sa.ForeignKey("t_proc_purchase_request.id", ondelete="SET NULL")),
        sa.Column("supplier_id", sa.BigInteger, sa.ForeignKey("t_proc_supplier.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("project_code", sa.String(32)),
        sa.Column("total_amount", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("tax_amount", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("delivery_date", sa.Date),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("issued_at", sa.Date),
        sa.Column("remarks", sa.Text),
    )
    op.create_index("ix_t_proc_po_no", "t_proc_purchase_order", ["po_number"])
    op.create_index("ix_t_proc_po_project", "t_proc_purchase_order", ["project_code"])

    # 発注明細
    op.create_table(
        "t_proc_purchase_order_item",
        *_common_cols(),
        sa.Column("order_id", sa.BigInteger, sa.ForeignKey("t_proc_purchase_order.id", ondelete="CASCADE"), nullable=False),
        sa.Column("line_no", sa.BigInteger, nullable=False, server_default="1"),
        sa.Column("material_code", sa.String(32)),
        sa.Column("material_name", sa.String(200), nullable=False),
        sa.Column("quantity", sa.Numeric(15, 4), nullable=False),
        sa.Column("unit", sa.String(20), nullable=False, server_default="個"),
        sa.Column("unit_price", sa.Numeric(15, 2), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
    )

    # 納品
    op.create_table(
        "t_proc_delivery",
        *_common_cols(),
        sa.Column("delivery_no", sa.String(20), nullable=False, unique=True),
        sa.Column("order_id", sa.BigInteger, sa.ForeignKey("t_proc_purchase_order.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_item_id", sa.BigInteger, sa.ForeignKey("t_proc_purchase_order_item.id", ondelete="SET NULL")),
        sa.Column("delivered_qty", sa.Numeric(15, 4), nullable=False),
        sa.Column("defective_qty", sa.Numeric(15, 4), nullable=False, server_default="0"),
        sa.Column("delivery_date", sa.Date, nullable=False),
        sa.Column("inspected_at", sa.Date),
        sa.Column("inspector_id", sa.BigInteger),
        sa.Column("inspector_name", sa.String(100)),
        sa.Column("status", sa.String(20), nullable=False, server_default="received"),
        sa.Column("note", sa.Text),
    )

    # 在庫
    op.create_table(
        "t_proc_inventory",
        *_common_cols(),
        sa.Column("material_code", sa.String(32), nullable=False),
        sa.Column("material_name", sa.String(200), nullable=False),
        sa.Column("warehouse", sa.String(50), nullable=False, server_default="本社倉庫"),
        sa.Column("lot_no", sa.String(50)),
        sa.Column("quantity", sa.Numeric(15, 4), nullable=False, server_default="0"),
        sa.Column("unit", sa.String(20), nullable=False, server_default="個"),
        sa.Column("reorder_point", sa.Numeric(15, 4)),
        sa.Column("safety_stock", sa.Numeric(15, 4)),
        sa.Column("avg_daily_usage", sa.Numeric(15, 4)),
        sa.Column("last_received_at", sa.Date),
        sa.Column("last_stocktake_at", sa.Date),
        sa.Column("branch_id", sa.BigInteger),
    )
    op.create_index("ix_t_proc_inv_code", "t_proc_inventory", ["material_code"])

    # 在庫移動
    op.create_table(
        "t_proc_inventory_movement",
        *_common_cols(),
        sa.Column("inventory_id", sa.BigInteger, sa.ForeignKey("t_proc_inventory.id", ondelete="SET NULL")),
        sa.Column("material_code", sa.String(32), nullable=False),
        sa.Column("movement_type", sa.String(10), nullable=False),
        sa.Column("quantity", sa.Numeric(15, 4), nullable=False),
        sa.Column("unit", sa.String(20), nullable=False, server_default="個"),
        sa.Column("project_code", sa.String(32)),
        sa.Column("from_warehouse", sa.String(50)),
        sa.Column("to_warehouse", sa.String(50)),
        sa.Column("movement_date", sa.Date, nullable=False),
        sa.Column("operator_id", sa.BigInteger),
        sa.Column("reference_no", sa.String(50)),
        sa.Column("remarks", sa.Text),
    )
    op.create_index("ix_t_proc_invm_code", "t_proc_inventory_movement", ["material_code"])
    op.create_index("ix_t_proc_invm_project", "t_proc_inventory_movement", ["project_code"])

    # 価格履歴
    op.create_table(
        "t_proc_price_history",
        *_common_cols(),
        sa.Column("material_code", sa.String(32), nullable=False),
        sa.Column("material_name", sa.String(200)),
        sa.Column("supplier_id", sa.BigInteger, sa.ForeignKey("t_proc_supplier.id", ondelete="SET NULL")),
        sa.Column("unit_price", sa.Numeric(15, 2), nullable=False),
        sa.Column("unit", sa.String(20), nullable=False, server_default="個"),
        sa.Column("effective_date", sa.Date, nullable=False),
        sa.Column("source", sa.String(20), nullable=False, server_default="actual"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="JPY"),
    )
    op.create_index("ix_t_proc_ph_code", "t_proc_price_history", ["material_code"])


def downgrade() -> None:
    for tbl in [
        "t_proc_price_history",
        "t_proc_inventory_movement",
        "t_proc_inventory",
        "t_proc_delivery",
        "t_proc_purchase_order_item",
        "t_proc_purchase_order",
        "t_proc_purchase_request",
        "t_proc_supplier",
    ]:
        op.drop_table(tbl)
