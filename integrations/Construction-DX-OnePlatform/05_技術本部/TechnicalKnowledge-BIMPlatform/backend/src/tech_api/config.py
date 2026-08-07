"""Technical Knowledge & BIM Platform API 設定."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class TechApiSettings(BaseSettings):
    """技術ナレッジ・BIM 基盤 API 設定値."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = Field(default="Technical Knowledge & BIM Platform API")
    api_v1_prefix: str = Field(default="/api/v1")
    debug: bool = Field(default=False, alias="DEBUG")

    # ストレージ (BIM/CIM の大容量ファイルは Azure Blob / MinIO へ)
    blob_endpoint: str | None = Field(default=None, alias="BLOB_ENDPOINT")
    bim_storage_path: str = Field(default="/var/cdx/bim", alias="BIM_STORAGE_PATH")
    cim_storage_path: str = Field(default="/var/cdx/cim", alias="CIM_STORAGE_PATH")
    knowledge_storage_path: str = Field(
        default="/var/cdx/knowledge", alias="KNOWLEDGE_STORAGE_PATH"
    )

    # アップロード上限 (チャンク分割を将来採用するため通常リクエスト上限は控えめ)
    max_upload_size_mb: int = Field(default=512, alias="MAX_UPLOAD_SIZE_MB")
    chunk_size_mb: int = Field(default=8, alias="CHUNK_SIZE_MB")

    # Azure OpenAI Embedding (ナレッジベクトル化)
    azure_openai_endpoint: str | None = Field(default=None, alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_key: str | None = Field(default=None, alias="AZURE_OPENAI_KEY")
    azure_openai_embed_deployment: str = Field(
        default="text-embedding-3-small", alias="AZURE_OPENAI_EMBED_DEPLOYMENT"
    )
    azure_openai_chat_deployment: str = Field(
        default="gpt-4o", alias="AZURE_OPENAI_CHAT_DEPLOYMENT"
    )
    embedding_dim: int = Field(default=1536, alias="EMBEDDING_DIM")

    # i-Construction 2.0
    iconstruction_strict_naming: bool = Field(
        default=True, alias="ICONSTRUCTION_STRICT_NAMING"
    )

    # CORS
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])


@lru_cache(maxsize=1)
def get_settings() -> TechApiSettings:
    return TechApiSettings()
