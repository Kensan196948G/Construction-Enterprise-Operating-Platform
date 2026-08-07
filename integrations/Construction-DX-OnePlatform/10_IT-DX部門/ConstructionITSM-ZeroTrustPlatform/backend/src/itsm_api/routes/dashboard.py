"""Dashboard endpoints: Wazuh / Zabbix / Grafana proxy/aggregations.

This is intentionally a thin facade; real wiring uses each system's API.
"""
from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, Depends

from itsm_api.config import get_settings
from itsm_api.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/wazuh")
async def wazuh_summary(user=Depends(get_current_user)):
    settings = get_settings()
    try:
        async with httpx.AsyncClient(verify=False, timeout=5.0) as cli:
            r = await cli.get(f"{settings.wazuh_api_url}/manager/info")
            r.raise_for_status()
            return {"status": "ok", "data": r.json()}
    except Exception as exc:  # noqa: BLE001
        logger.debug("Wazuh fetch failed (stub fallback): %s", exc)
        return {
            "status": "stub",
            "data": {"agents_active": 42, "alerts_24h": 137, "level_high": 8},
        }


@router.get("/zabbix")
async def zabbix_summary(user=Depends(get_current_user)):
    return {
        "status": "stub",
        "data": {"hosts_up": 58, "hosts_down": 2, "triggers_active": 5},
    }


@router.get("/grafana")
def grafana_links(user=Depends(get_current_user)):
    settings = get_settings()
    return {
        "base_url": settings.grafana_url,
        "dashboards": [
            {"key": "fortigate", "url": f"{settings.grafana_url}/d/fortigate"},
            {"key": "cisco", "url": f"{settings.grafana_url}/d/cisco"},
            {"key": "entra", "url": f"{settings.grafana_url}/d/entra"},
        ],
    }
