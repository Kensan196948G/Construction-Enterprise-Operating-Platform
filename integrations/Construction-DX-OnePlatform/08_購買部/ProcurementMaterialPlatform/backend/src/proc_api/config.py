"""購買・調達 API 設定."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class ProcApiSettings(BaseSettings):
    """購買・調達・資材管理 API の設定値."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = Field(default="Procurement & Material Platform API")
    api_v1_prefix: str = Field(default="/api/v1")
    debug: bool = Field(default=False, alias="DEBUG")

    # 承認ワークフロー閾値 (円)
    approval_threshold_small: int = Field(default=1_000_000, alias="APPROVAL_THRESHOLD_SMALL")
    approval_threshold_medium: int = Field(default=5_000_000, alias="APPROVAL_THRESHOLD_MEDIUM")

    # 在庫アラート
    stockout_forecast_days: int = Field(default=7, alias="STOCKOUT_FORECAST_DAYS")

    # 評価ランクの閾値 (平均スコア 0-100)
    rank_thresholds: dict[str, int] = Field(
        default_factory=lambda: {"S": 90, "A": 80, "B": 65, "C": 50}
    )

    # CORS
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5174"])


@lru_cache(maxsize=1)
def get_settings() -> ProcApiSettings:
    return ProcApiSettings()
