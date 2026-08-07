"""見積モデル (バージョン管理つき、電帳法対応)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column


class Quotation(CommonBase):
    """見積 (`t_crm_quotation`).

    修正のたびに version を上げて新レコードを作成する (履歴保存)。
    `quotation_number` + `version` で一意。
    電帳法対応のため、確定後は status を locked にし変更不可とする運用。
    """

    __tablename__ = "t_crm_quotation"
    __table_args__ = (
        UniqueConstraint("quotation_number", "version", name="uq_quotation_number_version"),
    )

    quotation_number: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

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

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    work_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 合計 (税抜/税込)
    subtotal_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)

    issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    valid_until: Mapped[date | None] = mapped_column(Date, nullable=True)

    # draft / issued / accepted / rejected / expired / locked
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="draft", index=True)
    # 電帳法対応: PDF 保管パス + sha256
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pdf_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)

    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
