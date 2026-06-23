"""In-memory Federation Event Repository (BL-008 / Sprint 2).

AIActionRepository / DocumentRepository と同型。Sprint 2 では in-memory + tenant scope 連番で十分。
Sprint 3 以降で PostgreSQL に差し替える際に interface を変えずに済むよう
CRUD と ID 採番のみに責務限定する。

ID scope は **source_tenant** から決定する (Federation Event は source Tenant に所属する)。
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from threading import Lock

from synapse_shared.ids import ID_PREFIXES, parse_id

from ..schemas.federation_event import FederationEvent


def _today_utc() -> date:
    return datetime.now(tz=timezone.utc).date()


def _scope_from_tenant_id(tenant_id: str) -> str:
    return parse_id(tenant_id).scope


class FederationEventRepository:
    def __init__(self) -> None:
        self._records: dict[str, FederationEvent] = {}
        self._sequences: dict[tuple[str, str], int] = {}
        self._lock = Lock()

    def federation_event_id(self, *, source_tenant: str, on_date: date | None = None) -> str:
        """source_tenant scope で fed_* を採番する.

        target 側 Audit にも同じ correlation_id で残るが、ID 自体は source 所属。
        """

        scope = _scope_from_tenant_id(source_tenant)
        d = on_date or _today_utc()
        date_str = d.strftime("%Y%m%d")
        with self._lock:
            key = (scope, date_str)
            self._sequences[key] = self._sequences.get(key, 0) + 1
            seq = self._sequences[key]
        return f"{ID_PREFIXES['federation_event']}_{scope}_{date_str}_{seq:04d}"

    def save(self, event: FederationEvent) -> None:
        with self._lock:
            self._records[event.object_id] = event

    def get(self, event_id: str) -> FederationEvent | None:
        return self._records.get(event_id)

    def list(
        self,
        *,
        tenant_id: str | None = None,
        as_target: bool = False,
    ) -> list[FederationEvent]:
        """tenant_id filter.

        as_target=False (default): tenant_id == source_tenant の event 列
        as_target=True            : tenant_id == target_tenant の event 列 (受信側 view)
        tenant_id=None            : 全件 (admin / global view)
        """

        items = list(self._records.values())
        if tenant_id is not None:
            if as_target:
                items = [e for e in items if e.target_tenant == tenant_id]
            else:
                items = [e for e in items if e.source_tenant == tenant_id]
        items.sort(key=lambda e: e.created_at)
        return items

    def __len__(self) -> int:
        return len(self._records)


_default_repo = FederationEventRepository()


def get_repository() -> FederationEventRepository:
    return _default_repo
