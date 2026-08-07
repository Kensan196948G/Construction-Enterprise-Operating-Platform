"""Fetcher for 06 安全 (Safety) stats."""
from __future__ import annotations

from .base import BaseFetcher


class SafetyFetcher(BaseFetcher):
    department = "06_safety"
    base_url_attr = "api_base_safety"
    path = "/safety/stats"
