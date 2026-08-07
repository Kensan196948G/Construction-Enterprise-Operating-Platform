"""入札情報モデル (公共/民間 双方をサポート)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class BidRecord(CommonBase):
    """入札情報 (`t_crm_bid`).

    入札方式: 一般競争 / 指名競争 / 総合評価 / 随意 / プロポーザル。
    bid_type で公共 (public) / 民間 (private) を区別する。
    """

    __tablename__ = "t_crm_bid"

    bid_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    opportunity_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_crm_opportunity.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # 公共 / 民間
    bid_type: Mapped[str] = mapped_column(String(10), nullable=False, default="public")
    # 入札方式
    bid_method: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # 発注機関 / 発注者名
    issuer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # 日程
    announcement_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    bid_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    award_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # 金額
    bid_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    estimated_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    award_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)

    # 総合評価点
    technical_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    price_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    evaluation_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)

    # 結果: won / lost / cancel / pending
    result: Mapped[str] = mapped_column(String(10), nullable=False, default="pending", index=True)
    winner_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
