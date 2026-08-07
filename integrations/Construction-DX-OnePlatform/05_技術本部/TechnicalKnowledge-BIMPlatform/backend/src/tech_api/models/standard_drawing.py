"""標準図モデル."""
from __future__ import annotations

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Integer, String
from sqlalchemy.orm import Mapped, mapped_column


class StandardDrawing(CommonBase):
    """標準図 (`t_standard_drawing`)."""

    __tablename__ = "t_standard_drawing"

    drawing_code: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )
    drawing_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    file_format: Mapped[str] = mapped_column(
        String(20), nullable=False, default="DWG", doc="DWG/DXF/PDF"
    )
    storage_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    revision: Mapped[str | None] = mapped_column(String(10), nullable=True)
