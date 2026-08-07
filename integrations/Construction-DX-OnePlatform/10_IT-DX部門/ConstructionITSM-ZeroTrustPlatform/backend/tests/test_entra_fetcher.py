"""Tests for the Entra sign-in fetcher (Graph API mocked)."""
from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

import httpx
import pytest
from itsm_api.services import entra_log_fetcher
from itsm_api.services.entra_log_fetcher import _to_row, fetch_signin_logs


class _FakeToken:
    def __init__(self, value: str = "fake-token") -> None:
        self.token = value


class _FakeProvider:
    def get_token(self, *_scopes: str) -> _FakeToken:
        return _FakeToken("fake-token")


def _page(items, next_link=None) -> bytes:
    body = {"value": items}
    if next_link:
        body["@odata.nextLink"] = next_link
    return json.dumps(body).encode()


def test_fetch_signin_logs_pages() -> None:
    seen_urls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_urls.append(str(request.url))
        if "skiptoken" in str(request.url):
            return httpx.Response(200, content=_page([{"id": "B"}]))
        return httpx.Response(
            200,
            content=_page(
                [{"id": "A"}],
                next_link="https://graph.microsoft.com/v1.0/auditLogs/signIns?$skiptoken=xyz",
            ),
        )

    transport = httpx.MockTransport(handler)
    client = httpx.Client(transport=transport)

    results = fetch_signin_logs(
        since=datetime.now(UTC) - timedelta(hours=1),
        page_size=10,
        risk_only=False,
        client=client,
        token_provider=_FakeProvider(),
    )
    assert [r["id"] for r in results] == ["A", "B"]
    # httpx URL-encodes $; accept either raw or percent-encoded form.
    assert any(("$filter=" in u) or ("%24filter=" in u) for u in seen_urls)
    assert any(("$top=10" in u) or ("%24top=10" in u) for u in seen_urls)


def test_fetch_signin_logs_no_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    # Force the default provider to be None (no creds configured)
    monkeypatch.setattr(entra_log_fetcher, "_default_token_provider", lambda: None)
    items = fetch_signin_logs()
    assert len(items) == 1
    assert items[0]["id"] == "stub-1"


def test_to_row_maps_fields() -> None:
    item = {
        "id": "x1",
        "createdDateTime": "2026-05-22T10:00:00Z",
        "userPrincipalName": "u@example.com",
        "appDisplayName": "Office 365",
        "ipAddress": "1.2.3.4",
        "location": {
            "countryOrRegion": "JP",
            "city": "Tokyo",
            "geoCoordinates": {"latitude": 35.6, "longitude": 139.7},
        },
        "riskState": "atRisk",
        "riskLevelDuringSignIn": "medium",
        "status": {"errorCode": 50074},
        "clientAppUsed": "Browser",
        "conditionalAccessStatus": "success",
    }
    row = _to_row(item)
    assert row["graph_id"] == "x1"
    assert row["country"] == "JP"
    assert row["city"] == "Tokyo"
    assert row["latitude"] == 35.6
    assert row["success"] is False
    assert row["risk_state"] == "atRisk"
