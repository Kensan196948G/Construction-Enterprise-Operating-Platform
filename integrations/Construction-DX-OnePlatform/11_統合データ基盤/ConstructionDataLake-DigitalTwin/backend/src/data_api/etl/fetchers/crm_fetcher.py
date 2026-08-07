"""Fetcher for 02 営業 (CRM / Sales) stats."""
from __future__ import annotations

from .base import BaseFetcher


class CrmFetcher(BaseFetcher):
    department = "02_crm"
    base_url_attr = "api_base_crm"
    path = "/crm/stats"
