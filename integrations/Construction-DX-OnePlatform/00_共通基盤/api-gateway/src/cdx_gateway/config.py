"""ゲートウェイ設定 (環境変数)."""
from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Construction DX 統合APIゲートウェイの設定."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---- サーバ ----
    GATEWAY_HOST: str = Field(default="0.0.0.0", description="バインドホスト")
    GATEWAY_PORT: int = Field(default=8080, description="バインドポート")
    ENV: str = Field(default="development", description="実行環境名")
    LOG_LEVEL: str = Field(default="INFO", description="ログレベル")

    # ---- CORS ----
    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"],
        description="許可オリジン一覧",
    )

    # ---- レート制限 ----
    RATE_LIMIT_PER_MIN: int = Field(default=600, description="IP/ユーザー単位の毎分上限")
    RATE_LIMIT_STORAGE_URI: str = Field(
        default="memory://", description="slowapi ストレージURI (例 redis://...)"
    )

    # ---- バックエンド (各部門API) ----
    SITE_API_URL: str = Field(
        default="http://localhost:8101", description="建設現場API (construction)"
    )
    SAFETY_API_URL: str = Field(default="http://localhost:8102", description="安全衛生API")
    ITSM_API_URL: str = Field(default="http://localhost:8103", description="ITSM API")
    PROCUREMENT_API_URL: str = Field(default="http://localhost:8104", description="調達API")
    SALES_API_URL: str = Field(default="http://localhost:8105", description="営業API")

    # ---- インフラ (readiness 用) ----
    POSTGRES_URL: str = Field(
        default="postgresql://cdx:cdx@localhost:5432/cdx", description="Postgres 接続文字列"
    )
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis URL")
    ELASTICSEARCH_URL: str = Field(
        default="http://localhost:9200", description="Elasticsearch URL"
    )

    # ---- プロキシ ----
    PROXY_TIMEOUT_SECONDS: float = Field(default=30.0, description="バックエンド呼び出しタイムアウト")

    def backend_url(self, department: str) -> str | None:
        """部門名 → バックエンドURL マッピング."""
        return {
            "construction": self.SITE_API_URL,
            "safety": self.SAFETY_API_URL,
            "itsm": self.ITSM_API_URL,
            "procurement": self.PROCUREMENT_API_URL,
            "sales": self.SALES_API_URL,
        }.get(department)


_settings: Settings | None = None


def get_settings() -> Settings:
    """シングルトン Settings を返す."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
