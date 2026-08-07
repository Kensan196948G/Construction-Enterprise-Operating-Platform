"""Fetcher for 08 購買 (Procurement) stats."""
from __future__ import annotations

from .base import BaseFetcher


class ProcFetcher(BaseFetcher):
    department = "08_procurement"
    base_url_attr = "api_base_procurement"
    path = "/procurement/stats"
