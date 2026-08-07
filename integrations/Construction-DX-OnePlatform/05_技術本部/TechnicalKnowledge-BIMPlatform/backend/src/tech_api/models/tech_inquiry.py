"""技術問合せモデル."""
from __future__ import annotations

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column


class TechInquiry(CommonBase):
    """技術問合せ Q&A (`t_tech_inquiry`)."""

    __tablename__ = "t_tech_inquiry"

    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_draft_answer: Mapped[str | None] = mapped_column(
        Text, nullable=True, doc="AI が生成した回答ドラフト"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="open", doc="open/in_review/resolved/archived"
    )
    questioner_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    responder_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    related_article_ids: Mapped[list[int] | None] = mapped_column(
        ARRAY(BigInteger), nullable=True
    )
