"""Cross-platform full-text search (Elasticsearch + kuromoji).

Two entry points are exposed:

* ``POST /api/v1/search``        — original schema-driven endpoint.
* ``GET  /api/v1/data/search``   — cross-department search (new) used by the
  unified search UI.  Returns hits with highlights + per-department facets.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, Query

from data_api.config import get_settings
from data_api.deps import get_current_user
from data_api.schemas import SearchRequest
from data_api.services.elasticsearch_indexer import cross_dept_search

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["search"])


def _get_es_client() -> Any | None:
    """Best-effort ES client construction. Returns None if unavailable."""
    settings = get_settings()
    try:
        from elasticsearch import Elasticsearch  # type: ignore

        return Elasticsearch(settings.elasticsearch_url, request_timeout=5)
    except Exception as exc:  # noqa: BLE001
        logger.debug("ES client unavailable: %s", exc)
        return None


@router.post("/search")
def search(payload: SearchRequest, user=Depends(get_current_user)) -> dict:
    settings = get_settings()
    indices = payload.indices or [f"{settings.elasticsearch_index_prefix}-*"]
    try:
        from elasticsearch import Elasticsearch  # type: ignore

        es = Elasticsearch(settings.elasticsearch_url, request_timeout=5)
        body = {
            "size": payload.size,
            "query": {
                "multi_match": {
                    "query": payload.query,
                    "fields": ["*"],
                    "analyzer": "ja_default",
                }
            },
            "highlight": {"fields": {"*": {}}},
        }
        resp = es.search(index=",".join(indices), body=body)
        hits = [
            {
                "index": h.get("_index"),
                "score": h.get("_score"),
                "source": h.get("_source"),
                "highlights": h.get("highlight"),
            }
            for h in resp.get("hits", {}).get("hits", [])
        ]
        return {"total": resp.get("hits", {}).get("total", {}), "hits": hits, "query": payload.query}
    except Exception as exc:  # noqa: BLE001
        logger.debug("ES fallback: %s", exc)
        return {
            "total": {"value": 0, "relation": "eq"},
            "hits": [],
            "query": payload.query,
            "note": "Elasticsearch unavailable - returning empty result",
        }


@router.get("/data/search")
def data_search(
    q: str = Query(..., min_length=1, description="検索キーワード"),
    dept: list[str] | None = Query(default=None, description="部門フィルタ"),
    from_: int = Query(default=0, ge=0, alias="from"),
    size: int = Query(default=20, ge=1, le=200),
    user=Depends(get_current_user),
) -> dict:
    """Cross-department search across every ``cdx_*`` index."""
    es = _get_es_client()
    if es is None:
        return {
            "query": q,
            "total": {"value": 0, "relation": "eq"},
            "hits": [],
            "facets": {},
            "note": "Elasticsearch unavailable - returning empty result",
        }
    try:
        return cross_dept_search(es, q, departments=dept, from_=from_, size=size)
    except Exception as exc:  # noqa: BLE001
        logger.debug("cross_dept_search fallback: %s", exc)
        return {
            "query": q,
            "total": {"value": 0, "relation": "eq"},
            "hits": [],
            "facets": {},
            "note": f"Elasticsearch error: {exc}",
        }
