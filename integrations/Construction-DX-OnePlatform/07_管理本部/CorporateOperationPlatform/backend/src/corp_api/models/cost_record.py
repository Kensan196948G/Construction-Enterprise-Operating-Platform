"""工事原価レコード."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class CostRecord(Base):
    """工事原価.

    cost_type:
      - material   材料費
      - labor      労務費
      - subcontract 外注費
      - expense    経費
    source:
      - purchase   購買連携
      - labor      労務管理連携
      - manual     手入力
    """

    __tablename__ = "t_cost_record"

    cost_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False)
    cost_type = Column(String(20), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    source = Column(String(20), default="manual")
    reference_no = Column(String(50))  # 購買伝票/タイムカード等
    note = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
