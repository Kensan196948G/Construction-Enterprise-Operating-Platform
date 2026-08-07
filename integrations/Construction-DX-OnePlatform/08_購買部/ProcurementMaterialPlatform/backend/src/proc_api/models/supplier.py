"""協力会社マスタモデル."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class Supplier(CommonBase):
    """協力会社 (`t_proc_supplier`).

    建設業許可番号・適格請求書発行事業者番号などコンプライアンス項目を含む。
    与信限度額・評価ランク・取引履歴サマリを保持する。
    """

    __tablename__ = "t_proc_supplier"

    supplier_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False, default="資材")
    # コンプライアンス
    construction_license_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    qualified_invoice_no: Mapped[str | None] = mapped_column(
        String(14), nullable=True, comment="適格請求書発行事業者番号 T+13桁"
    )
    # 与信
    credit_limit: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    current_balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False, default=Decimal("0")
    )
    # 評価
    evaluation_rank: Mapped[str | None] = mapped_column(String(1), nullable=True)  # S/A/B/C/D
    evaluation_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    safety_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    last_evaluated_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    # 取引履歴サマリ
    trade_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # 連絡先
    contact_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    branch_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
