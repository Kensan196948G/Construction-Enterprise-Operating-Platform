"""電子帳簿保存法サービス.

機能:
  - SHA-256 ハッシュ生成
  - タイムスタンプ付与 (認定事業者経由 / stub)
  - 改ざん検知 (verify)
  - 訂正履歴管理
  - 7 年間保存期限管理
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any

RETENTION_YEARS = 7


@dataclass
class ArchiveDigest:
    sha256: str
    file_size: int


@dataclass
class ArchiveRecord:
    """電帳法アーカイブの論理モデル (DB 非依存)."""

    archive_id: str
    target_type: str
    file_name: str
    file_path: str
    sha256: str
    file_size: int
    timestamp_token: str | None = None
    timestamp_issued_at: datetime | None = None
    search_date: datetime | None = None
    search_amount: int | None = None
    search_counterparty: str | None = None
    revision_history: list[dict[str, Any]] = field(default_factory=list)
    retention_until: datetime | None = None
    is_locked: bool = True

    def to_dict(self) -> dict[str, Any]:
        return {
            "archive_id": self.archive_id,
            "target_type": self.target_type,
            "file_name": self.file_name,
            "file_path": self.file_path,
            "sha256": self.sha256,
            "file_size": self.file_size,
            "timestamp_token": self.timestamp_token,
            "timestamp_issued_at": (
                self.timestamp_issued_at.isoformat() if self.timestamp_issued_at else None
            ),
            "search_date": self.search_date.isoformat() if self.search_date else None,
            "search_amount": self.search_amount,
            "search_counterparty": self.search_counterparty,
            "revision_history": self.revision_history,
            "retention_until": self.retention_until.isoformat() if self.retention_until else None,
            "is_locked": self.is_locked,
        }


def compute_sha256(data: bytes) -> ArchiveDigest:
    """SHA-256 ハッシュを計算."""
    h = hashlib.sha256()
    h.update(data)
    return ArchiveDigest(sha256=h.hexdigest(), file_size=len(data))


def verify_integrity(data: bytes, expected_sha256: str) -> bool:
    """改ざん検知."""
    return compute_sha256(data).sha256 == expected_sha256


def issue_timestamp(sha256: str, authority_url: str = "", token: str = "") -> dict[str, Any]:
    """タイムスタンプ発行 (stub).

    本番では認定タイムスタンプ事業者 (例: SECOM トラストシステムズ) の RFC3161 経由。
    骨格段階では sha256 と時刻を組み合わせた疑似トークンを返す。
    """
    issued_at = datetime.now(UTC)
    if authority_url:
        # 本番経路スタブ: 外部呼び出しの代わりに固定フォーマットの token を返す
        token_value = f"tsa:{authority_url}:{sha256}:{int(issued_at.timestamp())}"
    else:
        token_value = f"stub-ts:{sha256[:16]}:{int(issued_at.timestamp())}"
    return {
        "timestamp_token": token_value,
        "timestamp_issued_at": issued_at,
        "authority": authority_url or "stub",
    }


def archive(
    *,
    archive_id: str,
    target_type: str,
    file_name: str,
    file_path: str,
    data: bytes,
    search_date: datetime | None = None,
    search_amount: int | None = None,
    search_counterparty: str | None = None,
    timestamp_authority_url: str = "",
    timestamp_token: str = "",
) -> ArchiveRecord:
    """アーカイブ作成: ハッシュ + タイムスタンプ + 保存期限設定."""
    digest = compute_sha256(data)
    ts = issue_timestamp(digest.sha256, timestamp_authority_url, timestamp_token)
    retention = datetime.now(UTC) + timedelta(days=RETENTION_YEARS * 365)
    return ArchiveRecord(
        archive_id=archive_id,
        target_type=target_type,
        file_name=file_name,
        file_path=file_path,
        sha256=digest.sha256,
        file_size=digest.file_size,
        timestamp_token=ts["timestamp_token"],
        timestamp_issued_at=ts["timestamp_issued_at"],
        search_date=search_date,
        search_amount=search_amount,
        search_counterparty=search_counterparty,
        retention_until=retention,
        is_locked=True,
    )


def record_revision(record: ArchiveRecord, *, reason: str, new_data: bytes) -> ArchiveRecord:
    """訂正履歴を残してアーカイブを更新する。元の sha256 は履歴に保持。"""
    prev_sha = record.sha256
    new_digest = compute_sha256(new_data)
    record.revision_history.append(
        {
            "revised_at": datetime.now(UTC).isoformat(),
            "reason": reason,
            "prev_sha256": prev_sha,
            "new_sha256": new_digest.sha256,
        }
    )
    record.sha256 = new_digest.sha256
    record.file_size = new_digest.file_size
    return record


# --- Loop #6 拡張: 検索 / 抽出 / 復元 / 期限チェック ---

def search_archives(
    items: list[dict[str, Any]],
    *,
    q: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    amount_min: int | None = None,
    amount_max: int | None = None,
    counterparty: str | None = None,
) -> list[dict[str, Any]]:
    """電帳法アーカイブの全文 + 構造化検索.

    `q` はファイル名・取引先・対象種別に対する部分一致 (大小無視)。
    """
    def _match(i: dict[str, Any]) -> bool:
        if q:
            ql = q.lower()
            haystack = " ".join(
                str(i.get(k) or "")
                for k in ("file_name", "search_counterparty", "target_type", "archive_id")
            ).lower()
            if ql not in haystack:
                return False
        if counterparty and counterparty not in (i.get("search_counterparty") or ""):
            return False
        if amount_min is not None and (i.get("search_amount") or 0) < amount_min:
            return False
        if amount_max is not None and (i.get("search_amount") or 0) > amount_max:
            return False
        sd = i.get("search_date") or ""
        if date_from and sd and sd[:10] < date_from:
            return False
        if date_to and sd and sd[:10] > date_to:
            return False
        return True

    return [i for i in items if _match(i)]


def build_export_zip(
    records: list[dict[str, Any]],
    blob_provider,
) -> bytes:
    """期間内アーカイブを ZIP 化.

    blob_provider: Callable[[archive_id], bytes | None].
    マニフェスト JSON も同梱。
    """
    import io
    import json
    import zipfile

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        manifest = []
        for rec in records:
            archive_id = rec.get("archive_id") or ""
            blob = blob_provider(archive_id)
            if blob is not None:
                arcname = f"{archive_id}/{rec.get('file_name', 'file.bin')}"
                zf.writestr(arcname, blob)
            manifest.append(
                {
                    "archive_id": archive_id,
                    "file_name": rec.get("file_name"),
                    "sha256": rec.get("sha256"),
                    "search_date": rec.get("search_date"),
                    "search_amount": rec.get("search_amount"),
                    "search_counterparty": rec.get("search_counterparty"),
                    "retention_until": rec.get("retention_until"),
                }
            )
        zf.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
    return buf.getvalue()


def restore_revision(record: dict[str, Any], revision_index: int) -> dict[str, Any]:
    """訂正履歴 N 件目の過去版メタデータを返す.

    revision_index は 0 origin. -1 で最古を意味する。
    bytes そのものは保持しないため SHA-256 + reason + revised_at を返す。
    """
    history = record.get("revision_history") or []
    if not history:
        raise ValueError("no revision history")
    if revision_index < 0:
        revision_index = max(0, len(history) + revision_index)
    if revision_index >= len(history):
        raise ValueError(f"revision_index {revision_index} out of range")
    rev = history[revision_index]
    return {
        "archive_id": record.get("archive_id"),
        "revision_index": revision_index,
        "sha256_at_that_time": rev.get("prev_sha256"),
        "reason": rev.get("reason"),
        "revised_at": rev.get("revised_at"),
    }


def check_retention(record: dict[str, Any], *, now: datetime | None = None) -> dict[str, Any]:
    """7 年保存ポリシーの状態を返す."""
    now = now or datetime.now(UTC)
    retention_str = record.get("retention_until")
    if not retention_str:
        return {"valid_until": None, "days_remaining": None, "expired": False}
    try:
        ru = datetime.fromisoformat(retention_str)
    except ValueError:
        return {"valid_until": retention_str, "days_remaining": None, "expired": False}
    if ru.tzinfo is None:
        ru = ru.replace(tzinfo=UTC)
    delta = ru - now
    return {
        "valid_until": ru.isoformat(),
        "days_remaining": delta.days,
        "expired": delta.total_seconds() < 0,
    }
