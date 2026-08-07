"""案件パイプラインモデル."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class Opportunity(CommonBase):
    """案件パイプライン (`t_crm_opportunity`).

    詳細設計仕様書 `t_sales_project` に対応。
    段階: lead -> qualified -> proposal -> bid -> won/lost。
    """

    __tablename__ = "t_crm_opportunity"

    opportunity_code: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    client_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("t_crm_client.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # lead / qualified / proposal / bid / won / lost
    stage: Mapped[str] = mapped_column(String(20), nullable=False, default="lead", index=True)
    project_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="private", doc="public|private|design_build|other"
    )
    work_category: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # 受注確度 (0-100%)
    win_probability: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=0
    )
    # 受注予想金額
    expected_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    # 受注予想日
    expected_close_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    owner_employee_code: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    branch_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    lost_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
