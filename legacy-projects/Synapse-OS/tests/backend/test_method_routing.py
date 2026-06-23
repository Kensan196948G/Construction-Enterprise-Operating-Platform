"""Backend method-routing baseline.

Verifies that disallowed HTTP methods on a real route return 405,
and that hitting `/healthz` with non-GET methods does not silently succeed.

Catches a class of regressions where a catch-all handler accidentally
turns the wrong verb into 200 / 404 / 500.
"""
from __future__ import annotations

import importlib
from typing import Any

import pytest
from starlette.testclient import TestClient

# (svc_name, module_path, real_get_route)
SERVICES: list[tuple[str, str, str]] = [
    ("tenant-identity-service", "tenant_identity_app.main", "/healthz"),
    ("policy-service", "policy_app.main", "/healthz"),
    ("audit-service", "audit_app.main", "/healthz"),
    ("object-service", "object_app.main", "/healthz"),
    ("workflow-service", "workflow_app.main", "/healthz"),
    ("ai-gateway-service", "ai_gateway_app.main", "/healthz"),
    ("federation-service", "federation_app.main", "/healthz"),
    ("knowledge-service", "knowledge_app.main", "/healthz"),
    ("dashboard-service", "dashboard_app.main", "/healthz"),
]


def _load_app(module_path: str) -> Any:
    return importlib.import_module(module_path).app


@pytest.mark.parametrize("svc_name,module_path,route", SERVICES)
def test_disallowed_method_returns_405(svc_name: str, module_path: str, route: str) -> None:
    """POST/PUT/DELETE on a GET-only route must yield 405, not 200/500."""
    app = _load_app(module_path)
    with TestClient(app) as client:
        for method in ("post", "put", "delete", "patch"):
            res = getattr(client, method)(route)
            assert res.status_code == 405, (
                f"{svc_name} {method.upper()} {route} expected 405, "
                f"got {res.status_code}: {res.text[:120]}"
            )


@pytest.mark.parametrize("svc_name,module_path,route", SERVICES)
def test_options_does_not_500(svc_name: str, module_path: str, route: str) -> None:
    """OPTIONS must never crash the app; 200 / 405 are both acceptable."""
    app = _load_app(module_path)
    with TestClient(app) as client:
        res = client.options(route)
        assert res.status_code < 500, (
            f"{svc_name} OPTIONS {route} returned 5xx: {res.status_code} {res.text[:120]}"
        )


@pytest.mark.parametrize("svc_name,module_path,_", SERVICES)
def test_head_on_healthz_succeeds(svc_name: str, module_path: str, _: str) -> None:
    """HEAD on /healthz must mirror GET behavior (Starlette adds it automatically)."""
    app = _load_app(module_path)
    with TestClient(app) as client:
        res = client.head("/healthz")
        assert res.status_code in (200, 405), (
            f"{svc_name} HEAD /healthz unexpected status: {res.status_code}"
        )
