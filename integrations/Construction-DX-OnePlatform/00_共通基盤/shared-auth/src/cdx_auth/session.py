"""Redis ベースのセッションストア.

Codex Review H3/M4 対応:
- キー境界に tenant_id / app_id を含め、テナント/アプリ間混線を防ぐ
- TTL は config の min/max で強制バリデーション、None/0/負数は拒否
"""
from __future__ import annotations

import json
from typing import Any

import redis.asyncio as redis

from cdx_auth.config import AuthSettings


class SessionStore:
    def __init__(self, settings: AuthSettings):
        self._settings = settings
        self._client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password.get_secret_value() if settings.redis_password else None,
            db=settings.redis_db,
            decode_responses=True,
        )

    def _key(self, tenant_id: str, session_id: str) -> str:
        if not tenant_id or not session_id:
            raise ValueError("tenant_id and session_id are required")
        return f"cdx:session:{self._settings.app_id}:{tenant_id}:{session_id}"

    def _validate_ttl(self, ttl: int) -> int:
        if not isinstance(ttl, int) or ttl <= 0:
            raise ValueError(f"ttl must be a positive int, got {ttl!r}")
        lo, hi = self._settings.session_ttl_min, self._settings.session_ttl_max
        if not (lo <= ttl <= hi):
            raise ValueError(f"ttl must be within [{lo}, {hi}], got {ttl}")
        return ttl

    async def set(
        self,
        tenant_id: str,
        session_id: str,
        value: dict[str, Any],
        ttl: int = 3600,
    ) -> None:
        ttl = self._validate_ttl(ttl)
        await self._client.set(self._key(tenant_id, session_id), json.dumps(value), ex=ttl)

    async def get(self, tenant_id: str, session_id: str) -> dict[str, Any] | None:
        raw = await self._client.get(self._key(tenant_id, session_id))
        return json.loads(raw) if raw else None

    async def delete(self, tenant_id: str, session_id: str) -> None:
        await self._client.delete(self._key(tenant_id, session_id))

    async def close(self) -> None:
        await self._client.aclose()
