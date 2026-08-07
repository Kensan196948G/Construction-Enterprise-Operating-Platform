"""AI 危険予測 API (Azure OpenAI GPT-4o 連携)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..config import settings
from ..services.ai_risk_predictor import RiskContext, predict

router = APIRouter()


class RiskPredictIn(BaseModel):
    project_id: str | None = None
    work_content: str
    location: str | None = None
    weather: str | None = None
    workers: int = 1
    historical_near_miss_count: int = 0
    hazards: list[str] = Field(default_factory=list)
    similar_events: list[dict[str, Any]] = Field(default_factory=list)


@router.post("/predict-risk")
def predict_risk(payload: RiskPredictIn) -> dict[str, Any]:
    """危険度推定。Azure OpenAI GPT-4o を呼ぶ (未設定時は stub).

    出力: risk_level / hazards / suggested_countermeasures / reasoning / confidence
    """
    ctx = RiskContext(
        work_content=payload.work_content,
        location=payload.location,
        weather=payload.weather,
        workers=payload.workers,
        historical_near_miss_count=payload.historical_near_miss_count,
        hazards=list(payload.hazards),
        similar_events=list(payload.similar_events),
        project_id=payload.project_id,
    )
    result = predict(ctx)
    result["azure_openai_configured"] = bool(
        settings.azure_openai_endpoint and settings.azure_openai_api_key
    )
    return result
