"""add s3_key to t_site_photo

Revision ID: 20260522_0002
Revises: 20260522_0001
Create Date: 2026-05-22 00:00:00
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
    op.add_column(
        "t_site_photo",
        sa.Column("s3_key", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("t_site_photo", "s3_key")
