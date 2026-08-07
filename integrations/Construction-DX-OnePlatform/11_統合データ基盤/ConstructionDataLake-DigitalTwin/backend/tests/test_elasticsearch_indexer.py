"""Elasticsearch indexer: bulk payload + mock client."""
from __future__ import annotations

from data_api.services.elasticsearch_indexer import (
    bulk_payload,
    index_rows,
    kuromoji_text_mapping,
)


class _MockEs:
    def __init__(self) -> None:
        self.last_ops: list[dict] | None = None

    def bulk(self, operations: list[dict], index: str | None = None, **kwargs):  # noqa: ARG002
        self.last_ops = operations
        # Simulate ES response shape: one items entry per (action+doc) pair / 2 == doc count
        doc_count = len(operations) // 2
        return {"took": 7, "errors": False, "items": [{"index": {"status": 201}} for _ in range(doc_count)]}

    def indices(self):  # pragma: no cover - not used by index_rows
        return None


def test_kuromoji_mapping_includes_ja_default_analyzer() -> None:
    cfg = kuromoji_text_mapping()
    assert "ja_default" in cfg["settings"]["analysis"]["analyzer"]


def test_bulk_payload_structure() -> None:
    rows = [{"id": "a1", "title": "鉄筋検査"}, {"id": "a2", "title": "型枠施工"}]
    ops = bulk_payload("cdx-lake-construction", rows)
    # Each row produces 2 entries (action + doc) -> 4 total
    assert len(ops) == 4
    assert ops[0]["index"]["_index"] == "cdx-lake-construction"
    assert ops[0]["index"]["_id"] == "a1"
    assert ops[1]["title"] == "鉄筋検査"


def test_index_rows_uses_mock_bulk_client() -> None:
    es = _MockEs()
    rows = [{"id": "p1", "title": "横浜港デジタルツイン更新", "department": "11"}]
    result = index_rows(es, "cdx-lake-twin", rows)
    assert result["indexed"] == 1
    assert result["errors"] == []
    assert es.last_ops is not None and len(es.last_ops) == 2
