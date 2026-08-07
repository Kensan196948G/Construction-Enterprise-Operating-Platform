"""電帳法アーカイブ拡張機能 (検索/抽出/復元/期限) のテスト."""
from __future__ import annotations

import zipfile
from datetime import UTC, datetime, timedelta
from io import BytesIO

from corp_api.services.electronic_archive_service import (
    archive,
    build_export_zip,
    check_retention,
    record_revision,
    restore_revision,
    search_archives,
)


def _sample_records() -> list[dict]:
    items = []
    rec1 = archive(
        archive_id="a1",
        target_type="invoice",
        file_name="invoice_A.pdf",
        file_path="/x/a1",
        data=b"AAA",
        search_date=datetime(2026, 5, 10, tzinfo=UTC),
        search_amount=110000,
        search_counterparty="株式会社A建設",
    )
    rec2 = archive(
        archive_id="a2",
        target_type="contract",
        file_name="contract_B.pdf",
        file_path="/x/a2",
        data=b"BBBB",
        search_date=datetime(2026, 6, 1, tzinfo=UTC),
        search_amount=550000,
        search_counterparty="B工務店",
    )
    items.append(rec1.to_dict())
    items.append(rec2.to_dict())
    return items


def test_search_by_keyword_and_amount() -> None:
    items = _sample_records()
    # キーワード "invoice_A" -> 1件
    hits = search_archives(items, q="invoice_A")
    assert len(hits) == 1 and hits[0]["archive_id"] == "a1"
    # 金額レンジ
    hits = search_archives(items, amount_min=200000)
    assert len(hits) == 1 and hits[0]["archive_id"] == "a2"
    # 日付レンジ
    hits = search_archives(items, date_from="2026-05-01", date_to="2026-05-31")
    assert len(hits) == 1 and hits[0]["archive_id"] == "a1"


def test_export_zip_contains_files_and_manifest() -> None:
    items = _sample_records()
    blobs = {"a1": b"AAA", "a2": b"BBBB"}
    zip_bytes = build_export_zip(items, lambda aid: blobs.get(aid))
    with zipfile.ZipFile(BytesIO(zip_bytes)) as zf:
        names = zf.namelist()
        assert "manifest.json" in names
        assert any("invoice_A.pdf" in n for n in names)
        assert any("contract_B.pdf" in n for n in names)


def test_restore_revision_returns_past_metadata() -> None:
    rec_obj = archive(
        archive_id="r1",
        target_type="invoice",
        file_name="r.pdf",
        file_path="/x/r1",
        data=b"original",
    )
    rec_obj = record_revision(rec_obj, reason="typo fix", new_data=b"fixed-v1")
    rec_obj = record_revision(rec_obj, reason="amount correction", new_data=b"fixed-v2")
    d = rec_obj.to_dict()
    past = restore_revision(d, 0)
    assert past["reason"] == "typo fix"
    latest = restore_revision(d, -1)
    assert latest["reason"] == "amount correction"


def test_check_retention_marks_expired() -> None:
    expired_dt = (datetime.now(UTC) - timedelta(days=1)).isoformat()
    rec = {"retention_until": expired_dt}
    result = check_retention(rec)
    assert result["expired"] is True
    future_dt = (datetime.now(UTC) + timedelta(days=365 * 7)).isoformat()
    rec2 = {"retention_until": future_dt}
    result2 = check_retention(rec2)
    assert result2["expired"] is False
    assert (result2["days_remaining"] or 0) > 365 * 6
