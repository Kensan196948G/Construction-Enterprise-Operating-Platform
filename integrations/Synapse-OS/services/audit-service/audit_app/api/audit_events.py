"""Audit Event API (BL-005 / Sprint 3).

Endpoints:
    POST /audit-events                 : Audit Event 受信 (id/hash/previous_hash はサーバ採番)
    GET  /audit-events                 : フィルタ付き一覧 (tenant_id / correlation_id / event_type)
    GET  /audit-events/export          : G6 証跡エクスポート (CSV / JSON)
    GET  /audit-events/verify          : テナントのハッシュチェーン整合性検証
    GET  /audit-events/{id}            : 単発取得
"""

from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from synapse_shared.audit_base import AuditEvent

from ..schemas.ingest import AuditEventIngress
from ..storage.event_store import AuditEventStore, compute_hash_ref, get_store

router = APIRouter(prefix="/audit-events", tags=["audit-events"])

# G6 エクスポートフィールド定義 (ISO/J-SOX 証跡として必要な最小セット)
_EXPORT_FIELDS = [
    "audit_event_id",
    "event_type",
    "occurred_at",
    "tenant_id",
    "actor_id",
    "hash_ref",
    "previous_hash_ref",
    "correlation_id",
    "retention_policy_ref",
]


@router.post(
    "",
    response_model=AuditEvent,
    status_code=status.HTTP_201_CREATED,
    summary="Audit Event を受信し永続化する",
)
def ingest_audit_event(
    payload: AuditEventIngress,
    store: AuditEventStore = Depends(get_store),
) -> AuditEvent:
    audit_event_id = store.issue_id(tenant_id=payload.tenant_id)
    occurred_at = payload.occurred_at or datetime.now(tz=timezone.utc)

    # Determine hash chain: get previous hash ref for this tenant
    previous_hash_ref = store.get_previous_hash_ref(payload.tenant_id)

    # Compute hash_ref from core identity fields
    hash_ref = compute_hash_ref(
        audit_event_id=audit_event_id,
        event_type=payload.event_type.value,
        occurred_at=occurred_at.isoformat(),
        tenant_id=payload.tenant_id,
        actor_id=payload.actor_id,
    )

    base = payload.model_dump(mode="json")
    base["audit_event_id"] = audit_event_id
    base["occurred_at"] = occurred_at.isoformat()
    base["hash_ref"] = hash_ref
    base["previous_hash_ref"] = previous_hash_ref

    event = AuditEvent.model_validate(base)
    store.append(event)
    return event


@router.get(
    "/verify",
    summary="テナントのハッシュチェーン整合性を検証する",
)
def verify_chain(
    tenant_id: str = Query(..., description="検証対象のテナント ID"),
    store: AuditEventStore = Depends(get_store),
) -> dict:
    return store.verify_chain(tenant_id=tenant_id)


@router.get(
    "/export",
    summary="G6: Audit 証跡を CSV または JSON でエクスポートする (ISO/J-SOX 対応)",
)
def export_audit_events(
    format: Literal["csv", "json"] = Query(default="json"),
    tenant_id: str = Query(..., description="エクスポート対象テナント ID"),
    event_type: str | None = Query(default=None),
    store: AuditEventStore = Depends(get_store),
) -> StreamingResponse:
    events = store.list(tenant_id=tenant_id, event_type=event_type)

    def _row(ev: AuditEvent) -> dict:
        data = ev.model_dump(mode="json")
        return {field: str(data.get(field, "")) for field in _EXPORT_FIELDS}

    if format == "csv":
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=_EXPORT_FIELDS, lineterminator="\n")
        writer.writeheader()
        for ev in events:
            writer.writerow(_row(ev))
        filename = f"audit_events_{tenant_id}.csv"
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # JSON
    payload = json.dumps([_row(ev) for ev in events], ensure_ascii=False, indent=2)
    filename = f"audit_events_{tenant_id}.json"
    return StreamingResponse(
        iter([payload]),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("", response_model=list[AuditEvent], summary="Audit Event を検索する")
def list_audit_events(
    tenant_id: str | None = Query(default=None),
    correlation_id: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    store: AuditEventStore = Depends(get_store),
) -> list[AuditEvent]:
    return store.list(
        tenant_id=tenant_id, correlation_id=correlation_id, event_type=event_type
    )


@router.get(
    "/{audit_event_id}",
    response_model=AuditEvent,
    summary="Audit Event を ID で取得する",
)
def get_audit_event(
    audit_event_id: str,
    store: AuditEventStore = Depends(get_store),
) -> AuditEvent:
    event = store.get(audit_event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"audit_event_id not found: {audit_event_id}",
        )
    return event
