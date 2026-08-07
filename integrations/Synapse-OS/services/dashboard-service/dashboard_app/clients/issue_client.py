"""Issue read client (BL-010).

dashboard-service は object_app を import せず、object-service の REST
``GET /issues?tenant_id=...`` 経由で Issue を読み出す。
Service 責務分離 (SERVICE_RESPONSIBILITY_MODEL) を import 境界で守るため。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class IssueReadClient(Protocol):
    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]: ...


@dataclass
class HttpIssueReadClient:
    base_url: str
    timeout_seconds: float = 5.0

    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if tenant_id:
            params["tenant_id"] = tenant_id
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.get("/issues", params=params)
            r.raise_for_status()
            return list(r.json())


@dataclass
class StubIssueReadClient:
    """Test 用 stub. ``register`` で事前登録した Issue を tenant_id で返す."""

    issues: list[dict[str, Any]] = field(default_factory=list)
    calls: list[dict[str, Any]] = field(default_factory=list)

    def register(self, issue: dict[str, Any]) -> None:
        self.issues.append(issue)

    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]:
        self.calls.append({"tenant_id": tenant_id})
        if tenant_id is None:
            return list(self.issues)
        return [i for i in self.issues if i.get("tenant_id") == tenant_id]
