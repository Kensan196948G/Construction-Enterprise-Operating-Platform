"""initial schema for Corporate Operation Platform.

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
        "t_account",
        sa.Column("account_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(10), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("parent_code", sa.String(10)),
        sa.Column("level", sa.Integer),
        sa.Column("is_active", sa.Integer),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_journal_entry",
        sa.Column("entry_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("txn_date", sa.Date, nullable=False),
        sa.Column("debit_account_code", sa.String(10), nullable=False),
        sa.Column("credit_account_code", sa.String(10), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("project_id", postgresql.UUID(as_uuid=True)),
        sa.Column("voucher_no", sa.String(30)),
        sa.Column("posted_by", postgresql.UUID(as_uuid=True)),
        sa.Column("status", sa.String(20)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index("idx_journal_voucher", "t_journal_entry", ["voucher_no"])
    op.create_index("idx_journal_txn_date", "t_journal_entry", ["txn_date"])

    op.create_table(
        "t_cost_record",
        sa.Column("cost_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cost_type", sa.String(20), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source", sa.String(20)),
        sa.Column("reference_no", sa.String(50)),
        sa.Column("note", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_cost_summary",
        sa.Column("summary_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("period_month", sa.Date, nullable=False),
        sa.Column("cost_type", sa.String(20), nullable=False),
        sa.Column("planned_amount", sa.Numeric(18, 2)),
        sa.Column("actual_amount", sa.Numeric(18, 2)),
        sa.Column("variance", sa.Numeric(18, 2)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_invoice",
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("invoice_number", sa.String(30), nullable=False),
        sa.Column("direction", sa.String(10)),
        sa.Column("issuer_name", sa.String(200), nullable=False),
        sa.Column("issuer_registration_no", sa.String(14), nullable=False),
        sa.Column("counterparty_name", sa.String(200)),
        sa.Column("invoice_date", sa.Date, nullable=False),
        sa.Column("payment_due_date", sa.Date),
        sa.Column("amount_excl_tax", sa.Numeric(18, 2)),
        sa.Column("tax_rate", sa.Numeric(4, 2)),
        sa.Column("tax_amount", sa.Numeric(18, 2)),
        sa.Column("amount_incl_tax", sa.Numeric(18, 2)),
        sa.Column("project_id", postgresql.UUID(as_uuid=True)),
        sa.Column("e_archive_id", postgresql.UUID(as_uuid=True)),
        sa.Column("status", sa.String(20)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index(
        "idx_invoice_search",
        "t_invoice",
        ["issuer_name", "invoice_date", "amount_incl_tax"],
    )
    op.create_table(
        "t_invoice_item",
        sa.Column("item_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "invoice_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("t_invoice.invoice_id"),
            nullable=False,
        ),
        sa.Column("line_no", sa.Integer),
        sa.Column("description", sa.Text),
        sa.Column("quantity", sa.Numeric(18, 3)),
        sa.Column("unit_price", sa.Numeric(18, 2)),
        sa.Column("tax_rate", sa.Numeric(4, 2)),
        sa.Column("amount_excl_tax", sa.Numeric(18, 2)),
        sa.Column("tax_category", sa.String(20)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_payable",
        sa.Column("payable_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True)),
        sa.Column("counterparty_name", sa.String(200), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("scheduled_date", sa.Date, nullable=False),
        sa.Column("actual_paid_date", sa.Date),
        sa.Column("payment_method", sa.String(30)),
        sa.Column("status", sa.String(20)),
        sa.Column("note", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_receivable",
        sa.Column("receivable_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True)),
        sa.Column("counterparty_name", sa.String(200), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("scheduled_date", sa.Date, nullable=False),
        sa.Column("actual_received_date", sa.Date),
        sa.Column("status", sa.String(20)),
        sa.Column("dunning_count", sa.Integer),
        sa.Column("last_dunning_date", sa.Date),
        sa.Column("dunning_note", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_contract",
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("contract_no", sa.String(50), unique=True, nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("contract_type", sa.String(30), nullable=False),
        sa.Column("counterparty_name", sa.String(200), nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date),
        sa.Column("amount", sa.Numeric(18, 2)),
        sa.Column("auto_renewal", sa.Boolean),
        sa.Column("termination_clause", sa.Text),
        sa.Column("file_path", sa.String(500)),
        sa.Column("e_archive_id", postgresql.UUID(as_uuid=True)),
        sa.Column("status", sa.String(20)),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_legal_matter",
        sa.Column("matter_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("matter_type", sa.String(30), nullable=False),
        sa.Column("counterparty_name", sa.String(200)),
        sa.Column("assigned_lawyer", sa.String(200)),
        sa.Column("opened_at", sa.Date),
        sa.Column("closed_at", sa.Date),
        sa.Column("status", sa.String(20)),
        sa.Column("related_files", postgresql.JSONB),
        sa.Column("description", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "t_electronic_archive",
        sa.Column("archive_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("target_type", sa.String(30), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True)),
        sa.Column("file_name", sa.String(300), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_size", sa.Integer),
        sa.Column("sha256", sa.String(64), nullable=False),
        sa.Column("timestamp_token", sa.Text),
        sa.Column("timestamp_issued_at", sa.DateTime(timezone=True)),
        sa.Column("search_date", sa.DateTime(timezone=True)),
        sa.Column("search_amount", sa.Integer),
        sa.Column("search_counterparty", sa.String(200)),
        sa.Column("revision_history", postgresql.JSONB),
        sa.Column("retention_until", sa.DateTime(timezone=True)),
        sa.Column("is_locked", sa.Integer),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index(
        "idx_archive_search",
        "t_electronic_archive",
        ["search_counterparty", "search_date", "search_amount"],
    )


def downgrade() -> None:
    for t in [
        "t_electronic_archive",
        "t_legal_matter",
        "t_contract",
        "t_receivable",
        "t_payable",
        "t_invoice_item",
        "t_invoice",
        "t_cost_summary",
        "t_cost_record",
        "t_journal_entry",
        "t_account",
    ]:
        op.drop_table(t)
