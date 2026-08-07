"""請求書明細."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class InvoiceItem(Base):
    __tablename__ = "t_invoice_item"

    item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("t_invoice.invoice_id"), nullable=False)
    line_no = Column(Integer, nullable=False, default=1)
    description = Column(Text)
    quantity = Column(Numeric(18, 3), default=1)
    unit_price = Column(Numeric(18, 2), default=0)
    tax_rate = Column(Numeric(4, 2), default=0.10)  # 軽減 0.08 / 標準 0.10
    amount_excl_tax = Column(Numeric(18, 2), default=0)
    tax_category = Column(String(20))  # standard / reduced / non-taxable
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
