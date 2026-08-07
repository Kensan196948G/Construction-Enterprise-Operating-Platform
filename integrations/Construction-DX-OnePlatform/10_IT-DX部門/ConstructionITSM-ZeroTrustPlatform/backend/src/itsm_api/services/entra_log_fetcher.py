"""Entra ID sign-in log fetcher via Microsoft Graph REST API.

We deliberately use ``httpx`` over the Graph SDK so that page-size, filters
and retry behaviour are explicit and easy to mock in tests. Tokens are
acquired via :class:`azure.identity.ClientSecretCredential` (sync) and
cached for the lifetime of one fetch run.
"""
from __future__ import annotations

import logging
from collections.abc import Iterable
from datetime import UTC, datetime, timedelta
from typing import Any, Protocol

import httpx
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from itsm_api.config import get_settings
from itsm_api.models.entra_signin import EntraSignin

logger = logging.getLogger(__name__)

GRAPH_BASE = "https://graph.microsoft.com/v1.0"


class TokenProvider(Protocol):
    def get_token(self, *scopes: str) -> Any: ...


def _default_token_provider() -> TokenProvider | None:
    settings = get_settings()
    if not (settings.entra_tenant_id and settings.entra_client_id and settings.entra_client_secret):
        return None
    try:
        from azure.identity import ClientSecretCredential

        return ClientSecretCredential(
            tenant_id=settings.entra_tenant_id,
            client_id=settings.entra_client_id,
            client_secret=settings.entra_client_secret,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("azure-identity unavailable: %s", exc)
        return None


def _build_filter(since: datetime, risk_only: bool) -> str:
    iso = since.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    parts = [f"createdDateTime ge {iso}"]
    if risk_only:
        parts.append(
            "(riskState ne 'none' or riskLevelDuringSignIn ne 'none' "
            "or riskLevelAggregated ne 'none')"
        )
    return " and ".join(parts)


def fetch_signin_logs(
    *,
    since: datetime | None = None,
    page_size: int | None = None,
    risk_only: bool | None = None,
    client: httpx.Client | None = None,
    token_provider: TokenProvider | None = None,
) -> list[dict[str, Any]]:
    """Fetch sign-in logs (last 24h by default, risk-only).

    Pages through ``@odata.nextLink`` until exhausted. Returns the merged list.
    Falls back to a single stub entry if credentials are missing.
    """
    settings = get_settings()
    since = since or datetime.now(UTC) - timedelta(hours=settings.entra_fetch_lookback_hours)
    page_size = page_size or settings.entra_fetch_page_size
    risk_only = settings.entra_fetch_risk_only if risk_only is None else risk_only

    provider = token_provider or _default_token_provider()
    if provider is None:
        logger.info("Entra credentials missing; returning stub sign-in data")
        return [
            {
                "id": "stub-1",
                "createdDateTime": datetime.now(UTC).isoformat(),
                "userPrincipalName": "demo@example.com",
                "appDisplayName": "Microsoft 365",
                "ipAddress": "203.0.113.10",
                "location": {"countryOrRegion": "JP", "city": "Tokyo"},
                "riskState": "atRisk",
                "riskLevelDuringSignIn": "medium",
                "status": {"errorCode": 0},
            }
        ]

    token = provider.get_token("https://graph.microsoft.com/.default")
    access_token = getattr(token, "token", token)
    headers = {"Authorization": f"Bearer {access_token}"}

    params = {"$top": str(page_size), "$filter": _build_filter(since, risk_only)}
    url: str | None = f"{GRAPH_BASE}/auditLogs/signIns"

    owns_client = client is None
    client = client or httpx.Client(timeout=30.0)
    results: list[dict[str, Any]] = []
    try:
        first = True
        while url:
            resp = client.get(url, headers=headers, params=params if first else None)
            resp.raise_for_status()
            payload = resp.json()
            results.extend(payload.get("value", []))
            url = payload.get("@odata.nextLink")
            first = False
    finally:
        if owns_client:
            client.close()
    return results


def _to_row(item: dict[str, Any]) -> dict[str, Any]:
    loc = item.get("location") or {}
    status = item.get("status") or {}
    return {
        "graph_id": item.get("id"),
        "occurred_at": item.get("createdDateTime"),
        "user_principal_name": item.get("userPrincipalName"),
        "user_id": item.get("userId"),
        "app_display_name": item.get("appDisplayName"),
        "client_app": item.get("clientAppUsed"),
        "ip_address": item.get("ipAddress"),
        "country": loc.get("countryOrRegion"),
        "city": loc.get("city"),
        "latitude": (loc.get("geoCoordinates") or {}).get("latitude"),
        "longitude": (loc.get("geoCoordinates") or {}).get("longitude"),
        "risk_state": item.get("riskState"),
        "risk_level": item.get("riskLevelDuringSignIn"),
        "conditional_access": item.get("conditionalAccessStatus"),
        "success": (status.get("errorCode") or 0) == 0,
        "raw": item,
    }


def upsert_signins(db: Session, items: Iterable[dict[str, Any]]) -> int:
    """Upsert sign-in events keyed by ``graph_id``. Returns affected count."""
    rows = [_to_row(i) for i in items if i.get("id")]
    if not rows:
        return 0
    stmt = pg_insert(EntraSignin).values(rows)
    update_cols = {
        c.name: stmt.excluded[c.name]
        for c in EntraSignin.__table__.columns
        if c.name not in {"signin_id", "graph_id", "ingested_at"}
    }
    stmt = stmt.on_conflict_do_update(index_elements=[EntraSignin.graph_id], set_=update_cols)
    db.execute(stmt)
    db.commit()
    return len(rows)
