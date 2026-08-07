"""In-memory Knowledge Item Repository (BL-011 / Sprint 2).

federation-service / ai-gateway-service と同型の最小 in-memory CRUD。
Sprint 3 以降で PostgreSQL + GraphDB (Neo4j) に差し替える際に interface を
変えずに済むように CRUD と ID 採番、tenant filter のみに責務限定する。

Knowledge ID prefix は ``kno`` (synapse_shared.ids.ID_PREFIXES["knowledge_item"]).
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from threading import Lock

from synapse_shared.ids import ID_PREFIXES, parse_id

from ..schemas.knowledge import KnowledgeItem


def _today_utc() -> date:
    return datetime.now(tz=timezone.utc).date()


def _scope_from_tenant_id(tenant_id: str) -> str:
    return parse_id(tenant_id).scope


class KnowledgeRepository:
    def __init__(self) -> None:
        self._records: dict[str, KnowledgeItem] = {}
        self._sequences: dict[tuple[str, str], int] = {}
        self._lock = Lock()

    def knowledge_id(self, *, tenant_id: str, on_date: date | None = None) -> str:
        scope = _scope_from_tenant_id(tenant_id)
        d = on_date or _today_utc()
        date_str = d.strftime("%Y%m%d")
        with self._lock:
            key = (scope, date_str)
            self._sequences[key] = self._sequences.get(key, 0) + 1
            seq = self._sequences[key]
        return f"{ID_PREFIXES['knowledge_item']}_{scope}_{date_str}_{seq:04d}"

    def save(self, item: KnowledgeItem) -> None:
        with self._lock:
            self._records[item.object_id] = item

    def get(self, knowledge_id: str) -> KnowledgeItem | None:
        return self._records.get(knowledge_id)

    def list(
        self,
        *,
        tenant_id: str | None = None,
        retention_class: str | None = None,
        status: str | None = None,
    ) -> list[KnowledgeItem]:
        items = list(self._records.values())
        if tenant_id is not None:
            items = [k for k in items if k.tenant_id == tenant_id]
        if retention_class is not None:
            items = [k for k in items if k.retention_class.value == retention_class]
        if status is not None:
            items = [k for k in items if k.status.value == status]
        items.sort(key=lambda k: k.created_at)
        return items

    def __len__(self) -> int:
        return len(self._records)


_default_repo = KnowledgeRepository()


def get_repository() -> KnowledgeRepository:
    return _default_repo
