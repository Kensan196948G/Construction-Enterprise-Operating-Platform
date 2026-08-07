"""買掛金."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class Payable(Base):
    """買掛金 (協力会社/資材業者への支払).

    status: pending / approved / paid / overdue
    """

    __tablename__ = "t_payable"

    payable_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True))  # 元のインボイス
    counterparty_name = Column(String(200), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    scheduled_date = Column(Date, nullable=False, default=date.today)  # 支払予定日
    actual_paid_date = Column(Date)
    payment_method = Column(String(30), default="bank_transfer")
    status = Column(String(20), default="pending")
    note = Column(String(500))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
