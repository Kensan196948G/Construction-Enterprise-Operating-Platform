"""Fetcher for 05 技術 (Technical) stats."""
from __future__ import annotations

from .base import BaseFetcher


class TechFetcher(BaseFetcher):
    department = "05_tech"
    base_url_attr = "api_base_tech"
    path = "/tech/stats"
