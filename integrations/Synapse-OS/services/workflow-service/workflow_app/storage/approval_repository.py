"""In-memory Approval Repository (Sprint 1).

object-service の IssueRepository と同型 pattern。
Sprint 2 以降で PostgreSQL に差し替える際に interface を変えずに済むよう、
approval_id 採番と CRUD のみに責務を限定する。
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from threading import Lock

from synapse_shared.ids import ID_PREFIXES, parse_id

from ..schemas.approval import Approval


def _today_utc() -> date:
    return datetime.now(tz=timezone.utc).date()


def _scope_from_tenant_id(tenant_id: str) -> str:
    return parse_id(tenant_id).scope


class ApprovalRepository:
    def __init__(self) -> None:
        self._records: dict[str, Approval] = {}
        self._sequences: dict[tuple[str, str], int] = {}
        self._lock = Lock()

    def approval_id(self, *, tenant_id: str, on_date: date | None = None) -> str:
        scope = _scope_from_tenant_id(tenant_id)
        d = on_date or _today_utc()
        date_str = d.strftime("%Y%m%d")
        with self._lock:
            key = (scope, date_str)
            self._sequences[key] = self._sequences.get(key, 0) + 1
            seq = self._sequences[key]
        return f"{ID_PREFIXES['approval']}_{scope}_{date_str}_{seq:04d}"

    def save(self, approval: Approval) -> None:
        with self._lock:
            self._records[approval.object_id] = approval

    def get(self, approval_id: str) -> Approval | None:
        return self._records.get(approval_id)

    def list(
        self,
        *,
        tenant_id: str | None = None,
        issue_id: str | None = None,
    ) -> list[Approval]:
        items = list(self._records.values())
        if tenant_id is not None:
            items = [a for a in items if a.tenant_id == tenant_id]
        if issue_id is not None:
            items = [a for a in items if a.issue_id == issue_id]
        items.sort(key=lambda a: a.created_at)
        return items

    def __len__(self) -> int:
        return len(self._records)


_default_repo = ApprovalRepository()


def get_repository() -> ApprovalRepository:
    return _default_repo
