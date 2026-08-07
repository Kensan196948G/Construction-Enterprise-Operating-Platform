"""法務案件."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from ..db.session import Base


class LegalMatter(Base):
    """法務案件.

    matter_type:
      - dispute    紛争
      - claim      請求
      - compliance コンプラ
      - ip         知財
      - labor      労務関連
      - other
    """

    __tablename__ = "t_legal_matter"

    matter_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    matter_type = Column(String(30), nullable=False)
    counterparty_name = Column(String(200))
    assigned_lawyer = Column(String(200))  # 関与弁護士
    opened_at = Column(Date, default=date.today)
    closed_at = Column(Date)
    status = Column(String(20), default="open")  # open/in_progress/resolved/closed
    related_files = Column(JSONB, default=list)  # [{name, path, e_archive_id}]
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
