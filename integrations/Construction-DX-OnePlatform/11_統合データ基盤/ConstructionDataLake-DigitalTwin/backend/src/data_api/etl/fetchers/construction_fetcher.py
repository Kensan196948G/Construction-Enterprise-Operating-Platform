"""Fetcher for 04 施工 (Construction) stats."""
from __future__ import annotations

from .base import BaseFetcher


class ConstructionFetcher(BaseFetcher):
    department = "04_construction"
    base_url_attr = "api_base_construction"
    path = "/construction/stats"
