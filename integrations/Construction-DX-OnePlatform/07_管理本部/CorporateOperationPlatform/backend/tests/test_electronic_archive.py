"""電帳法サービス: SHA-256 + 改ざん検知 + 訂正履歴."""
from __future__ import annotations

from corp_api.services.electronic_archive_service import (
    archive,
    compute_sha256,
    record_revision,
    verify_integrity,
)


def test_sha256_hash_and_integrity_pass_for_unchanged_data() -> None:
    data = b"sample invoice pdf content"
    digest = compute_sha256(data)
    assert len(digest.sha256) == 64
    assert verify_integrity(data, digest.sha256) is True

    rec = archive(
        archive_id="a1",
        target_type="invoice",
        file_name="inv.pdf",
        file_path="/x/inv.pdf",
        data=data,
        search_amount=110_000,
        search_counterparty="A社",
    )
    assert rec.sha256 == digest.sha256
    assert rec.timestamp_token  # タイムスタンプ付与済
    assert rec.retention_until is not None  # 7 年保存期限あり


def test_tampered_data_fails_integrity_and_revision_keeps_history() -> None:
    original = b"original-bytes"
    rec = archive(
        archive_id="a2",
        target_type="contract",
        file_name="c.pdf",
        file_path="/x/c.pdf",
        data=original,
    )
    # 改ざん検知: 別のバイト列で照合すると失敗
    assert verify_integrity(b"tampered-bytes", rec.sha256) is False

    # 正規の訂正履歴: revision_history が伸び, sha256 更新, 旧 sha256 が履歴に残る
    prev_sha = rec.sha256
    record_revision(rec, reason="typo correction", new_data=b"updated-bytes")
    assert len(rec.revision_history) == 1
    assert rec.revision_history[0]["prev_sha256"] == prev_sha
    assert rec.sha256 != prev_sha
