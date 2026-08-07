"""勘定科目マスタ."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class Account(Base):
    """勘定科目マスタ.

    区分 (category):
      - asset    資産
      - liability 負債
      - equity   純資産
      - revenue  収益
      - expense  費用
    """

    __tablename__ = "t_account"

    account_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(10), unique=True, nullable=False)  # 例: '1110' 現金
    name = Column(String(100), nullable=False)
    category = Column(String(20), nullable=False)  # asset/liability/equity/revenue/expense
    parent_code = Column(String(10))  # 階層
    level = Column(Integer, default=1)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
