"""JWKS 応答形状検証 — Codex 4回目 M-New-1 対応."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from cdx_auth.jwks import AuthInfraError, JWKSCache


def _make_response(json_value: object, raise_json: bool = False) -> MagicMock:
    resp = MagicMock(spec=httpx.Response)
    resp.raise_for_status = MagicMock()
    if raise_json:
        resp.json = MagicMock(side_effect=ValueError("not json"))
    else:
        resp.json = MagicMock(return_value=json_value)
    return resp


def _patch_client(resp: MagicMock):
    client_mock = AsyncMock()
    client_mock.__aenter__.return_value = client_mock
    client_mock.__aexit__.return_value = False
    client_mock.get = AsyncMock(return_value=resp)
    return patch("cdx_auth.jwks.httpx.AsyncClient", return_value=client_mock)


@pytest.mark.asyncio
async def test_non_json_payload_raises_authinfra():
    cache = JWKSCache("https://example/jwks", ttl=600)
    with _patch_client(_make_response(None, raise_json=True)), pytest.raises(AuthInfraError):
        await cache.get_keys()


@pytest.mark.asyncio
async def test_non_dict_payload_raises_authinfra():
    cache = JWKSCache("https://example/jwks", ttl=600)
    with _patch_client(_make_response(["k1", "k2"])), pytest.raises(AuthInfraError):
        await cache.get_keys()


@pytest.mark.asyncio
async def test_missing_keys_field_raises_authinfra():
    cache = JWKSCache("https://example/jwks", ttl=600)
    with _patch_client(_make_response({"not_keys": []})), pytest.raises(AuthInfraError):
        await cache.get_keys()


@pytest.mark.asyncio
async def test_keys_field_not_list_raises_authinfra():
    cache = JWKSCache("https://example/jwks", ttl=600)
    with _patch_client(_make_response({"keys": "should-be-list"})), pytest.raises(AuthInfraError):
        await cache.get_keys()


@pytest.mark.asyncio
async def test_valid_payload_accepted():
    cache = JWKSCache("https://example/jwks", ttl=600)
    valid = {"keys": [{"kid": "k1", "kty": "RSA", "n": "x", "e": "AQAB"}]}
    with _patch_client(_make_response(valid)):
        result = await cache.get_keys()
    assert result == valid
