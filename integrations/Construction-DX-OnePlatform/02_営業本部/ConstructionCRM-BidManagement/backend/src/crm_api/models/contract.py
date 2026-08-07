"""契約モデル (建設業法 + 品確法準拠)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class Contract(CommonBase):
    """契約 (`t_crm_contract`).

    建設業法 19 条準拠の必須項目を保持する。
    """

    __tablename__ = "t_crm_contract"

    contract_number: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    client_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("t_crm_client.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    opportunity_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_crm_opportunity.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    quotation_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_crm_quotation.id", ondelete="SET NULL"),
        nullable=True,
    )

    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    work_site: Mapped[str | None] = mapped_column(String(300), nullable=True)
    contract_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)

    contract_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    work_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    work_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # draft / signed / executing / completed / cancelled
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="draft", index=True)
    payment_terms: Mapped[str | None] = mapped_column(Text, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
