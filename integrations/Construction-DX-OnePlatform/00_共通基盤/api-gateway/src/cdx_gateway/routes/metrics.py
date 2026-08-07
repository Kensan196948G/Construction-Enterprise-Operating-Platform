"""Prometheus メトリクスエンドポイント."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

router = APIRouter(tags=["metrics"])


@router.get(
    "/metrics",
    summary="Prometheus メトリクス",
    description="Prometheus 形式のメトリクスを返します。認証不要。",
    response_class=Response,
)
async def metrics() -> Response:
    """Prometheus テキスト形式メトリクス."""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)
