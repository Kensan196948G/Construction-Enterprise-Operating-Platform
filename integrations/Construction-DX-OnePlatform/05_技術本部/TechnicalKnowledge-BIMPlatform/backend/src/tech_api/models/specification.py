"""仕様書モデル."""
from __future__ import annotations

from cdx_db.base import CommonBase
from sqlalchemy import Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column


class Specification(CommonBase):
    """仕様書 (`t_specification`).

    工種・内容・関連法規・改訂を保持。
    """

    __tablename__ = "t_specification"

    spec_code: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )
    spec_name: Mapped[str] = mapped_column(String(255), nullable=False)
    work_type: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    body_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    related_laws: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(120)), nullable=True, doc="関連法規 / ガイドライン"
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    revision_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    storage_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
