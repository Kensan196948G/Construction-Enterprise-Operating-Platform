"""dashboard-service test fixtures (BL-010)."""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from dashboard_app.api import dashboard as dashboard_api
from dashboard_app.clients.approval_client import StubApprovalReadClient
from dashboard_app.clients.audit_client import StubAuditReadClient
from dashboard_app.clients.issue_client import StubIssueReadClient
from dashboard_app.main import app


@pytest.fixture
def issue_stub() -> StubIssueReadClient:
    return StubIssueReadClient()


@pytest.fixture
def approval_stub() -> StubApprovalReadClient:
    return StubApprovalReadClient()


@pytest.fixture
def audit_stub() -> StubAuditReadClient:
    return StubAuditReadClient()


@pytest.fixture
def client(
    issue_stub: StubIssueReadClient,
    approval_stub: StubApprovalReadClient,
    audit_stub: StubAuditReadClient,
) -> Iterator[TestClient]:
    app.dependency_overrides[dashboard_api.get_issue_client] = lambda: issue_stub
    app.dependency_overrides[dashboard_api.get_approval_client] = lambda: approval_stub
    app.dependency_overrides[dashboard_api.get_audit_client] = lambda: audit_stub
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
