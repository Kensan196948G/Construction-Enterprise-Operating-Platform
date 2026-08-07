"""Elasticsearch indexer for Data Lake → cross-search.

Pushes curated rows into per-department indices with kuromoji + ngram
mappings, and exposes a *cross-department* search helper.

Index name convention:
    cdx_{department}  (e.g. ``cdx_construction``, ``cdx_safety``)

The actual ES client is optional: every entry point accepts a mock client so
tests can exercise the orchestration without a live cluster.
"""
from __future__ import annotations

import logging
import time
from collections.abc import Iterable, Sequence
from typing import Any, Protocol

logger = logging.getLogger(__name__)

INDEX_PREFIX = "cdx_"


class _BulkClient(Protocol):
    def bulk(self, operations: list[dict], index: str | None = None, **kwargs: Any) -> dict: ...
    def search(self, index: str, body: dict, **kwargs: Any) -> dict: ...  # pragma: no cover
    def indices(self) -> Any: ...  # pragma: no cover


def index_name_for(department: str) -> str:
    """Map a logical department key (e.g. "04_construction") to an ES index name."""
    key = department.strip().lower()
    # strip a numeric prefix like "04_" so the user-facing alias is clean
    if "_" in key:
        head, _, tail = key.partition("_")
        if head.isdigit():
            key = tail
    return f"{INDEX_PREFIX}{key}"


def kuromoji_text_mapping() -> dict[str, Any]:
    """Default index settings/mappings tuned for Japanese full-text search.

    The ``ja_default`` analyzer combines kuromoji with an ngram filter so that
    queries against partial words / item codes still match.
    """
    return {
        "settings": {
            "analysis": {
                "filter": {
                    "ja_ngram": {
                        "type": "ngram",
                        "min_gram": 2,
                        "max_gram": 3,
                    }
                },
                "analyzer": {
                    "ja_default": {
                        "type": "custom",
                        "tokenizer": "kuromoji_tokenizer",
                        "filter": [
                            "kuromoji_baseform",
                            "kuromoji_part_of_speech",
                            "ja_stop",
                            "kuromoji_number",
                            "kuromoji_stemmer",
                            "lowercase",
                            "ja_ngram",
                        ],
                    }
                },
            }
        },
        "mappings": {
            "dynamic_templates": [
                {
                    "strings": {
                        "match_mapping_type": "string",
                        "mapping": {
                            "type": "text",
                            "analyzer": "ja_default",
                            "fields": {"keyword": {"type": "keyword", "ignore_above": 256}},
                        },
                    }
                }
            ]
        },
    }


def bulk_payload(index: str, rows: Iterable[dict[str, Any]], id_field: str = "id") -> list[dict]:
    """Build a bulk-API operations list for an iterable of rows."""
    ops: list[dict] = []
    for row in rows:
        action: dict[str, Any] = {"index": {"_index": index}}
        if id_field in row and row[id_field] is not None:
            action["index"]["_id"] = str(row[id_field])
        ops.append(action)
        ops.append(row)
    return ops


def index_rows(
    client: _BulkClient,
    index: str,
    rows: Sequence[dict[str, Any]],
    id_field: str = "id",
    *,
    chunk_size: int = 500,
) -> dict[str, Any]:
    """Send rows to Elasticsearch via the bulk API.

    Rows are flushed in ``chunk_size``-row batches (≈500 rows / batch is roughly
    the throughput target for the cluster sizing in production).  Returns a
    summary dict ``{indexed, errors, took_ms, batches}``.
    """
    if not rows:
        return {"indexed": 0, "errors": [], "took_ms": 0, "batches": 0}

    indexed_total = 0
    errors_total: list[dict] = []
    took_total_ms = 0
    batches = 0
    started = time.perf_counter()
    for offset in range(0, len(rows), chunk_size):
        chunk = rows[offset : offset + chunk_size]
        ops = bulk_payload(index, chunk, id_field=id_field)
        response = client.bulk(operations=ops)
        batches += 1
        items = response.get("items", []) if isinstance(response, dict) else []
        chunk_errors = [it for it in items if any(v.get("error") for v in it.values())]
        indexed_total += max(0, len(items) - len(chunk_errors))
        errors_total.extend(chunk_errors)
        if isinstance(response, dict) and isinstance(response.get("took"), (int, float)):
            took_total_ms += int(response["took"])
    elapsed_ms = (time.perf_counter() - started) * 1000.0
    return {
        "indexed": indexed_total,
        "errors": errors_total,
        "took_ms": took_total_ms or round(elapsed_ms, 2),
        "batches": batches,
    }


def cross_dept_search(
    client: _BulkClient,
    query: str,
    *,
    departments: Sequence[str] | None = None,
    from_: int = 0,
    size: int = 20,
    highlight: bool = True,
) -> dict[str, Any]:
    """Search across every ``cdx_*`` index (or a filtered subset).

    Returns hits, total, facet counts per department, and the raw query body.
    """
    if departments:
        index_expr = ",".join(index_name_for(d) for d in departments)
    else:
        index_expr = f"{INDEX_PREFIX}*"

    body: dict[str, Any] = {
        "from": max(0, from_),
        "size": max(1, min(size, 200)),
        "query": {
            "multi_match": {
                "query": query,
                "fields": ["*"],
                "analyzer": "ja_default",
                "operator": "and",
            }
        },
        "aggs": {
            "by_department": {"terms": {"field": "_index", "size": 32}}
        },
    }
    if highlight:
        body["highlight"] = {
            "pre_tags": ["<em>"],
            "post_tags": ["</em>"],
            "fields": {"*": {}},
        }

    response = client.search(index=index_expr, body=body)
    hits_envelope = response.get("hits", {}) if isinstance(response, dict) else {}
    raw_hits = hits_envelope.get("hits", [])
    hits = [
        {
            "index": h.get("_index"),
            "score": h.get("_score"),
            "source": h.get("_source", {}),
            "highlights": h.get("highlight"),
        }
        for h in raw_hits
    ]
    aggs = response.get("aggregations", {}) if isinstance(response, dict) else {}
    facet_buckets = aggs.get("by_department", {}).get("buckets", [])
    facets = {b.get("key"): b.get("doc_count", 0) for b in facet_buckets}
    return {
        "query": query,
        "total": hits_envelope.get("total", {"value": len(hits), "relation": "eq"}),
        "hits": hits,
        "facets": facets,
        "took_ms": response.get("took"),
    }
