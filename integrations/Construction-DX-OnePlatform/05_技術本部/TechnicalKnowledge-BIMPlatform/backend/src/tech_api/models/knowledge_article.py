"""技術ナレッジ記事モデル."""
from __future__ import annotations

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column


class KnowledgeArticle(CommonBase):
    """技術ナレッジ記事 (`t_knowledge_article`).

    題目, 著者, タグ, 公開状態, バージョン, embedding ベクトル (pgvector が無い環境では JSONB に格納)。
    """

    __tablename__ = "t_knowledge_article"

    title: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    author_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    author_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    body_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    doc_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True, doc="施工要領/技術論文/研究報告/規格基準"
    )
    work_type: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String(64)), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", doc="draft/published/archived"
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    view_count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    like_count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    embedding: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True, doc="ベクトル (pgvector 採用時は VECTOR(1536) に置き換える)"
    )
    sharepoint_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
