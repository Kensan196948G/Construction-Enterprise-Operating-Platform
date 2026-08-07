"""Sprint 1 末 Integration Test Fixtures (BL-013).

このディレクトリの test は object-service / workflow-service / policy-service /
audit-service の **4 つの FastAPI app を同一プロセス内で立ち上げ**、
それぞれの ``TestClient`` を Adapter 経由で接続する。

なぜ Stub ではなく TestClient かというと、Sprint 1 末 Acceptance の主旨は
**Service 間契約 (URL / JSON shape / status code) が現実に一致しているか**
の検証だから。Stub では schema drift (例: Approval 評価の ``approval_state``
を "decided" にしてしまう実装ミス) が見逃される。

Adapter pattern:
    object_app / workflow_app は既に PolicyClient / AuditClient / ObjectClient を
    Protocol で抽象化している。本 conftest は ``httpx.Client`` の代わりに
    対象 service の ``TestClient`` を被せた Adapter を ``app.dependency_overrides``
    で注入する。Protocol は structural なので class 名が違っても許容される。

Test isolation:
    AuditEventStore は JSONL を実書き込みするため、test 関数ごとに tmp_path
    の新規 store を生成して ``app.dependency_overrides[audit_get_store]`` で差し替える。
    Issue/Approval/Policy の各 in-memory Repository も同様に新規 instance を注入する。
"""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from audit_app.api import audit_events as audit_api
from audit_app.main import app as audit_fastapi_app
from audit_app.storage.event_store import AuditEventStore
from object_app.api import issues as issues_api
from object_app.clients.audit_client import AuditClient as ObjectAuditClient
from object_app.clients.policy_client import PolicyClient as ObjectPolicyClient
from object_app.main import app as object_fastapi_app
from object_app.storage.issue_repository import IssueRepository
from policy_app.api import decisions as decisions_api
from policy_app.main import app as policy_fastapi_app
from policy_app.storage.decision_store import PolicyDecisionStore
from workflow_app.api import approvals as approvals_api
from workflow_app.clients.audit_client import AuditClient as WorkflowAuditClient
from workflow_app.clients.object_client import (
    IssueNotFound,
    ObjectClient as WorkflowObjectClient,
)
from workflow_app.clients.policy_client import PolicyClient as WorkflowPolicyClient
from workflow_app.main import app as workflow_fastapi_app
from workflow_app.storage.approval_repository import ApprovalRepository


# ----------------------------------------------------------------------------
# Adapter: 別 service の TestClient を Protocol に被せる
# ----------------------------------------------------------------------------


class _PolicyAdapter:
    """policy-service の TestClient を PolicyClient Protocol に適合させる."""

    def __init__(self, client: TestClient) -> None:
        self._client = client

    def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
        r = self._client.post("/policy-decisions", json=payload)
        # Policy Service は deny / approval_required でも 200 を返す契約 (auditability)
        r.raise_for_status()
        return r.json()


class _AuditAdapter:
    """audit-service の TestClient を AuditClient Protocol に適合させる."""

    def __init__(self, client: TestClient) -> None:
        self._client = client

    def append(self, ingress: dict[str, Any]) -> dict[str, Any]:
        r = self._client.post("/audit-events", json=ingress)
        r.raise_for_status()
        return r.json()


class _ObjectAdapter:
    """object-service の TestClient を workflow_app.ObjectClient Protocol に適合させる."""

    def __init__(self, client: TestClient) -> None:
        self._client = client

    def get_issue(self, issue_id: str) -> dict[str, Any]:
        r = self._client.get(f"/issues/{issue_id}")
        if r.status_code == 404:
            raise IssueNotFound(issue_id)
        r.raise_for_status()
        return r.json()


# ----------------------------------------------------------------------------
# Per-test fresh dependencies
# ----------------------------------------------------------------------------


@pytest.fixture
def audit_store(tmp_path: Path) -> AuditEventStore:
    """test ごとに JSONL ファイルを分離した新規 AuditEventStore."""

    return AuditEventStore(jsonl_path=tmp_path / "audit_events.jsonl")


@pytest.fixture
def policy_store() -> PolicyDecisionStore:
    return PolicyDecisionStore()


@pytest.fixture
def issue_repo() -> IssueRepository:
    return IssueRepository()


@pytest.fixture
def approval_repo() -> ApprovalRepository:
    return ApprovalRepository()


# ----------------------------------------------------------------------------
# 4 つの FastAPI app に dependency_overrides を一括適用する
# ----------------------------------------------------------------------------


@pytest.fixture
def integration_clients(
    audit_store: AuditEventStore,
    policy_store: PolicyDecisionStore,
    issue_repo: IssueRepository,
    approval_repo: ApprovalRepository,
) -> Iterator[dict[str, TestClient]]:
    """object / workflow / policy / audit の 4 service を同一プロセスで起動する.

    返り値:
        {
            "object":   TestClient,  # POST /issues
            "workflow": TestClient,  # POST /approvals
            "audit":    TestClient,  # GET  /audit-events
            "policy":   TestClient,  # GET  /policy-decisions/{id}
        }

    順序:
        1. audit / policy app に store override を入れて先に TestClient を起こす
           -> object / workflow からこれらの TestClient に接続する Adapter を注入する
    """

    # Storage override (audit / policy / object / workflow すべて in-memory に分離)
    audit_fastapi_app.dependency_overrides[audit_api.get_store] = lambda: audit_store
    policy_fastapi_app.dependency_overrides[decisions_api.get_store] = lambda: policy_store
    object_fastapi_app.dependency_overrides[issues_api.get_repository] = lambda: issue_repo
    workflow_fastapi_app.dependency_overrides[approvals_api.get_repository] = (
        lambda: approval_repo
    )

    with (
        TestClient(audit_fastapi_app) as audit_client,
        TestClient(policy_fastapi_app) as policy_client,
    ):
        # Adapter: 上の 2 つの TestClient を object/workflow に注入
        policy_adapter = _PolicyAdapter(policy_client)
        audit_adapter = _AuditAdapter(audit_client)

        # object-service: Policy / Audit を Adapter 経由で接続
        object_fastapi_app.dependency_overrides[issues_api.get_policy_client] = (
            lambda: _typed_policy_object(policy_adapter)
        )
        object_fastapi_app.dependency_overrides[issues_api.get_audit_client] = (
            lambda: _typed_audit_object(audit_adapter)
        )

        with TestClient(object_fastapi_app) as object_client:
            object_adapter = _ObjectAdapter(object_client)

            # workflow-service: Object / Policy / Audit すべて Adapter 経由
            workflow_fastapi_app.dependency_overrides[approvals_api.get_policy_client] = (
                lambda: _typed_policy_workflow(policy_adapter)
            )
            workflow_fastapi_app.dependency_overrides[approvals_api.get_audit_client] = (
                lambda: _typed_audit_workflow(audit_adapter)
            )
            workflow_fastapi_app.dependency_overrides[approvals_api.get_object_client] = (
                lambda: _typed_object_workflow(object_adapter)
            )

            with TestClient(workflow_fastapi_app) as workflow_client:
                yield {
                    "object": object_client,
                    "workflow": workflow_client,
                    "audit": audit_client,
                    "policy": policy_client,
                }

    # Cleanup: 4 app の override を全消去 (lru_cache されている本物 client には触らない)
    for app in (
        audit_fastapi_app,
        policy_fastapi_app,
        object_fastapi_app,
        workflow_fastapi_app,
    ):
        app.dependency_overrides.clear()


# ----------------------------------------------------------------------------
# Adapter を Protocol 型として返す薄いヘルパ (mypy / IDE 用; runtime は no-op)
# ----------------------------------------------------------------------------


def _typed_policy_object(adapter: _PolicyAdapter) -> ObjectPolicyClient:
    return adapter  # structural: evaluate(dict) -> dict


def _typed_audit_object(adapter: _AuditAdapter) -> ObjectAuditClient:
    return adapter  # structural: append(dict) -> dict


def _typed_policy_workflow(adapter: _PolicyAdapter) -> WorkflowPolicyClient:
    return adapter


def _typed_audit_workflow(adapter: _AuditAdapter) -> WorkflowAuditClient:
    return adapter


def _typed_object_workflow(adapter: _ObjectAdapter) -> WorkflowObjectClient:
    return adapter
