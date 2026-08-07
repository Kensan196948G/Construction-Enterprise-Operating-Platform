"""契約管理."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class Contract(Base):
    """契約.

    contract_type:
      - construction (工事請負)
      - subcontract  (下請)
      - lease        (賃貸借)
      - service      (業務委託)
      - nda          (秘密保持)
    """

    __tablename__ = "t_contract"

    contract_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_no = Column(String(50), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    contract_type = Column(String(30), nullable=False)
    counterparty_name = Column(String(200), nullable=False)
    start_date = Column(Date, nullable=False, default=date.today)
    end_date = Column(Date)  # 契約満了日
    amount = Column(Numeric(18, 2), default=0)
    auto_renewal = Column(Boolean, default=False)
    termination_clause = Column(Text)  # 解約条件
    file_path = Column(String(500))  # 契約書 PDF 等
    e_archive_id = Column(UUID(as_uuid=True))  # 電帳法アーカイブ参照
    status = Column(String(20), default="active")  # active/expired/terminated
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
