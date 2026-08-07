"""Audit Event Store (Sprint 3 = in-memory + JSONL + Hash Chain).

設計:
- 受信時に audit_event_id / hash_ref / previous_hash_ref をサーバ側で確定する。
- hash_ref は SHA-256 (audit_event_id + event_type + occurred_at.isoformat() + tenant_id + actor_id)。
- previous_hash_ref は同 tenant の直前イベントの hash_ref。チェーン先頭は "genesis"。
- JSONL は append only。削除/編集 API は提供しない。
"""

from __future__ import annotations

import hashlib
import json
from datetime import date, datetime, timezone
from pathlib import Path
from threading import Lock

from synapse_shared.audit_base import AuditEvent
from synapse_shared.ids import ID_PREFIXES, parse_id


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def _today_utc() -> date:
    return _utcnow().date()


def _scope_from_tenant_id(tenant_id: str) -> str:
    return parse_id(tenant_id).scope


def compute_hash_ref(
    audit_event_id: str,
    event_type: str,
    occurred_at: str,
    tenant_id: str,
    actor_id: str,
) -> str:
    """SHA-256 hash of core event identity fields.

    フィールドは JSON 配列としてシリアライズしてから SHA-256 を取る。
    これにより異なるフィールド組で同一 raw 文字列を構成する曖昧衝突
    （例: ("ab","c",...) と ("a","bc",...) が同じ連結文字列になる）を排除する。
    """
    raw = json.dumps(
        [audit_event_id, event_type, occurred_at, tenant_id, actor_id],
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return "sha256:" + hashlib.sha256(raw.encode("utf-8")).hexdigest()


class AuditEventStore:
    """Sprint 3 audit-service Store with Hash Chain support.

    JSONL ファイルへの追記と in-memory dict を同期して保持する。
    テナントごとに直前イベントの hash_ref を追跡してハッシュチェーンを維持する。
    """

    def __init__(self, *, jsonl_path: Path) -> None:
        self._records: dict[str, AuditEvent] = {}
        self._sequences: dict[tuple[str, str], int] = {}
        # tenant_id -> last hash_ref (for chain)
        self._last_hash_by_tenant: dict[str, str] = {}
        self._lock = Lock()
        self._path = jsonl_path
        self._path.parent.mkdir(parents=True, exist_ok=True)

    def issue_id(self, *, tenant_id: str, on_date: date | None = None) -> str:
        scope = _scope_from_tenant_id(tenant_id)
        d = on_date or _today_utc()
        date_str = d.strftime("%Y%m%d")
        with self._lock:
            key = (scope, date_str)
            self._sequences[key] = self._sequences.get(key, 0) + 1
            seq = self._sequences[key]
        return f"{ID_PREFIXES['audit_event']}_{scope}_{date_str}_{seq:04d}"

    def get_previous_hash_ref(self, tenant_id: str) -> str:
        """テナントのチェーン直前の hash_ref を返す。チェーン先頭は 'genesis'。"""
        with self._lock:
            return self._last_hash_by_tenant.get(tenant_id, "genesis")

    def append(self, event: AuditEvent) -> None:
        with self._lock:
            if event.audit_event_id in self._records:
                raise ValueError(f"audit_event_id already exists: {event.audit_event_id}")
            self._records[event.audit_event_id] = event
            self._last_hash_by_tenant[event.tenant_id] = event.hash_ref
            with self._path.open("a", encoding="utf-8") as fh:
                fh.write(event.model_dump_json() + "\n")

    def get(self, audit_event_id: str) -> AuditEvent | None:
        return self._records.get(audit_event_id)

    def list(
        self,
        *,
        tenant_id: str | None = None,
        correlation_id: str | None = None,
        event_type: str | None = None,
    ) -> list[AuditEvent]:
        results: list[AuditEvent] = []
        for ev in self._records.values():
            if tenant_id and ev.tenant_id != tenant_id:
                continue
            if correlation_id and ev.correlation_id != correlation_id:
                continue
            if event_type and ev.event_type.value != event_type:
                continue
            results.append(ev)
        return sorted(results, key=lambda e: e.occurred_at)

    def verify_chain(self, *, tenant_id: str) -> dict:
        """指定テナントの全 AuditEvent のハッシュチェーン整合性を検証する。

        Returns:
            {
                "tenant_id": str,
                "total_events": int,
                "valid": bool,
                "broken_at": str | None,  # audit_event_id where chain breaks
            }

        Note:
            append 順（= 採番順 = ハッシュチェーン構築順）で検証する。
            ``occurred_at`` ソートは外部時計依存で、遅延到着イベントで
            正しいチェーンが破損扱いになる可能性があるため使わない。
            並行 append とのレース防止に lock 下でスナップショットを取る。
        """
        with self._lock:
            # Python dict は挿入順を保持するため、append 順 = チェーン構築順となる。
            events = [e for e in self._records.values() if e.tenant_id == tenant_id]
        if not events:
            return {
                "tenant_id": tenant_id,
                "total_events": 0,
                "valid": True,
                "broken_at": None,
            }

        expected_previous = "genesis"
        for ev in events:
            # Verify previous_hash_ref links correctly
            if ev.previous_hash_ref != expected_previous:
                return {
                    "tenant_id": tenant_id,
                    "total_events": len(events),
                    "valid": False,
                    "broken_at": ev.audit_event_id,
                }
            # Verify hash_ref is correct
            expected_hash = compute_hash_ref(
                audit_event_id=ev.audit_event_id,
                event_type=ev.event_type.value,
                occurred_at=ev.occurred_at.isoformat(),
                tenant_id=ev.tenant_id,
                actor_id=ev.actor_id,
            )
            if ev.hash_ref != expected_hash:
                return {
                    "tenant_id": tenant_id,
                    "total_events": len(events),
                    "valid": False,
                    "broken_at": ev.audit_event_id,
                }
            expected_previous = ev.hash_ref

        return {
            "tenant_id": tenant_id,
            "total_events": len(events),
            "valid": True,
            "broken_at": None,
        }

    def __len__(self) -> int:
        return len(self._records)


_DEFAULT_JSONL = Path(__file__).resolve().parents[2] / "var" / "audit_events.jsonl"
_default_store = AuditEventStore(jsonl_path=_DEFAULT_JSONL)


def get_store() -> AuditEventStore:
    """FastAPI dependency 注入用シングルトン."""
    return _default_store
