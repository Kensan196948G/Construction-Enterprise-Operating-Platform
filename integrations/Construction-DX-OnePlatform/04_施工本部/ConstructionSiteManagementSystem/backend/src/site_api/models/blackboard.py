"""電子黒板モデル (SHA-256 改ざん検知付き)."""
from __future__ import annotations

from datetime import date

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column


class ElectronicBoard(CommonBase):
    """電子黒板 (`t_electronic_board`)."""

    __tablename__ = "t_electronic_board"

    photo_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("t_site_photo.id", ondelete="SET NULL"), nullable=True
    )
    project_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    work_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    measurement_point: Mapped[str | None] = mapped_column(String(100), nullable=True)
    design_value: Mapped[str | None] = mapped_column(String(50), nullable=True)
    actual_value: Mapped[str | None] = mapped_column(String(50), nullable=True)
    contractor: Mapped[str | None] = mapped_column(String(100), nullable=True)
    record_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    hash_value: Mapped[str | None] = mapped_column(
        String(64), nullable=True, doc="board内容+画像のSHA-256"
    )
