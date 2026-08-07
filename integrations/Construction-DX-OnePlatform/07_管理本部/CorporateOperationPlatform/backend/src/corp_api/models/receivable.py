"""売掛金."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class Receivable(Base):
    """売掛金 (発注者からの入金予定).

    status: pending / received / overdue
    督促管理: dunning_count + last_dunning_date で督促履歴を保持。
    """

    __tablename__ = "t_receivable"

    receivable_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True))  # 発行したインボイス
    counterparty_name = Column(String(200), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    scheduled_date = Column(Date, nullable=False, default=date.today)  # 入金予定日
    actual_received_date = Column(Date)
    status = Column(String(20), default="pending")
    dunning_count = Column(Integer, default=0)  # 督促回数
    last_dunning_date = Column(Date)
    dunning_note = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
