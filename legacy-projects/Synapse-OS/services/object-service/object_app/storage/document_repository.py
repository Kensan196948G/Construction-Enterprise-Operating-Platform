"""In-memory Document Repository (BL-007 / Sprint 2).

IssueRepository と同型 pattern。
Sprint 2 では in-memory + tenant scope 連番で十分だが、Sprint 3 以降で
PostgreSQL に差し替える際に interface を変えずに済むよう CRUD と ID 採番のみに責務を限定する。
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from threading import Lock

from synapse_shared.ids import ID_PREFIXES, parse_id

from ..schemas.document import Document


def _today_utc() -> date:
    return datetime.now(tz=timezone.utc).date()


def _scope_from_tenant_id(tenant_id: str) -> str:
    return parse_id(tenant_id).scope


class DocumentRepository:
    def __init__(self) -> None:
        self._records: dict[str, Document] = {}
        self._sequences: dict[tuple[str, str], int] = {}
        self._lock = Lock()

    def document_id(self, *, tenant_id: str, on_date: date | None = None) -> str:
        scope = _scope_from_tenant_id(tenant_id)
        d = on_date or _today_utc()
        date_str = d.strftime("%Y%m%d")
        with self._lock:
            key = (scope, date_str)
            self._sequences[key] = self._sequences.get(key, 0) + 1
            seq = self._sequences[key]
        return f"{ID_PREFIXES['document']}_{scope}_{date_str}_{seq:04d}"

    def save(self, document: Document) -> None:
        with self._lock:
            self._records[document.object_id] = document

    def get(self, document_id: str) -> Document | None:
        return self._records.get(document_id)

    def list(self, *, tenant_id: str | None = None) -> list[Document]:
        items = list(self._records.values())
        if tenant_id is not None:
            items = [d for d in items if d.tenant_id == tenant_id]
        items.sort(key=lambda d: d.created_at)
        return items

    def __len__(self) -> int:
        return len(self._records)


_default_repo = DocumentRepository()


def get_repository() -> DocumentRepository:
    return _default_repo
