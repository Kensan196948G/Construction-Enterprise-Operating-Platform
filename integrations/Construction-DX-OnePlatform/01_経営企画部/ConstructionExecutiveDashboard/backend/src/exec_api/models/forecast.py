"""AI 予測結果."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class Forecast(CommonBase):
    """AI 予測結果 (`t_exec_forecast`).

    - target_metric: profit_margin / deficit_project / schedule_delay /
                     workforce_shortage / orders_amount など
    - model_name: prophet / sklearn_gbr / sklearn_rf / azure_openai
    - horizon_days: 予測ホライズン
    - predictions: [{ds, yhat, yhat_lower, yhat_upper}, ...]
    """

    __tablename__ = "t_exec_forecast"

    target_metric: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    model_name: Mapped[str] = mapped_column(String(50), nullable=False)
    horizon_days: Mapped[int] = mapped_column(nullable=False, default=90)
    confidence_interval: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), nullable=False, default=Decimal("0.8")
    )
    risk_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    predictions: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    feature_importance: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    summary: Mapped[str | None] = mapped_column(String(500), nullable=True)
