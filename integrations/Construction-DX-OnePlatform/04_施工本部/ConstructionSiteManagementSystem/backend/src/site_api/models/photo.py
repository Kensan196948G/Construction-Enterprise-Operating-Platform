"""現場写真モデル."""
from __future__ import annotations

from datetime import datetime

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class SitePhoto(CommonBase):
    """現場写真 (`t_site_photo`)."""

    __tablename__ = "t_site_photo"

    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_construction_project.id", ondelete="CASCADE"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    category: Mapped[str | None] = mapped_column(String(30), nullable=True, doc="出来形/材料/安全/全景/その他")
    work_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True, doc="AI自動分類タグ")
    exif_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    sha256: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="改ざん検知ハッシュ")
    client_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True, doc="S3/MinIO 上のオブジェクトキー")
