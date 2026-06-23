"""Tests for OpenAPI schema metadata (Issue 0069)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app


@pytest.fixture(scope="module")
def openapi_schema() -> dict:
    app = create_app()
    client = TestClient(app)
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    return resp.json()


def test_title(openapi_schema: dict) -> None:
    assert openapi_schema["info"]["title"] == "Construction DX OS API"


def test_description_not_phase1(openapi_schema: dict) -> None:
    desc = openapi_schema["info"]["description"]
    assert "Phase 1" not in desc
    assert "Construction DX OS" in desc


def test_contact(openapi_schema: dict) -> None:
    contact = openapi_schema["info"].get("contact", {})
    assert "url" in contact
    assert "github.com" in contact["url"]


def test_license(openapi_schema: dict) -> None:
    license_info = openapi_schema["info"].get("license", {})
    assert license_info.get("name") == "MIT"


def test_openapi_tags_all_present(openapi_schema: dict) -> None:
    expected_tags = {
        "devices", "heartbeat", "inventory", "health", "dashboard",
        "pxe", "iso-builds", "serial-scan", "registration", "policy", "admin",
    }
    actual_tags = {t["name"] for t in openapi_schema.get("tags", [])}
    assert expected_tags == actual_tags


def test_openapi_tags_have_descriptions(openapi_schema: dict) -> None:
    for tag in openapi_schema.get("tags", []):
        assert "description" in tag, f"tag '{tag['name']}' has no description"
        assert len(tag["description"]) > 0


def test_health_endpoints_in_health_tag(openapi_schema: dict) -> None:
    paths = openapi_schema.get("paths", {})
    for path in ["/health", "/health/live", "/health/ready"]:
        assert path in paths, f"{path} not found in openapi paths"
        get_op = paths[path].get("get", {})
        assert "health" in get_op.get("tags", []), f"{path} missing 'health' tag"
