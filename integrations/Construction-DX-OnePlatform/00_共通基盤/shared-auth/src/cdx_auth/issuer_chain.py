"""複数 IdP (Entra ID + HENNGE SSO) を扱う Issuer-aware JWKS チェーン.

Codex Review L3 対応:
- issuer ごとに JWKSCache を保持し、未検証 JWT の `iss` クレームから切替
- 未登録 issuer は明示拒否
- 監査ログで使用された issuer を記録
"""
from __future__ import annotations

import logging
from typing import Any

from cdx_auth.config import AuthSettings
from cdx_auth.jwks import AuthInfraError, JWKSCache

log = logging.getLogger(__name__)


class IssuerChain:
    """信頼可能な複数 issuer の JWKS キャッシュをまとめる."""

    def __init__(self, settings: AuthSettings):
        self._settings = settings
        self._caches: dict[str, JWKSCache] = {}
        for issuer, info in settings.trusted_issuers().items():
            self._caches[issuer] = JWKSCache(
                info["jwks_uri"], ttl=settings.jwt_public_key_cache_ttl
            )
            log.info("audit: issuer registered: %s", issuer)

    def is_trusted(self, issuer: str) -> bool:
        return issuer in self._caches

    def cache_for(self, issuer: str) -> JWKSCache:
        if issuer not in self._caches:
            raise AuthInfraError(f"untrusted issuer: {issuer}")
        return self._caches[issuer]

    def audience_for(self, issuer: str) -> str:
        return self._settings.trusted_issuers()[issuer]["audience"]

    async def get_key(self, issuer: str, kid: str) -> dict[str, Any] | None:
        cache = self.cache_for(issuer)
        return await cache.get_key(kid)
