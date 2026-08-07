"""認証モジュール設定 — .env から読み込む.

Codex Review M1/M3/M5 対応:
- JWT署名アルゴリズムは固定ホワイトリスト
- PUBLIC_PATHS を設定で上書き可能化
- 秘密情報は SecretStr で型レベル保護
"""
from __future__ import annotations

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ALLOWED_JWT_ALGORITHMS = frozenset({"RS256", "RS384", "RS512"})


class AuthSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    entra_tenant_id: str = Field(..., alias="ENTRA_TENANT_ID", min_length=1)
    entra_client_id: str = Field(..., alias="ENTRA_CLIENT_ID", min_length=1)
    entra_client_secret: SecretStr = Field(..., alias="ENTRA_CLIENT_SECRET")
    entra_redirect_uri: str = Field("http://localhost:8080/auth/callback", alias="ENTRA_REDIRECT_URI")

    hennge_issuer: str | None = Field(None, alias="HENNGE_ISSUER")
    hennge_client_id: str | None = Field(None, alias="HENNGE_CLIENT_ID")
    hennge_client_secret: SecretStr | None = Field(None, alias="HENNGE_CLIENT_SECRET")
    hennge_jwks_uri: str | None = Field(None, alias="HENNGE_JWKS_URI", description="HENNGE SSO の JWKS URI (HTTPS必須)")
    hennge_audience: str | None = Field(None, alias="HENNGE_AUDIENCE")

    @field_validator("hennge_issuer", "hennge_jwks_uri")
    @classmethod
    def _validate_hennge_url(cls, v: str | None) -> str | None:
        """Codex Loop #5 指摘: HTTPS 必須・制御文字拒否・整合確認."""
        if v is None or v == "":
            return v
        if any(ch.isspace() or ord(ch) < 0x20 for ch in v):
            raise ValueError("HENNGE URL contains whitespace or control characters")
        if not v.startswith("https://"):
            raise ValueError(f"HENNGE URL must use https:// scheme, got: {v[:30]!r}")
        return v

    jwt_algorithm: str = Field("RS256", alias="JWT_ALGORITHM")
    jwt_audience: str = Field(..., alias="JWT_AUDIENCE", min_length=1)
    jwt_public_key_cache_ttl: int = Field(3600, alias="JWT_PUBLIC_KEY_CACHE_TTL", ge=60, le=86400)

    redis_host: str = Field("redis", alias="REDIS_HOST")
    redis_port: int = Field(6379, alias="REDIS_PORT", ge=1, le=65535)
    redis_password: SecretStr | None = Field(None, alias="REDIS_PASSWORD")
    redis_db: int = Field(0, alias="REDIS_DB", ge=0, le=15)

    hennge_tenant_id: str | None = Field(
        None,
        alias="HENNGE_TENANT_ID",
        description="HENNGE 発行トークン の tenant_id (Codex L-New-1 対応, 未設定時は issuer host を使う)",
    )

    app_id: str = Field("cdx", alias="CDX_APP_ID", description="セッションキー名前空間")
    session_ttl_min: int = Field(60, alias="CDX_SESSION_TTL_MIN", ge=60)
    session_ttl_max: int = Field(86400, alias="CDX_SESSION_TTL_MAX", ge=60, le=86400)

    expose_openapi: bool = Field(False, alias="EXPOSE_OPENAPI", description="本番では false")
    public_paths_extra: str = Field("", alias="PUBLIC_PATHS_EXTRA", description="カンマ区切りの追加公開パス")

    @field_validator("jwt_algorithm")
    @classmethod
    def _validate_alg(cls, v: str) -> str:
        if v not in ALLOWED_JWT_ALGORITHMS:
            raise ValueError(
                f"JWT_ALGORITHM must be one of {sorted(ALLOWED_JWT_ALGORITHMS)}, got {v!r}"
            )
        return v

    @field_validator("jwt_audience")
    @classmethod
    def _refuse_default_audience(cls, v: str) -> str:
        if v == "construction-dx":
            raise ValueError(
                "JWT_AUDIENCE must be explicitly set to the production audience; "
                "the placeholder 'construction-dx' is rejected."
            )
        return v

    @property
    def entra_authority(self) -> str:
        return f"https://login.microsoftonline.com/{self.entra_tenant_id}"

    @property
    def entra_jwks_uri(self) -> str:
        return f"{self.entra_authority}/discovery/v2.0/keys"

    @property
    def entra_issuer(self) -> str:
        return f"{self.entra_authority}/v2.0"

    def hennge_enabled(self) -> bool:
        if not (self.hennge_issuer and self.hennge_jwks_uri and self.hennge_audience):
            return False
        from urllib.parse import urlparse

        issuer_host = urlparse(self.hennge_issuer).hostname or ""
        jwks_host = urlparse(self.hennge_jwks_uri).hostname or ""
        if not issuer_host or not jwks_host:
            return False
        if jwks_host != issuer_host and not jwks_host.endswith("." + issuer_host):
            import logging
            logging.getLogger(__name__).warning(
                "HENNGE_JWKS_URI host=%s not under HENNGE_ISSUER host=%s; disabling HENNGE",
                jwks_host,
                issuer_host,
            )
            return False
        return True

    def trusted_issuers(self) -> dict[str, dict[str, str]]:
        """Issuer -> {jwks_uri, audience} の写像を返す."""
        issuers = {
            self.entra_issuer: {
                "jwks_uri": self.entra_jwks_uri,
                "audience": self.jwt_audience,
            }
        }
        if self.hennge_enabled():
            issuers[self.hennge_issuer] = {  # type: ignore[index]
                "jwks_uri": self.hennge_jwks_uri,  # type: ignore[dict-item]
                "audience": self.hennge_audience,  # type: ignore[dict-item]
            }
        return issuers

    def public_paths(self) -> set[str]:
        defaults = {"/health", "/auth/login", "/auth/callback", "/auth/logout"}
        if self.expose_openapi:
            defaults |= {"/docs", "/openapi.json", "/redoc"}
        extras = {p.strip() for p in self.public_paths_extra.split(",") if p.strip()}
        return defaults | extras
