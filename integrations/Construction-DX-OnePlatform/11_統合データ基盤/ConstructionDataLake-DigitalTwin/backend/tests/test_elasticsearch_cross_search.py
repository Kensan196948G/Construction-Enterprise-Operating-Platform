"""Cross-department ES search tests (mock client, 3 cases)."""
from __future__ import annotations

from data_api.services.elasticsearch_indexer import (
    cross_dept_search,
    index_name_for,
    index_rows,
)


class _MockEs:
    def __init__(self, response: dict | None = None) -> None:
        self.last_search: dict | None = None
        self.bulk_calls = 0
        self._search_response = response or {
            "took": 5,
            "hits": {
                "total": {"value": 2, "relation": "eq"},
                "hits": [
                    {
                        "_index": "cdx_construction",
                        "_score": 1.4,
                        "_source": {"title": "鉄筋検査"},
                        "highlight": {"title": ["<em>鉄筋</em>検査"]},
                    },
                    {
                        "_index": "cdx_safety",
                        "_score": 0.9,
                        "_source": {"title": "鉄筋落下リスク"},
                    },
                ],
            },
            "aggregations": {
                "by_department": {
                    "buckets": [
                        {"key": "cdx_construction", "doc_count": 1},
                        {"key": "cdx_safety", "doc_count": 1},
                    ]
                }
            },
        }

    def search(self, index: str, body: dict, **kwargs):  # noqa: ARG002
        self.last_search = {"index": index, "body": body}
        return self._search_response

    def bulk(self, operations, index=None, **kwargs):  # noqa: ARG002
        self.bulk_calls += 1
        return {"took": 3, "errors": False, "items": [{"index": {"status": 201}} for _ in range(len(operations) // 2)]}


def test_index_name_strips_numeric_prefix() -> None:
    assert index_name_for("04_construction") == "cdx_construction"
    assert index_name_for("safety") == "cdx_safety"
    assert index_name_for("10_itsm") == "cdx_itsm"


def test_cross_dept_search_returns_hits_and_facets() -> None:
    es = _MockEs()
    result = cross_dept_search(es, "鉄筋", from_=0, size=10)
    # called with cdx_* wildcard (no dept filter)
    assert es.last_search and es.last_search["index"] == "cdx_*"
    # body has from/size/highlight/aggs
    body = es.last_search["body"]
    assert body["from"] == 0
    assert body["size"] == 10
    assert "highlight" in body
    assert "aggs" in body
    # response is normalised
    assert result["total"]["value"] == 2
    assert len(result["hits"]) == 2
    assert result["hits"][0]["index"] == "cdx_construction"
    assert result["facets"] == {"cdx_construction": 1, "cdx_safety": 1}


def test_cross_dept_search_filters_indices_when_dept_given() -> None:
    es = _MockEs()
    cross_dept_search(es, "落下", departments=["04_construction", "06_safety"])
    assert es.last_search is not None
    assert es.last_search["index"] == "cdx_construction,cdx_safety"


def test_index_rows_chunks_large_batches() -> None:
    es = _MockEs()
    rows = [{"id": i, "title": f"row-{i}"} for i in range(1200)]
    summary = index_rows(es, "cdx_construction", rows, chunk_size=500)
    # 1200 rows / 500 -> 3 batches
    assert summary["batches"] == 3
    assert summary["indexed"] == 1200
    assert es.bulk_calls == 3
