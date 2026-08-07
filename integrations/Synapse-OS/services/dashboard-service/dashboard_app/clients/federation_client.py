"""Federation read client (Sprint 4 / Governance Observability).

federation-service の ``GET /federation-events?tenant_id=...`` を読み出す。
Protocol + Stub + Http 三点セット。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class FederationReadClient(Protocol):
    def list(
        self, *, tenant_id: str | None = None, as_target: bool = False
    ) -> list[dict[str, Any]]: ...


@dataclass
class HttpFederationReadClient:
    base_url: str
    timeout_seconds: float = 5.0

    def list(
        self, *, tenant_id: str | None = None, as_target: bool = False
    ) -> list[dict[str, Any]]:
        params: dict[str, str | bool] = {}
        if tenant_id:
            params["tenant_id"] = tenant_id
        if as_target:
            params["as_target"] = as_target
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.get("/federation-events", params=params)
            r.raise_for_status()
            return list(r.json())


@dataclass
class StubFederationReadClient:
    """Test 用 stub. ``register`` で事前登録した Federation Event を tenant_id で返す."""

    events: list[dict[str, Any]] = field(default_factory=list)
    calls: list[dict[str, Any]] = field(default_factory=list)

    def register(self, event: dict[str, Any]) -> None:
        self.events.append(event)

    def list(
        self, *, tenant_id: str | None = None, as_target: bool = False
    ) -> list[dict[str, Any]]:
        self.calls.append({"tenant_id": tenant_id, "as_target": as_target})
        if tenant_id is None:
            return list(self.events)
        if as_target:
            return [e for e in self.events if e.get("target_tenant") == tenant_id]
        return [e for e in self.events if e.get("source_tenant") == tenant_id]
