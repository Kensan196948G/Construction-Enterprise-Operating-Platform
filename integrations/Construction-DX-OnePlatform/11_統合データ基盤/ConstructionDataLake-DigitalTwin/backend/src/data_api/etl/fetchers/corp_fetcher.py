"""Fetcher for 07 管理 (Corporate / Backoffice) stats."""
from __future__ import annotations

from .base import BaseFetcher


class CorpFetcher(BaseFetcher):
    department = "07_corp"
    base_url_attr = "api_base_corp"
    path = "/corp/stats"
