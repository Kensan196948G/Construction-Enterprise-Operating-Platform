"""施工管理 API 設定."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class SiteApiSettings(BaseSettings):
    """施工管理 API の設定値."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = Field(default="Construction Site Management API")
    api_v1_prefix: str = Field(default="/api/v1")
    debug: bool = Field(default=False, alias="DEBUG")

    # File storage
    photo_storage_path: str = Field(default="/var/cdx/photos", alias="PHOTO_STORAGE_PATH")
    blob_endpoint: str | None = Field(default=None, alias="BLOB_ENDPOINT")

    # S3 / MinIO (S3 互換)
    s3_endpoint_url: str | None = Field(default=None, alias="S3_ENDPOINT_URL")
    s3_access_key: str | None = Field(default=None, alias="S3_ACCESS_KEY")
    s3_secret_key: str | None = Field(default=None, alias="S3_SECRET_KEY")
    s3_bucket: str = Field(default="cdx-site-photos", alias="S3_BUCKET")
    s3_region: str = Field(default="us-east-1", alias="S3_REGION")

    # Azure OpenAI Vision
    azure_openai_endpoint: str | None = Field(default=None, alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_key: str | None = Field(default=None, alias="AZURE_OPENAI_KEY")
    azure_openai_deployment: str = Field(default="gpt-4o", alias="AZURE_OPENAI_DEPLOYMENT")

    # Attendance QR
    qr_token_secret: str = Field(default="change-me-please", alias="QR_TOKEN_SECRET")
    qr_token_ttl_seconds: int = Field(default=300, alias="QR_TOKEN_TTL_SECONDS")

    # CORS
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])


@lru_cache(maxsize=1)
def get_settings() -> SiteApiSettings:
    return SiteApiSettings()
