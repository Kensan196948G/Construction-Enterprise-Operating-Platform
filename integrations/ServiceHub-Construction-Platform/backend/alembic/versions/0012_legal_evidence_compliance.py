"""Legal Tech Phase 2: legal_evidence + legal_compliance_checks テーブル新設

Revision ID: 0012
Revises: 0011
Create Date: 2026-05-27

Legal Tech 統合 Phase 2:
- legal_evidence テーブル新設（法的証跡タイムライン・SHA-256改ざん検知）
- legal_compliance_checks テーブル新設（コンプライアンスチェック履歴）
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- legal_evidence ---
    op.create_table(
        "legal_evidence",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("source_type", sa.String(30), nullable=False, index=True),
        sa.Column("source_id", UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("event_date", sa.Date, nullable=False, index=True),
        # SHA-256 tamper detection hash (64 hex chars)
        sa.Column("content_hash", sa.String(64), nullable=True),
        sa.Column("metadata_json", JSONB, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
    )

    # --- legal_compliance_checks ---
    op.create_table(
        "legal_compliance_checks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("check_type", sa.String(30), nullable=False, server_default="all"),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("score", sa.Integer, nullable=True),
        sa.Column("violations_json", JSONB, nullable=True),
        sa.Column("recommendations_json", JSONB, nullable=True),
        sa.Column("ai_used", sa.Boolean, nullable=False, server_default="false"),
        sa.Column(
            "checked_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
            index=True,
        ),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("legal_compliance_checks")
    op.drop_table("legal_evidence")
