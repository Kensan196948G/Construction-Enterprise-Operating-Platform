"""Entra ID sign-in log."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from itsm_api.db.session import Base


class EntraSignin(Base):
    __tablename__ = "t_entra_signin"

    signin_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    graph_id: Mapped[str | None] = mapped_column(String(64), unique=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    user_principal_name: Mapped[str | None] = mapped_column(String(255))
    user_id: Mapped[str | None] = mapped_column(String(64))
    app_display_name: Mapped[str | None] = mapped_column(String(200))
    client_app: Mapped[str | None] = mapped_column(String(60))
    ip_address: Mapped[str | None] = mapped_column(INET)
    country: Mapped[str | None] = mapped_column(String(2))
    city: Mapped[str | None] = mapped_column(String(80))
    latitude: Mapped[float | None] = mapped_column()
    longitude: Mapped[float | None] = mapped_column()
    risk_state: Mapped[str | None] = mapped_column(String(40), index=True)  # none/atRisk/confirmedCompromised...
    risk_level: Mapped[str | None] = mapped_column(String(20))  # low/medium/high
    conditional_access: Mapped[str | None] = mapped_column(String(40))
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    raw: Mapped[dict | None] = mapped_column(JSONB)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
