"""In-memory AI Action Repository (BL-006 / Sprint 2).

DocumentRepository / IssueRepository と同型。
Sprint 2 では in-memory + tenant scope 連番で十分。Sprint 3 以降で
PostgreSQL に差し替える際に interface を変えずに済むよう CRUD と ID 採番のみに責務限定。
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from threading import Lock

from synapse_shared.ids import ID_PREFIXES, parse_id

from ..schemas.ai_action import AIAction


def _today_utc() -> date:
    return datetime.now(tz=timezone.utc).date()


def _scope_from_tenant_id(tenant_id: str) -> str:
    return parse_id(tenant_id).scope


class AIActionRepository:
    def __init__(self) -> None:
        self._records: dict[str, AIAction] = {}
        self._sequences: dict[tuple[str, str], int] = {}
        self._lock = Lock()

    def ai_action_id(self, *, tenant_id: str, on_date: date | None = None) -> str:
        scope = _scope_from_tenant_id(tenant_id)
        d = on_date or _today_utc()
        date_str = d.strftime("%Y%m%d")
        with self._lock:
            key = (scope, date_str)
            self._sequences[key] = self._sequences.get(key, 0) + 1
            seq = self._sequences[key]
        return f"{ID_PREFIXES['ai_action']}_{scope}_{date_str}_{seq:04d}"

    def save(self, action: AIAction) -> None:
        with self._lock:
            self._records[action.object_id] = action

    def get(self, action_id: str) -> AIAction | None:
        return self._records.get(action_id)

    def list(self, *, tenant_id: str | None = None) -> list[AIAction]:
        items = list(self._records.values())
        if tenant_id is not None:
            items = [a for a in items if a.tenant_id == tenant_id]
        items.sort(key=lambda a: a.created_at)
        return items

    def __len__(self) -> int:
        return len(self._records)


_default_repo = AIActionRepository()


def get_repository() -> AIActionRepository:
    return _default_repo
