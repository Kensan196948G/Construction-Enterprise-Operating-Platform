"""Nonconformity with CAPA (corrective / preventive / effectiveness)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID

from ..db.session import Base


class Nonconformity(Base):
    __tablename__ = "t_nonconformity"

    nc_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True))
    detected_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    title = Column(String(200))
    description = Column(Text)
    severity = Column(String(20), default="minor")
    # CAPA: corrective / preventive / effectiveness verification
    corrective_action = Column(Text)
    preventive_action = Column(Text)
    effectiveness_verification = Column(Text)
    capa_status = Column(String(20), default="open")  # open/corrected/prevented/verified/closed
    due_date = Column(Date)
    closed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
