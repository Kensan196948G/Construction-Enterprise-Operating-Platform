"""DB 接続設定 (Pydantic Settings)。

`.env` または環境変数から `POSTGRES_*` を読み込み、SQLAlchemy 用の
async / sync DSN を生成する。
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class DBSettings(BaseSettings):
    """PostgreSQL 接続設定。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    postgres_host: str = Field(default="localhost", alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, alias="POSTGRES_PORT")
    postgres_db: str = Field(default="construction_dx", alias="POSTGRES_DB")
    postgres_user: str = Field(default="cdx_user", alias="POSTGRES_USER")
    postgres_password: str = Field(default="change_me", alias="POSTGRES_PASSWORD")
    postgres_ssl_mode: str = Field(default="disable", alias="POSTGRES_SSL_MODE")

    pool_size: int = Field(default=10, alias="DB_POOL_SIZE")
    max_overflow: int = Field(default=20, alias="DB_MAX_OVERFLOW")
    echo_sql: bool = Field(default=False, alias="DB_ECHO_SQL")

    @property
    def async_dsn(self) -> str:
        """asyncpg ドライバ用 DSN。"""
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def sync_dsn(self) -> str:
        """psycopg (sync) ドライバ用 DSN。Alembic から利用する。"""
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache(maxsize=1)
def get_db_settings() -> DBSettings:
    """プロセス内シングルトン。"""
    return DBSettings()
