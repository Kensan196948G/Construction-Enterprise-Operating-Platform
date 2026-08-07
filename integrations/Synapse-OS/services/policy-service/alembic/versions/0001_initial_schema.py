"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-23

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "policy_decisions",
        sa.Column("policy_decision_id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("decided_at", sa.DateTime(), nullable=False),
        sa.Column("payload", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("policy_decision_id"),
    )
    op.create_index("ix_policy_decisions_tenant_id", "policy_decisions", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_policy_decisions_tenant_id", table_name="policy_decisions")
    op.drop_table("policy_decisions")
