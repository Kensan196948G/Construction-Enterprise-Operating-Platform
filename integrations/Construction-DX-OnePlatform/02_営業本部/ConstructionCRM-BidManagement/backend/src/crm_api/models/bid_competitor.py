"""入札参加者 / 競合落札情報モデル."""

from __future__ import annotations

from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column


class BidCompetitor(CommonBase):
    """入札参加者 (`t_crm_bid_competitor`).

    入札ごとに各社の入札額・落札フラグを保持し、競合分析に用いる。
    """

    __tablename__ = "t_crm_bid_competitor"

    bid_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("t_crm_bid.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    competitor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bid_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    technical_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    is_winner: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    rank: Mapped[int | None] = mapped_column(nullable=True)
