"""船舶運航管理 API 設定."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class MarineApiSettings(BaseSettings):
    """船舶運航管理 API の設定値."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = Field(default="Marine Fleet Management API")
    api_v1_prefix: str = Field(default="/api/v1")
    debug: bool = Field(default=False, alias="DEBUG")

    # 船員労働法準拠 (簡易)
    max_consecutive_sea_days: int = Field(default=30, alias="MAX_CONSECUTIVE_SEA_DAYS")
    min_weekly_rest_hours: int = Field(default=24, alias="MIN_WEEKLY_REST_HOURS")

    # ETA 計算: 海象補正係数
    eta_weather_factor_calm: float = Field(default=1.0, alias="ETA_WEATHER_FACTOR_CALM")
    eta_weather_factor_rough: float = Field(default=1.25, alias="ETA_WEATHER_FACTOR_ROUGH")

    # AIS 受信
    ais_source_default: str = Field(default="NMEA", alias="AIS_SOURCE_DEFAULT")

    # 外部 API stub URLs
    jma_marine_url: str = Field(
        default="https://www.jma.go.jp/bosai/forecast/data/forecast/", alias="JMA_MARINE_URL"
    )

    # CORS
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5175", "http://localhost:5174"]
    )


@lru_cache(maxsize=1)
def get_settings() -> MarineApiSettings:
    return MarineApiSettings()
