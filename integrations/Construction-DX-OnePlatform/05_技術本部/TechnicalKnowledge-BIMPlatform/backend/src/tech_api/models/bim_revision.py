"""BIM 改訂履歴モデル."""
from __future__ import annotations

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class BimRevision(CommonBase):
    """BIM 改訂履歴 (`t_bim_revision`)."""

    __tablename__ = "t_bim_revision"

    bim_model_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("t_bim_model.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    revision_no: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_url: Mapped[str] = mapped_column(String(500), nullable=False)
    change_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    revised_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
