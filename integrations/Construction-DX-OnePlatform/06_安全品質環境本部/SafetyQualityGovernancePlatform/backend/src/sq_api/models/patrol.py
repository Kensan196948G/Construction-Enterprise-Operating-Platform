"""Safety patrol model."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB, UUID

from ..db.session import Base


class SafetyPatrol(Base):
    __tablename__ = "t_safety_patrol"

    patrol_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True))
    patrol_date = Column(Date, nullable=False)
    inspector_id = Column(UUID(as_uuid=True))
    # [{item, result(pass/fail/na), comment, photo_id}]
    checklist = Column(JSONB, default=list)
    overall_rating = Column(String(10))  # A/B/C/D
    corrective_orders = Column(JSONB, default=list)
    photo_ids = Column(JSONB, default=list)
    follow_up_date = Column(Date)
    correction_status = Column(String(20), default="open")  # open/in_progress/closed
    status = Column(String(20), default="completed")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
