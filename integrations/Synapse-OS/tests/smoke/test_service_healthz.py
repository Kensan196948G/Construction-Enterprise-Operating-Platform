"""Smoke check: every service exposes /healthz and the OpenAPI schema."""
from __future__ import annotations

import importlib
from typing import Any

import pytest
from starlette.testclient import TestClient

SERVICES: list[tuple[str, str, str]] = [
    ("tenant-identity-service", "tenant_identity_app.main", "tenant-identity-service"),
    ("policy-service", "policy_app.main", "policy-service"),
    ("audit-service", "audit_app.main", "audit-service"),
    ("object-service", "object_app.main", "object-service"),
    ("workflow-service", "workflow_app.main", "workflow-service"),
    ("ai-gateway-service", "ai_gateway_app.main", "ai-gateway-service"),
    ("federation-service", "federation_app.main", "federation-service"),
    ("knowledge-service", "knowledge_app.main", "knowledge-service"),
    ("dashboard-service", "dashboard_app.main", "dashboard-service"),
]


@pytest.mark.parametrize("svc_name,module_path,expected_service_id", SERVICES)
def test_healthz_returns_ok(svc_name: str, module_path: str, expected_service_id: str) -> None:
    module = importlib.import_module(module_path)
    app: Any = module.app
    with TestClient(app) as client:
        res = client.get("/healthz")
        assert res.status_code == 200, f"{svc_name} healthz failed: {res.status_code} {res.text}"
        body = res.json()
        assert isinstance(body, dict), f"{svc_name} healthz body is not a dict"
        assert body.get("status") == "ok", f"{svc_name} healthz status != ok: {body}"
        assert body.get("service") == expected_service_id, (
            f"{svc_name} service id mismatch: {body}"
        )


@pytest.mark.parametrize("svc_name,module_path,_", SERVICES)
def test_openapi_schema_available(svc_name: str, module_path: str, _: str) -> None:
    module = importlib.import_module(module_path)
    app: Any = module.app
    with TestClient(app) as client:
        res = client.get("/openapi.json")
        assert res.status_code == 200, f"{svc_name} openapi.json failed: {res.status_code}"
        schema = res.json()
        assert schema.get("openapi", "").startswith("3."), (
            f"{svc_name} openapi version invalid: {schema.get('openapi')}"
        )
        assert "paths" in schema and isinstance(schema["paths"], dict), (
            f"{svc_name} openapi paths missing"
        )
        assert len(schema["paths"]) > 0, f"{svc_name} has zero paths"


@pytest.mark.parametrize("svc_name,module_path,_", SERVICES)
def test_unknown_route_returns_404(svc_name: str, module_path: str, _: str) -> None:
    module = importlib.import_module(module_path)
    app: Any = module.app
    with TestClient(app) as client:
        res = client.get("/__definitely_not_a_route__")
        assert res.status_code == 404, (
            f"{svc_name} unknown route returned {res.status_code}, expected 404"
        )
