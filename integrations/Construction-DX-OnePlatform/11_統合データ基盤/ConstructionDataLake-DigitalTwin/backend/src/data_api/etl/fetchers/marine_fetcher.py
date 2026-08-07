"""Fetcher for 09 船舶 (Marine) stats."""
from __future__ import annotations

from .base import BaseFetcher


class MarineFetcher(BaseFetcher):
    department = "09_marine"
    base_url_attr = "api_base_marine"
    path = "/marine/stats"
