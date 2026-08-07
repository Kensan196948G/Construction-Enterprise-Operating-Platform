"""Audit read client (BL-010).

audit-service の ``GET /audit-events?tenant_id=...`` を読み出す。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class AuditReadClient(Protocol):
    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]: ...


@dataclass
class HttpAuditReadClient:
    base_url: str
    timeout_seconds: float = 5.0

    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if tenant_id:
            params["tenant_id"] = tenant_id
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.get("/audit-events", params=params)
            r.raise_for_status()
            return list(r.json())


@dataclass
class StubAuditReadClient:
    events: list[dict[str, Any]] = field(default_factory=list)
    calls: list[dict[str, Any]] = field(default_factory=list)

    def register(self, event: dict[str, Any]) -> None:
        self.events.append(event)

    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]:
        self.calls.append({"tenant_id": tenant_id})
        if tenant_id is None:
            return list(self.events)
        return [e for e in self.events if e.get("tenant_id") == tenant_id]
