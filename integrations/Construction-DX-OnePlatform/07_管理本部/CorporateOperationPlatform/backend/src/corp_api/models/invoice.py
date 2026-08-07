"""請求書 (インボイス制度準拠)."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class Invoice(Base):
    """請求書.

    インボイス制度準拠フィールド:
      - issuer_registration_no: 適格請求書発行事業者番号 (T + 13 桁)
      - tax_rate: 税率区分 (0.08 軽減 / 0.10 標準)
      - tax_amount: 消費税額
    """

    __tablename__ = "t_invoice"

    invoice_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number = Column(String(30), nullable=False)  # 請求書番号
    direction = Column(String(10), default="received")  # received(買) / issued(売)
    issuer_name = Column(String(200), nullable=False)
    issuer_registration_no = Column(String(14), nullable=False)  # T + 13 桁
    counterparty_name = Column(String(200))
    invoice_date = Column(Date, nullable=False, default=date.today)
    payment_due_date = Column(Date)
    amount_excl_tax = Column(Numeric(18, 2), nullable=False, default=0)
    tax_rate = Column(Numeric(4, 2), nullable=False, default=0.10)  # 0.08 / 0.10
    tax_amount = Column(Numeric(18, 2), nullable=False, default=0)
    amount_incl_tax = Column(Numeric(18, 2), nullable=False, default=0)
    project_id = Column(UUID(as_uuid=True))  # 工事番号
    e_archive_id = Column(UUID(as_uuid=True))  # 電帳法アーカイブ参照
    status = Column(String(20), default="recorded")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
