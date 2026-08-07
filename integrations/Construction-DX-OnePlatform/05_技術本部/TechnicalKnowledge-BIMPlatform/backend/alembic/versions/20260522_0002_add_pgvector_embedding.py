"""add pgvector embedding column for knowledge articles

Revision ID: 20260522_0002
Revises: 20260522_0001
Create Date: 2026-05-22 12:00:00
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260522_0002"
down_revision: str | Sequence[str] | None = "20260522_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """pgvector 拡張を有効化し、t_knowledge_article に VECTOR(1536) を追加する.

    pgvector がインストールされていない環境では CREATE EXTENSION が失敗するため、
    存在チェック付きで実行する。失敗時は JSONB 上の embedding を継続利用する。
    """
    bind = op.get_bind()
    has_pgvector = False
    try:
        bind.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS vector")
        has_pgvector = True
    except Exception:  # pragma: no cover - pgvector が無い環境
        has_pgvector = False

    if has_pgvector:
        # pgvector 型カラム追加 (JSONB embedding は維持してデータ移行時の互換性を保つ)
        op.execute(
            "ALTER TABLE t_knowledge_article "
            "ADD COLUMN IF NOT EXISTS embedding_vec vector(1536)"
        )
        # 近似最近傍検索用 IVFFLAT インデックス (cosine)
        try:
            op.execute(
                "CREATE INDEX IF NOT EXISTS ix_t_knowledge_article_embedding_vec "
                "ON t_knowledge_article USING ivfflat (embedding_vec vector_cosine_ops) "
                "WITH (lists = 100)"
            )
        except Exception:  # pragma: no cover - IVFFLAT 未対応バージョン
            pass
    else:
        # フォールバック: float8[] 配列カラムを追加して類似検索の SQL 対応に備える
        op.add_column(
            "t_knowledge_article",
            sa.Column("embedding_vec", sa.dialects.postgresql.ARRAY(sa.Float()), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    try:
        bind.exec_driver_sql(
            "DROP INDEX IF EXISTS ix_t_knowledge_article_embedding_vec"
        )
    except Exception:  # pragma: no cover
        pass
    try:
        op.drop_column("t_knowledge_article", "embedding_vec")
    except Exception:  # pragma: no cover
        pass
