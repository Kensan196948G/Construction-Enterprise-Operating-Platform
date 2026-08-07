"""Smart Infrastructure Solution Platform API 設定."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class SolApiSettings(BaseSettings):
    """Solution API の設定値."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = Field(default="Smart Infrastructure Solution Platform API")
    api_v1_prefix: str = Field(default="/api/v1")
    debug: bool = Field(default=False, alias="DEBUG")

    # F/S スコア重み (技術/法務/環境/事業性 = 0.3/0.2/0.2/0.3)
    fs_weight_technical: float = Field(default=0.30, alias="FS_WEIGHT_TECHNICAL")
    fs_weight_legal: float = Field(default=0.20, alias="FS_WEIGHT_LEGAL")
    fs_weight_environment: float = Field(default=0.20, alias="FS_WEIGHT_ENVIRONMENT")
    fs_weight_business: float = Field(default=0.30, alias="FS_WEIGHT_BUSINESS")

    # GO / HOLD / NO_GO 閾値
    fs_threshold_go: float = Field(default=70.0, alias="FS_THRESHOLD_GO")
    fs_threshold_hold: float = Field(default=50.0, alias="FS_THRESHOLD_HOLD")

    # Azure OpenAI (類似度検索 stub)
    azure_openai_endpoint: str | None = Field(default=None, alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_api_key: str | None = Field(default=None, alias="AZURE_OPENAI_API_KEY")

    # CORS
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])


@lru_cache(maxsize=1)
def get_settings() -> SolApiSettings:
    return SolApiSettings()
