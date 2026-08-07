"""pgvector extension + vector(1536) embedding column for knowledge articles.

Revision ID: 0002_pgvector_knowledge
Revises: 0001_initial
Create Date: 2026-05-22
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_pgvector_knowledge"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Replace ARRAY(float) embedding with vector(1536). Existing rows lose data
    # (none in production yet) so a DROP/ADD is acceptable here.
    op.drop_column("t_knowledge_article", "embedding")
    op.add_column(
        "t_knowledge_article",
        sa.Column("embedding", sa.dialects.postgresql.ARRAY(sa.Float), nullable=True),
    )
    # Use raw SQL so the column type is exactly `vector(1536)` regardless of
    # whether the running SQLAlchemy install has the pgvector dialect type.
    op.execute("ALTER TABLE t_knowledge_article DROP COLUMN embedding")
    op.execute("ALTER TABLE t_knowledge_article ADD COLUMN embedding vector(1536)")

    # IVFFLAT index for fast approximate search (small lists OK for dev)
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_knowledge_embedding "
        "ON t_knowledge_article USING ivfflat (embedding vector_cosine_ops) "
        "WITH (lists = 100)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_knowledge_embedding")
    op.drop_column("t_knowledge_article", "embedding")
    op.add_column(
        "t_knowledge_article",
        sa.Column("embedding", sa.dialects.postgresql.ARRAY(sa.Float), nullable=True),
    )
    # Note: we do not DROP EXTENSION vector; it may be in use elsewhere.
