"""Near-miss (ヒヤリハット) model with 4M analysis."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from ..db.session import Base


class NearMiss(Base):
    __tablename__ = "t_near_miss"

    near_miss_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=True)
    reporter_id = Column(UUID(as_uuid=True), nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    location = Column(String(200))
    location_geom = Column(String(100))  # WKT lat/lng
    description = Column(Text, nullable=False)
    # 4M analysis: Man / Machine / Material(Media) / Method(Management)
    cause_analysis = Column(JSONB, default=dict)
    risk_level = Column(String(10), default="medium")  # high / medium / low
    severity = Column(String(20), default="minor")
    corrective_action = Column(Text)
    photo_ids = Column(JSONB, default=list)
    status = Column(String(20), default="reported")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
