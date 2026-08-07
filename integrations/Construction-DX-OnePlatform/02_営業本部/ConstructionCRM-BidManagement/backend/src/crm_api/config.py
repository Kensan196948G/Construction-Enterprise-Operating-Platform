"""建設CRM・入札管理 API 設定."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class CrmApiSettings(BaseSettings):
    """CRM API の設定値."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = Field(default="Construction CRM & Bid Management API")
    api_v1_prefix: str = Field(default="/api/v1")
    debug: bool = Field(default=False, alias="DEBUG")

    # PDF / quotation storage
    quotation_pdf_path: str = Field(
        default="/var/cdx/quotations", alias="QUOTATION_PDF_PATH"
    )
    # 電帳法保存期間 (年). 法定 7 年 + 余裕で 10 年
    quotation_retention_years: int = Field(default=10, alias="QUOTATION_RETENTION_YEARS")

    # 受注予測モデル
    forecast_weight_high: float = Field(default=0.9, alias="FORECAST_WEIGHT_HIGH")
    forecast_weight_medium: float = Field(default=0.5, alias="FORECAST_WEIGHT_MEDIUM")
    forecast_weight_low: float = Field(default=0.2, alias="FORECAST_WEIGHT_LOW")

    # CORS
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])


@lru_cache(maxsize=1)
def get_settings() -> CrmApiSettings:
    return CrmApiSettings()
