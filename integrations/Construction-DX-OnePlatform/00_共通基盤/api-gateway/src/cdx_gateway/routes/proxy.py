"""リバースプロキシ: 各部門APIへ転送."""
from __future__ import annotations

from typing import Any

import httpx
import structlog
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response
from prometheus_client import Counter, Histogram

from cdx_gateway.config import get_settings
from cdx_gateway.openapi import COMMON_ERROR_RESPONSES, make_error

router = APIRouter(prefix="/api/v1", tags=["proxy"])
log = structlog.get_logger("cdx.gateway.proxy")

# --- Prometheus メトリクス ---
PROXY_REQUESTS = Counter(
    "cdx_gateway_proxy_requests_total",
    "Total proxied requests",
    ["department", "method", "status"],
)
PROXY_LATENCY = Histogram(
    "cdx_gateway_proxy_latency_seconds",
    "Proxy latency in seconds",
    ["department", "method"],
)

# ホップバイホップ ヘッダー (転送除外)
_HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}


def _build_forward_headers(request: Request, department: str) -> dict[str, str]:
    headers: dict[str, str] = {}
    for k, v in request.headers.items():
        kl = k.lower()
        if kl in _HOP_BY_HOP:
            continue
        # X-Request-ID is owned by the gateway (RequestLoggingMiddleware sets
        # request.state.request_id). Skip the client-supplied copy to avoid
        # duplicate header values being joined as "id, id" downstream.
        if kl == "x-request-id":
            continue
        headers[k] = v
    request_id = getattr(request.state, "request_id", None)
    if request_id:
        headers["X-Request-ID"] = request_id
    headers["X-Department"] = department
    # 認証ユーザー情報を後段に伝播
    user = getattr(request.state, "user", None)
    if user is not None:
        for attr, hdr in (("oid", "X-User-Oid"), ("sub", "X-User-Sub"), ("email", "X-User-Email")):
            val = getattr(user, attr, None)
            if val:
                headers[hdr] = str(val)
    return headers


async def _do_proxy(
    request: Request,
    department: str,
    upstream_base: str | None,
    path: str,
) -> Response:
    if not upstream_base:
        return JSONResponse(
            status_code=502,
            content=make_error(
                code="UPSTREAM_NOT_CONFIGURED",
                message=f"部門 {department} のバックエンドURLが未設定です。",
            ),
        )

    settings = get_settings()
    target = f"{upstream_base.rstrip('/')}/{path.lstrip('/')}"
    query = request.url.query
    if query:
        target = f"{target}?{query}"

    headers = _build_forward_headers(request, department)
    body = await request.body()
    method = request.method

    log.info("proxy.forward", department=department, target=target, method=method)

    client: httpx.AsyncClient = request.app.state.http_client
    try:
        with PROXY_LATENCY.labels(department=department, method=method).time():
            resp = await client.request(
                method=method,
                url=target,
                headers=headers,
                content=body if body else None,
                timeout=settings.PROXY_TIMEOUT_SECONDS,
            )
    except httpx.TimeoutException as e:
        PROXY_REQUESTS.labels(department=department, method=method, status="504").inc()
        log.warning("proxy.timeout", department=department, target=target, error=str(e))
        return JSONResponse(
            status_code=504,
            content=make_error(
                code="UPSTREAM_TIMEOUT",
                message="バックエンドAPIへの応答がタイムアウトしました。",
            ),
        )
    except httpx.RequestError as e:
        PROXY_REQUESTS.labels(department=department, method=method, status="502").inc()
        log.error("proxy.unreachable", department=department, target=target, error=str(e))
        return JSONResponse(
            status_code=502,
            content=make_error(
                code="UPSTREAM_UNREACHABLE",
                message="バックエンドAPIに到達できません。",
            ),
        )

    PROXY_REQUESTS.labels(
        department=department, method=method, status=str(resp.status_code)
    ).inc()

    # レスポンスヘッダーをコピー (hop-by-hop は除外)
    response_headers = {
        k: v for k, v in resp.headers.items() if k.lower() not in _HOP_BY_HOP
    }
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=response_headers,
        media_type=resp.headers.get("content-type"),
    )


def _make_proxy_route(department: str, settings_attr: str, summary: str) -> None:
    @router.api_route(
        f"/{department}/{{path:path}}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
        summary=summary,
        description=f"{summary}。Authorization / X-Request-ID / X-Department を後段に転送します。",
        responses={**COMMON_ERROR_RESPONSES},
        name=f"proxy_{department}",
    )
    async def _handler(path: str, request: Request) -> Response:
        settings = get_settings()
        upstream = getattr(settings, settings_attr, None)
        return await _do_proxy(request, department, upstream, path)

    _handler.__name__ = f"proxy_{department}"


# 部門ルート登録
_make_proxy_route("construction", "SITE_API_URL", "建設現場APIへプロキシ")
_make_proxy_route("safety", "SAFETY_API_URL", "安全衛生APIへプロキシ")
_make_proxy_route("itsm", "ITSM_API_URL", "ITSM APIへプロキシ")
_make_proxy_route("procurement", "PROCUREMENT_API_URL", "調達APIへプロキシ")
_make_proxy_route("sales", "SALES_API_URL", "営業APIへプロキシ")


__all__: list[str] = ["router", "PROXY_REQUESTS", "PROXY_LATENCY"]


# `Any` インポートは将来の型注釈拡張用に保持
_ANY_SENTINEL: Any = None
