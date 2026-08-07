"""Per-department fetchers for the Data Lake ETL pipelines.

Each fetcher exposes ``async def fetch(client: httpx.AsyncClient | None = None) -> list[dict]``
and reads the relevant *stats* endpoint from the source system.  When the source
system is unreachable an :class:`AppEtlError` is raised so the surrounding
``run_etl`` records a *failed* outcome instead of silently swallowing the error.
"""
from __future__ import annotations

from .base import AppEtlError, BaseFetcher
from .construction_fetcher import ConstructionFetcher
from .corp_fetcher import CorpFetcher
from .crm_fetcher import CrmFetcher
from .exec_fetcher import ExecFetcher
from .itsm_fetcher import ItsmFetcher
from .marine_fetcher import MarineFetcher
from .proc_fetcher import ProcFetcher
from .safety_fetcher import SafetyFetcher
from .solution_fetcher import SolutionFetcher
from .tech_fetcher import TechFetcher

__all__ = [
    "AppEtlError",
    "BaseFetcher",
    "ConstructionFetcher",
    "CorpFetcher",
    "CrmFetcher",
    "ExecFetcher",
    "ItsmFetcher",
    "MarineFetcher",
    "ProcFetcher",
    "SafetyFetcher",
    "SolutionFetcher",
    "TechFetcher",
]
