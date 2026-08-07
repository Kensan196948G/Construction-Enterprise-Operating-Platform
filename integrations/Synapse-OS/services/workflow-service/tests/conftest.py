"""workflow-service test fixtures (BL-003).

object-service と同じく test ごとに:
    - Approval Repository を新品に差し替え
    - Policy / Audit / Object client を Stub に差し替え (実 service を起動しない)
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from workflow_app.api import approvals as approvals_api
from workflow_app.clients.audit_client import StubAuditClient
from workflow_app.clients.object_client import StubObjectClient
from workflow_app.clients.policy_client import StubPolicyClient
from workflow_app.main import app
from workflow_app.storage.approval_repository import (
    ApprovalRepository,
    get_repository,
)


@pytest.fixture
def policy_stub() -> StubPolicyClient:
    return StubPolicyClient()


@pytest.fixture
def audit_stub() -> StubAuditClient:
    return StubAuditClient()


@pytest.fixture
def object_stub() -> StubObjectClient:
    return StubObjectClient()


@pytest.fixture
def repo() -> ApprovalRepository:
    return ApprovalRepository()


@pytest.fixture
def client(
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    object_stub: StubObjectClient,
    repo: ApprovalRepository,
) -> Iterator[TestClient]:
    app.dependency_overrides[approvals_api.get_policy_client] = lambda: policy_stub
    app.dependency_overrides[approvals_api.get_audit_client] = lambda: audit_stub
    app.dependency_overrides[approvals_api.get_object_client] = lambda: object_stub
    app.dependency_overrides[get_repository] = lambda: repo
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
