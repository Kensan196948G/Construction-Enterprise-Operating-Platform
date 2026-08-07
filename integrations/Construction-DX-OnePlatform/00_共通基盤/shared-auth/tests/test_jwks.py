"""JWKS tests — Codex H1/H2 対応後."""
from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from cdx_auth.jwks import AuthInfraError, JWKSCache


def _keys(*kids: str) -> dict[str, Any]:
    return {"keys": [{"kid": k, "kty": "RSA", "n": "x", "e": "AQAB"} for k in kids]}


@pytest.mark.asyncio
async def test_cache_returns_known_kid():
    cache = JWKSCache("https://example/jwks", ttl=600)
    with patch.object(cache, "_fetch", AsyncMock(return_value=_keys("k1"))):
        assert (await cache.get_key("k1"))["kid"] == "k1"


@pytest.mark.asyncio
async def test_unknown_kid_triggers_force_refresh():
    cache = JWKSCache("https://example/jwks", ttl=600)
    fetcher = AsyncMock(side_effect=[_keys("k1"), _keys("k1", "k2")])
    with patch.object(cache, "_fetch", fetcher):
        assert await cache.get_key("k1") is not None
        result = await cache.get_key("k2")
        assert result is not None and result["kid"] == "k2"
    assert fetcher.await_count == 2


@pytest.mark.asyncio
async def test_force_refresh_is_rate_limited():
    cache = JWKSCache("https://example/jwks", ttl=600)
    fetcher = AsyncMock(return_value=_keys("k1"))
    with patch.object(cache, "_fetch", fetcher):
        await cache.get_key("missing-1")
        await cache.get_key("missing-2")
    assert fetcher.await_count == 2


@pytest.mark.asyncio
async def test_fetch_failure_serves_stale_cache_within_grace():
    cache = JWKSCache("https://example/jwks", ttl=1, grace_seconds=600)
    fetcher = AsyncMock(side_effect=[_keys("k1"), httpx.ConnectError("down")])
    with patch.object(cache, "_fetch", fetcher):
        assert await cache.get_key("k1") is not None
        import asyncio
        await asyncio.sleep(1.1)
        assert (await cache.get_key("k1")) is not None


@pytest.mark.asyncio
async def test_fetch_failure_with_no_cache_raises():
    cache = JWKSCache("https://example/jwks", ttl=600)
    with patch.object(cache, "_fetch", AsyncMock(side_effect=httpx.ConnectError("down"))):
        with pytest.raises(AuthInfraError):
            await cache.get_keys()
