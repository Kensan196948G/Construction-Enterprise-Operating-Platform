"""add embedding column to case_study (pgvector or float[] fallback)

Revision ID: 20260522_0002
Revises: 20260522_0001
Create Date: 2026-05-22 01:00:00

pgvector 拡張が利用可能な環境では ``vector(1536)`` 型 + IVFFlat cos インデックス、
そうでなければ ``DOUBLE PRECISION[]`` で列のみ用意する。
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260522_0002"
down_revision: str | Sequence[str] | None = "20260522_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _has_pgvector(bind: sa.engine.Connection) -> bool:
    try:
        row = bind.execute(
            sa.text("SELECT 1 FROM pg_available_extensions WHERE name='vector'")
        ).first()
        return row is not None
    except Exception:
        return False


def upgrade() -> None:
    bind = op.get_bind()
    use_pgvector = _has_pgvector(bind)

    if use_pgvector:
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")
        op.execute(
            "ALTER TABLE t_sol_case_study "
            "ADD COLUMN IF NOT EXISTS embedding vector(1536)"
        )
        # cos 類似度 IVFFlat インデックス (lists=100, データ少のうちは無くてもOK)
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_t_sol_case_embedding "
            "ON t_sol_case_study USING ivfflat (embedding vector_cosine_ops) "
            "WITH (lists = 100)"
        )
    else:
        op.add_column(
            "t_sol_case_study",
            sa.Column(
                "embedding",
                postgresql.ARRAY(postgresql.DOUBLE_PRECISION),
                nullable=True,
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    use_pgvector = _has_pgvector(bind)
    if use_pgvector:
        op.execute("DROP INDEX IF EXISTS ix_t_sol_case_embedding")
    op.drop_column("t_sol_case_study", "embedding")
