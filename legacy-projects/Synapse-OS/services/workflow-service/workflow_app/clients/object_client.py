"""Object Service Client (BL-003).

workflow-service は Issue を直接所有せず、object-service の REST API
``GET /issues/{id}`` 経由でのみ参照する。これは Service 責務分割
(SERVICE_RESPONSIBILITY_MODEL.md) を import 境界レベルで守るため:

    workflow_app -- (Protocol API) --> Object Service
    workflow_app は object_app を import しない。

Approval が承認しようとしている Issue の存在性 / tenant_id 整合性を検証するために
最小限 ``get_issue`` のみを公開する。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class IssueNotFound(Exception):
    """object-service が 404 を返したときに送出する。"""


class ObjectClient(Protocol):
    """Object Service への問い合わせ抽象."""

    def get_issue(self, issue_id: str) -> dict[str, Any]:
        """Issue を取得する。存在しない場合は IssueNotFound."""
        ...


@dataclass
class HttpObjectClient:
    """本番経路: HTTP で object-service を呼ぶ."""

    base_url: str
    timeout_seconds: float = 5.0

    def get_issue(self, issue_id: str) -> dict[str, Any]:
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.get(f"/issues/{issue_id}")
            if r.status_code == 404:
                raise IssueNotFound(issue_id)
            r.raise_for_status()
            return r.json()


@dataclass
class StubObjectClient:
    """Test 用 stub: あらかじめ登録した Issue dict を id で返す."""

    issues: dict[str, dict[str, Any]] = field(default_factory=dict)
    calls: list[str] = field(default_factory=list)

    def register(self, issue: dict[str, Any]) -> None:
        self.issues[issue["object_id"]] = issue

    def get_issue(self, issue_id: str) -> dict[str, Any]:
        self.calls.append(issue_id)
        if issue_id not in self.issues:
            raise IssueNotFound(issue_id)
        return self.issues[issue_id]
