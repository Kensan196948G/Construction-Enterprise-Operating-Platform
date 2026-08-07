"""電子帳簿保存法アーカイブ.

機能:
  - アーカイブ作成 (file upload + SHA-256 + タイムスタンプ)
  - 改ざん検証
  - 訂正履歴登録
  - 検索 (日付/金額/取引先)
"""
from __future__ import annotations

import base64
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from ..config import settings
from ..services.electronic_archive_service import (
    archive,
    build_export_zip,
    check_retention,
    record_revision,
    restore_revision,
    search_archives,
    verify_integrity,
)
from ._auth import get_current_user
from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="archive_id")
_blob_store: dict[str, bytes] = {}  # archive_id -> raw bytes (memory only)


class ArchiveIn(BaseModel):
    target_type: str
    target_id: str | None = None
    file_name: str
    file_path: str | None = None
    file_b64: str  # base64-encoded content
    search_date: str | None = None
    search_amount: int | None = None
    search_counterparty: str | None = None


@router.post("", status_code=201)
def create_archive(payload: ArchiveIn, _=Depends(get_current_user)) -> dict[str, Any]:
    try:
        data = base64.b64decode(payload.file_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid base64: {e}")
    archive_id = str(uuid.uuid4())
    from datetime import datetime

    rec = archive(
        archive_id=archive_id,
        target_type=payload.target_type,
        file_name=payload.file_name,
        file_path=payload.file_path or f"/archives/{archive_id}/{payload.file_name}",
        data=data,
        search_date=(
            datetime.fromisoformat(payload.search_date) if payload.search_date else None
        ),
        search_amount=payload.search_amount,
        search_counterparty=payload.search_counterparty,
        timestamp_authority_url=settings.timestamp_authority_url,
        timestamp_token=settings.timestamp_authority_token,
    )
    _blob_store[archive_id] = data
    return _store.create(rec.to_dict())


@router.get("")
def list_archives(
    counterparty: str | None = None,
    amount_min: int | None = None,
    amount_max: int | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    _=Depends(get_current_user),
) -> list[dict[str, Any]]:
    """検索条件: 取引先 / 金額レンジ / 日付レンジ (電帳法必須要件)."""
    items = _store.list()

    def _match(i: dict[str, Any]) -> bool:
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


@router.get("/{archive_id}/verify")
def verify_archive(archive_id: str, _=Depends(get_current_user)) -> dict[str, Any]:
    """改ざん検知: 保存中の bytes と SHA-256 を再計算して照合."""
    item = _store.get(archive_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    blob = _blob_store.get(archive_id)
    if blob is None:
        raise HTTPException(status_code=410, detail="blob not available")
    ok = verify_integrity(blob, item["sha256"])
    return {"archive_id": archive_id, "integrity_ok": ok, "sha256": item["sha256"]}


class RevisionIn(BaseModel):
    reason: str
    file_b64: str


@router.post("/{archive_id}/revisions", status_code=201)
def add_revision(
    archive_id: str,
    payload: RevisionIn,
    _=Depends(get_current_user),
) -> dict[str, Any]:
    """訂正履歴を残してアーカイブを更新."""
    item = _store.get(archive_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    try:
        new_data = base64.b64decode(payload.file_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid base64: {e}")

    # 復元
    from datetime import datetime

    from ..services.electronic_archive_service import ArchiveRecord

    rec = ArchiveRecord(
        archive_id=item["archive_id"],
        target_type=item["target_type"],
        file_name=item["file_name"],
        file_path=item["file_path"],
        sha256=item["sha256"],
        file_size=item["file_size"],
        timestamp_token=item.get("timestamp_token"),
        timestamp_issued_at=(
            datetime.fromisoformat(item["timestamp_issued_at"])
            if item.get("timestamp_issued_at")
            else None
        ),
        revision_history=list(item.get("revision_history") or []),
    )
    updated = record_revision(rec, reason=payload.reason, new_data=new_data)
    _blob_store[archive_id] = new_data
    new_dict = updated.to_dict()
    item.update(new_dict)
    return item


# --- Loop #6 拡張: 検索 / 抽出 / 復元 / 保存期限チェック ---


@router.get("/search")
def search_endpoint(
    q: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    amount_min: int | None = None,
    amount_max: int | None = None,
    counterparty: str | None = None,
    _=Depends(get_current_user),
) -> list[dict[str, Any]]:
    """全文 + 構造化検索 (電帳法 法令検索要件対応)."""
    return search_archives(
        _store.list(),
        q=q,
        date_from=date_from,
        date_to=date_to,
        amount_min=amount_min,
        amount_max=amount_max,
        counterparty=counterparty,
    )


@router.get("/export")
def export_endpoint(
    period: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    _=Depends(get_current_user),
) -> Response:
    """期間指定で ZIP エクスポート.

    period="YYYY-MM" or 個別 date_from / date_to で範囲指定可。
    """
    df, dt = date_from, date_to
    if period:
        # "2026-05" -> 2026-05-01 .. 2026-05-31
        try:
            y, m = period.split("-")
            df = f"{y}-{int(m):02d}-01"
            # 末日は雑に 31 にする (検索側は文字列比較なので可)
            dt = f"{y}-{int(m):02d}-31"
        except ValueError:
            raise HTTPException(status_code=400, detail="period must be YYYY-MM")

    records = search_archives(_store.list(), date_from=df, date_to=dt)
    zip_bytes = build_export_zip(records, lambda aid: _blob_store.get(aid))
    fname = f"archives_{period or 'export'}.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


@router.get("/{archive_id}/revisions/{index}")
def get_revision(archive_id: str, index: int, _=Depends(get_current_user)) -> dict[str, Any]:
    """過去版 (訂正履歴 N 件目) のメタデータを取得."""
    item = _store.get(archive_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    try:
        return restore_revision(item, index)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{archive_id}/retention")
def retention_status(archive_id: str, _=Depends(get_current_user)) -> dict[str, Any]:
    item = _store.get(archive_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return check_retention(item)
