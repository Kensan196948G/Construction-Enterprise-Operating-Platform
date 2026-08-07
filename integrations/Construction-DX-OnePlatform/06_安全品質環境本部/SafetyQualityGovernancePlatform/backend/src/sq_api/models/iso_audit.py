"""ISO audit (9001 / 14001 / 45001) with plan/execute/finding/followup."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from ..db.session import Base


class IsoAudit(Base):
    __tablename__ = "t_iso_audit"

    audit_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_type = Column(String(20))  # internal/external/surveillance
    iso_standard = Column(String(20))  # ISO9001/ISO14001/ISO45001
    plan_date = Column(Date)
    audit_date = Column(Date)
    follow_up_date = Column(Date)
    scope = Column(Text)
    # [{finding_type, clause, description, severity}]
    findings = Column(JSONB, default=list)
    lead_auditor = Column(String(100))
    status = Column(String(20), default="planned")  # planned/in_progress/completed/followed_up
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
