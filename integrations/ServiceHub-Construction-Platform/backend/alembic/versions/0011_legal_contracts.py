"""Legal Tech Phase 1: legal_contracts テーブル新設

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-20

Legal Tech 統合 Phase 1 (#226):
- legal_contracts テーブル新設（契約台帳 + AI リスクスコア）
- IncidentCreate category に LEGAL 追加（スキーマのみ / DBカラム変更なし）
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "legal_contracts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "contract_type", sa.String(20), nullable=False, server_default="PRIME"
        ),
        sa.Column(
            "contract_number", sa.String(100), nullable=False, unique=True, index=True
        ),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("parties", JSONB, nullable=True),
        sa.Column("period_start", sa.Date, nullable=True),
        sa.Column("period_end", sa.Date, nullable=True),
        sa.Column("amount", sa.Numeric(15, 0), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("document_url", sa.String(1000), nullable=True),
        sa.Column(
            "ai_risk_score", sa.String(20), nullable=False, server_default="PENDING"
        ),
        sa.Column("ai_analysis_json", JSONB, nullable=True),
        sa.Column(
            "ai_analyzed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column("status", sa.String(20), nullable=False, server_default="DRAFT"),
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
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("legal_contracts")
