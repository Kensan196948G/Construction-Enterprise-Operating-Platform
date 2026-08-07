"""Occupational accident (労災事故) model."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from ..db.session import Base


class Accident(Base):
    __tablename__ = "t_accident"

    accident_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True))
    occurred_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    severity = Column(String(20))  # fatal/serious/minor/first_aid
    injury_type = Column(String(50))
    description = Column(Text)
    root_cause = Column(Text)
    corrective_actions = Column(JSONB, default=list)
    # Fields used for 度数率 / 強度率 calculation
    lost_days = Column(Integer, default=0)
    total_work_hours = Column(Float, default=0.0)
    injuries = Column(Integer, default=1)
    reported_to = Column(String(100))  # 労基署等
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
