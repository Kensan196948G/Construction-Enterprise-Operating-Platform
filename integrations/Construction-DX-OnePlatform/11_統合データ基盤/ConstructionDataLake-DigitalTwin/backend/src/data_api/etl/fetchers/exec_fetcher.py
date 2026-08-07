"""Fetcher for 01 経営 (Executive) stats."""
from __future__ import annotations

from .base import BaseFetcher


class ExecFetcher(BaseFetcher):
    department = "01_exec"
    base_url_attr = "api_base_exec"
    path = "/exec/stats"
