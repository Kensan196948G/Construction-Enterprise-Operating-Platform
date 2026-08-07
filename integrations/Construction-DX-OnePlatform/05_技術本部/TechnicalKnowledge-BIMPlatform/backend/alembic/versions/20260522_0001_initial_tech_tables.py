"""initial tech knowledge & BIM tables

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
    op.create_table(
        "t_knowledge_article",
        *_common_cols(),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("author_id", sa.String(128)),
        sa.Column("author_name", sa.String(128)),
        sa.Column("body_markdown", sa.Text),
        sa.Column("doc_type", sa.String(50)),
        sa.Column("work_type", sa.String(100)),
        sa.Column("tags", postgresql.ARRAY(sa.String(64))),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("view_count", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("like_count", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("embedding", postgresql.JSONB),
        sa.Column("sharepoint_url", sa.String(500)),
    )
    op.create_index("ix_t_knowledge_article_title", "t_knowledge_article", ["title"])
    op.create_index(
        "ix_t_knowledge_article_work_type", "t_knowledge_article", ["work_type"]
    )
    op.create_index(
        "ix_t_knowledge_article_author_id", "t_knowledge_article", ["author_id"]
    )

    op.create_table(
        "t_knowledge_attachment",
        *_common_cols(),
        sa.Column(
            "article_id",
            sa.BigInteger,
            sa.ForeignKey("t_knowledge_article.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("mime_type", sa.String(100)),
        sa.Column("file_size_bytes", sa.BigInteger),
        sa.Column("file_kind", sa.String(20), nullable=False),
        sa.Column("storage_url", sa.String(500), nullable=False),
    )
    op.create_index(
        "ix_t_knowledge_attachment_article_id",
        "t_knowledge_attachment",
        ["article_id"],
    )

    op.create_table(
        "t_bim_model",
        *_common_cols(),
        sa.Column("model_name", sa.String(200), nullable=False),
        sa.Column("project_id", sa.BigInteger),
        sa.Column("file_format", sa.String(20), nullable=False, server_default="IFC"),
        sa.Column("ifc_schema", sa.String(20)),
        sa.Column("storage_url", sa.String(500), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("lod", sa.String(10), nullable=False, server_default="LOD200"),
        sa.Column("crs", sa.String(50)),
        sa.Column("uploaded_at", sa.DateTime(timezone=True)),
        sa.Column("attributes", postgresql.JSONB),
    )
    op.create_index("ix_t_bim_model_model_name", "t_bim_model", ["model_name"])
    op.create_index("ix_t_bim_model_project_id", "t_bim_model", ["project_id"])

    op.create_table(
        "t_bim_revision",
        *_common_cols(),
        sa.Column(
            "bim_model_id",
            sa.BigInteger,
            sa.ForeignKey("t_bim_model.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("revision_no", sa.Integer, nullable=False),
        sa.Column("storage_url", sa.String(500), nullable=False),
        sa.Column("change_summary", sa.Text),
        sa.Column("revised_by", sa.String(128)),
    )
    op.create_index(
        "ix_t_bim_revision_bim_model_id", "t_bim_revision", ["bim_model_id"]
    )

    op.create_table(
        "t_cim_dataset",
        *_common_cols(),
        sa.Column("dataset_name", sa.String(200), nullable=False),
        sa.Column("project_id", sa.BigInteger),
        sa.Column("data_type", sa.String(20), nullable=False),
        sa.Column("file_format", sa.String(20), nullable=False),
        sa.Column("storage_url", sa.String(500), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger),
        sa.Column("crs", sa.String(50)),
        sa.Column("point_count", sa.BigInteger),
        sa.Column("bbox_min_x", sa.Numeric(20, 6)),
        sa.Column("bbox_min_y", sa.Numeric(20, 6)),
        sa.Column("bbox_min_z", sa.Numeric(20, 6)),
        sa.Column("bbox_max_x", sa.Numeric(20, 6)),
        sa.Column("bbox_max_y", sa.Numeric(20, 6)),
        sa.Column("bbox_max_z", sa.Numeric(20, 6)),
        sa.Column("tile_url_template", sa.String(500)),
        sa.Column("attributes", postgresql.JSONB),
    )
    op.create_index("ix_t_cim_dataset_dataset_name", "t_cim_dataset", ["dataset_name"])
    op.create_index("ix_t_cim_dataset_project_id", "t_cim_dataset", ["project_id"])

    op.create_table(
        "t_standard_drawing",
        *_common_cols(),
        sa.Column("drawing_code", sa.String(64), nullable=False, unique=True),
        sa.Column("drawing_name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(100)),
        sa.Column("file_format", sa.String(20), nullable=False, server_default="DWG"),
        sa.Column("storage_url", sa.String(500), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("revision", sa.String(10)),
    )
    op.create_index(
        "ix_t_standard_drawing_drawing_code", "t_standard_drawing", ["drawing_code"]
    )
    op.create_index(
        "ix_t_standard_drawing_category", "t_standard_drawing", ["category"]
    )

    op.create_table(
        "t_specification",
        *_common_cols(),
        sa.Column("spec_code", sa.String(64), nullable=False, unique=True),
        sa.Column("spec_name", sa.String(255), nullable=False),
        sa.Column("work_type", sa.String(100)),
        sa.Column("body_markdown", sa.Text),
        sa.Column("related_laws", postgresql.ARRAY(sa.String(120))),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("revision_note", sa.Text),
        sa.Column("storage_url", sa.String(500)),
    )
    op.create_index("ix_t_specification_spec_code", "t_specification", ["spec_code"])
    op.create_index("ix_t_specification_work_type", "t_specification", ["work_type"])

    op.create_table(
        "t_tech_inquiry",
        *_common_cols(),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("question", sa.Text, nullable=False),
        sa.Column("answer", sa.Text),
        sa.Column("ai_draft_answer", sa.Text),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("questioner_id", sa.String(128)),
        sa.Column("responder_id", sa.String(128)),
        sa.Column("related_article_ids", postgresql.ARRAY(sa.BigInteger)),
    )


def downgrade() -> None:
    op.drop_table("t_tech_inquiry")
    op.drop_table("t_specification")
    op.drop_table("t_standard_drawing")
    op.drop_table("t_cim_dataset")
    op.drop_table("t_bim_revision")
    op.drop_table("t_bim_model")
    op.drop_table("t_knowledge_attachment")
    op.drop_table("t_knowledge_article")
