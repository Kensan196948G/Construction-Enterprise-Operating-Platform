"""Fetcher for 03 ソリューション (Solution) stats."""
from __future__ import annotations

from .base import BaseFetcher


class SolutionFetcher(BaseFetcher):
    department = "03_solution"
    base_url_attr = "api_base_solution"
    path = "/solution/stats"
