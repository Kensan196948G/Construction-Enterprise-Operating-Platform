"""技術ナレッジ添付ファイルモデル."""
from __future__ import annotations

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column


class KnowledgeAttachment(CommonBase):
    """ナレッジ添付ファイル (`t_knowledge_attachment`).

    PDF / 動画 / CAD / BIM ファイルへの参照を保持。
    """

    __tablename__ = "t_knowledge_attachment"

    article_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("t_knowledge_article.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    file_kind: Mapped[str] = mapped_column(
        String(20), nullable=False, doc="pdf/video/cad/bim/other"
    )
    storage_url: Mapped[str] = mapped_column(String(500), nullable=False)
