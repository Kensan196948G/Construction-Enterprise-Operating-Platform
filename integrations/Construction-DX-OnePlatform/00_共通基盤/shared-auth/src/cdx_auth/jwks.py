"""JWKS (Entra ID 公開鍵) の取得とキャッシュ.

Codex Review H1/H2 対応:
- 未知 `kid` のときは一度だけ強制リフレッシュ (鍵ローテーション耐性)
- 取得失敗時は明示的に AuthInfraError を送出 (上位で 401/503 に変換)
- 取得失敗時も、既存キャッシュを短期 grace period の間は再利用する
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import httpx

log = logging.getLogger(__name__)


class AuthInfraError(Exception):
    """JWKS取得などの基盤エラー (一時的な可用性問題を含む)."""


class JWKSCache:
    """Entra ID JWKS の取得・キャッシュ.

    - TTL 内: キャッシュ返却
    - TTL 切れ: 取得、失敗時は grace period 内なら旧キャッシュを返す
    - 未知 kid: 一度だけ強制リフレッシュ (短時間レート制限あり)
    """

    def __init__(self, jwks_uri: str, ttl: int = 3600, grace_seconds: int = 300):
        self._uri = jwks_uri
        self._ttl = ttl
        self._grace = grace_seconds
        self._cache: dict[str, Any] | None = None
        self._fetched_at: float = 0.0
        self._last_force_refresh_at: float = 0.0
        self._lock = asyncio.Lock()

    async def _fetch(self) -> dict[str, Any]:
        """Codex 4回目 Medium 対応: JWKS 形状不正は AuthInfraError に正規化."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(self._uri)
            r.raise_for_status()
            try:
                payload = r.json()
            except ValueError as e:
                raise AuthInfraError(f"JWKS response is not JSON: {e}") from e
        if not isinstance(payload, dict):
            raise AuthInfraError(
                f"JWKS payload must be a JSON object, got {type(payload).__name__}"
            )
        keys = payload.get("keys")
        if not isinstance(keys, list):
            raise AuthInfraError(
                "JWKS payload missing 'keys' list (got type: "
                f"{type(keys).__name__ if keys is not None else 'None'})"
            )
        return payload  # type: ignore[no-any-return]

    async def get_keys(self) -> dict[str, Any]:
        now = time.time()
        if self._cache and (now - self._fetched_at) < self._ttl:
            return self._cache
        async with self._lock:
            now = time.time()
            if self._cache and (now - self._fetched_at) < self._ttl:
                return self._cache
            try:
                self._cache = await self._fetch()
                self._fetched_at = now
                return self._cache
            except Exception as e:  # noqa: BLE001
                if self._cache and (now - self._fetched_at) < (self._ttl + self._grace):
                    log.warning("JWKS fetch failed, serving stale cache: %s", e)
                    return self._cache
                log.error("JWKS fetch failed and no usable cache: %s", e)
                raise AuthInfraError("JWKS unavailable") from e

    async def get_key(self, kid: str) -> dict[str, Any] | None:
        keys = (await self.get_keys()).get("keys", [])
        found = next((k for k in keys if k.get("kid") == kid), None)
        if found is not None:
            return found

        now = time.time()
        if (now - self._last_force_refresh_at) < 30:
            log.info("Unknown kid=%s, but forced refresh rate-limited", kid)
            return None
        async with self._lock:
            now = time.time()
            if (now - self._last_force_refresh_at) < 30:
                return None
            self._last_force_refresh_at = now
            try:
                self._cache = await self._fetch()
                self._fetched_at = now
                log.info("JWKS force-refreshed due to unknown kid=%s", kid)
            except Exception as e:  # noqa: BLE001
                log.warning("JWKS force-refresh failed: %s", e)
                return None
        keys = (self._cache or {}).get("keys", [])
        return next((k for k in keys if k.get("kid") == kid), None)
