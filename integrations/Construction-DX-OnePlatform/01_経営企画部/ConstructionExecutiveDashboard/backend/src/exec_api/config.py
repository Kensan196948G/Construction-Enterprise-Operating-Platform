"""Executive Dashboard API 設定."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class ExecApiSettings(BaseSettings):
    """Executive Dashboard API の設定値."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = Field(default="Construction Executive Dashboard API")
    api_v1_prefix: str = Field(default="/api/v1")
    debug: bool = Field(default=False, alias="DEBUG")

    # 他部門 API エンドポイント (集約サービスが叩く)
    # Loop #4 互換: sales/construction/safety/corporate/procurement/itsm
    sales_api_base: str = Field(default="http://cdx-crm-api:8000", alias="SALES_API_BASE")
    construction_api_base: str = Field(
        default="http://cdx-site-api:8000", alias="CONSTRUCTION_API_BASE"
    )
    safety_api_base: str = Field(default="http://cdx-safety-api:8000", alias="SAFETY_API_BASE")
    corporate_api_base: str = Field(
        default="http://cdx-corporate-api:8000", alias="CORPORATE_API_BASE"
    )
    procurement_api_base: str = Field(
        default="http://cdx-procurement-api:8000", alias="PROCUREMENT_API_BASE"
    )
    itsm_api_base: str = Field(default="http://cdx-itsm-api:8000", alias="ITSM_API_BASE")

    # Loop #5: 10部門 (02..11) の dept-API 既定値. env 上書き可.
    dept_api_default_base: str = Field(default="http://mocks:8000", alias="DEPT_API_DEFAULT_BASE")
    dept02_api_base: str | None = Field(default=None, alias="DEPT02_API_BASE")  # 営業本部
    dept03_api_base: str | None = Field(default=None, alias="DEPT03_API_BASE")  # ソリューション営業
    dept04_api_base: str | None = Field(default=None, alias="DEPT04_API_BASE")  # 施工本部
    dept05_api_base: str | None = Field(default=None, alias="DEPT05_API_BASE")  # 技術本部
    dept06_api_base: str | None = Field(default=None, alias="DEPT06_API_BASE")  # 安全品質環境
    dept07_api_base: str | None = Field(default=None, alias="DEPT07_API_BASE")  # 管理本部
    dept08_api_base: str | None = Field(default=None, alias="DEPT08_API_BASE")  # 購買部
    dept09_api_base: str | None = Field(default=None, alias="DEPT09_API_BASE")  # 船舶事業部
    dept10_api_base: str | None = Field(default=None, alias="DEPT10_API_BASE")  # IT-DX
    dept11_api_base: str | None = Field(default=None, alias="DEPT11_API_BASE")  # 統合データ基盤

    aggregator_timeout_seconds: float = Field(default=5.0, alias="AGGREGATOR_TIMEOUT_SECONDS")
    aggregator_cache_ttl_seconds: int = Field(default=300, alias="AGGREGATOR_CACHE_TTL_SECONDS")

    # AI/予測
    forecast_default_horizon_days: int = Field(default=90, alias="FORECAST_HORIZON_DAYS")
    forecast_confidence_interval: float = Field(default=0.8, alias="FORECAST_CONFIDENCE_INTERVAL")
    azure_openai_endpoint: str | None = Field(default=None, alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_api_key: str | None = Field(default=None, alias="AZURE_OPENAI_API_KEY")
    azure_openai_deployment: str | None = Field(default=None, alias="AZURE_OPENAI_DEPLOYMENT")

    # アラート閾値 (経営閾値)
    alert_profit_margin_min: float = Field(default=0.05, alias="ALERT_PROFIT_MARGIN_MIN")
    alert_deficit_project_max: int = Field(default=3, alias="ALERT_DEFICIT_PROJECT_MAX")
    alert_accident_max: int = Field(default=2, alias="ALERT_ACCIDENT_MAX")
    alert_overtime_hours_max: float = Field(default=45.0, alias="ALERT_OVERTIME_HOURS_MAX")

    # CORS
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])


@lru_cache(maxsize=1)
def get_settings() -> ExecApiSettings:
    return ExecApiSettings()
