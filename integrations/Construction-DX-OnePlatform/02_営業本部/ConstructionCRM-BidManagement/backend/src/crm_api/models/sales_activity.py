"""営業活動履歴モデル."""

from __future__ import annotations

from datetime import date, datetime

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class SalesActivity(CommonBase):
    """営業活動 (`t_crm_sales_activity`).

    訪問 / 電話 / メール / 提案 / その他 を 1 レコードで記録。
    フォローアップ期日も保持する。
    """

    __tablename__ = "t_crm_sales_activity"

    activity_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    # visit / call / email / proposal / meeting / other
    activity_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    client_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_crm_client.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    opportunity_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_crm_opportunity.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    result: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # フォローアップ
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    follow_up_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    follow_up_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    reporter_employee_code: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
