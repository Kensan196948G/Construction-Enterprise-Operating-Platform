"""Fetcher for 10 ITSM stats."""
from __future__ import annotations

from .base import BaseFetcher


class ItsmFetcher(BaseFetcher):
    department = "10_itsm"
    base_url_attr = "api_base_itsm"
    path = "/itsm/stats"
