"""ヘルスチェックエンドポイント (liveness / readiness)."""
from __future__ import annotations

import asyncio
from typing import Any

import httpx
import structlog
from fastapi import APIRouter, status

from cdx_gateway.config import get_settings
from cdx_gateway.openapi import COMMON_ERROR_RESPONSES, make_error, make_success

router = APIRouter(tags=["health"])
log = structlog.get_logger("cdx.gateway.health")


@router.get(
    "/health",
    summary="Liveness プローブ",
    description="プロセスが起動しているかを返します。認証不要。",
    responses={200: {"description": "正常"}},
)
async def health() -> dict[str, Any]:
    """常に 200 を返す liveness."""
    return make_success({"alive": True})


async def _check_postgres(url: str) -> tuple[bool, str | None]:
    try:
        # 軽量チェック: TCP 接続性のみ
        from urllib.parse import urlparse

        parsed = urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        fut = asyncio.open_connection(host, port)
        reader, writer = await asyncio.wait_for(fut, timeout=2.0)
        writer.close()
        try:
            await writer.wait_closed()
        except Exception:  # noqa: BLE001
            pass
        return True, None
    except Exception as e:  # noqa: BLE001
        return False, str(e)


async def _check_redis(url: str) -> tuple[bool, str | None]:
    try:
        import redis.asyncio as redis_async

        client = redis_async.from_url(url, socket_connect_timeout=2.0)
        try:
            pong = await client.ping()
            return bool(pong), None
        finally:
            await client.aclose()
    except Exception as e:  # noqa: BLE001
        return False, str(e)


async def _check_elasticsearch(url: str) -> tuple[bool, str | None]:
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{url.rstrip('/')}/_cluster/health")
            return resp.status_code < 500, None if resp.status_code < 500 else f"status={resp.status_code}"
    except Exception as e:  # noqa: BLE001
        return False, str(e)


@router.get(
    "/ready",
    summary="Readiness プローブ",
    description="Postgres / Redis / Elasticsearch への到達性を確認します。認証不要。",
    responses={
        200: {"description": "全依存先到達可能"},
        503: COMMON_ERROR_RESPONSES[503],
    },
)
async def ready() -> Any:
    """依存サービスへ到達できる場合のみ 200."""
    settings = get_settings()
    pg_ok, pg_err = await _check_postgres(settings.POSTGRES_URL)
    rd_ok, rd_err = await _check_redis(settings.REDIS_URL)
    es_ok, es_err = await _check_elasticsearch(settings.ELASTICSEARCH_URL)

    checks = {
        "postgres": {"ok": pg_ok, "error": pg_err},
        "redis": {"ok": rd_ok, "error": rd_err},
        "elasticsearch": {"ok": es_ok, "error": es_err},
    }
    all_ok = pg_ok and rd_ok and es_ok
    if all_ok:
        return make_success({"ready": True, "checks": checks})

    log.warning("readiness.fail", checks=checks)
    from fastapi.responses import JSONResponse

    body = make_error(
        code="NOT_READY",
        message="依存サービスへの到達に失敗しました。",
    )
    body["error"]["details"] = [
        {"field": name, "issue": info["error"] or "unreachable"}
        for name, info in checks.items()
        if not info["ok"]
    ]
    body["data"] = {"ready": False, "checks": checks}
    return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=body)
