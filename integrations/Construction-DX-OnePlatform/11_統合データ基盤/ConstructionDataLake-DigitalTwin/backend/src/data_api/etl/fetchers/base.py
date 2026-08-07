"""Base fetcher used by every department-specific ETL extractor.

The real Airflow DAG instantiates one concrete fetcher per department and hands
it to :func:`data_api.services.etl_engine.run_etl` as the ``fetcher`` arg.

Design notes
------------
* Concrete subclasses only have to declare ``department``, ``base_url_attr`` and
  ``path``; the base class handles the HTTP call, timeout and error wrapping.
* ``fetch()`` always returns a ``list[dict]``.  If the endpoint returns a single
  envelope dict (``{"items": [...]}`` or ``{"stats": {...}}``), it is unwrapped.
* On any networking / decoding error an :class:`AppEtlError` is raised so the
  ``run_etl`` outcome is recorded as ``status="failed"`` with a useful message.
"""
from __future__ import annotations

import logging
from typing import Any, ClassVar

import httpx

from data_api.config import get_settings

logger = logging.getLogger(__name__)

# 10 seconds per requirement.
DEFAULT_TIMEOUT_SEC: float = 10.0


class AppEtlError(RuntimeError):
    """Raised when an ETL fetcher cannot retrieve data from the source system."""

    def __init__(self, message: str, *, department: str | None = None, url: str | None = None) -> None:
        super().__init__(message)
        self.department = department
        self.url = url


class BaseFetcher:
    """Base class for per-department fetchers.

    Subclasses only need to set the four class attributes below.
    """

    #: Logical department identifier (e.g. "04_construction").
    department: ClassVar[str] = ""
    #: Attribute name on :class:`Settings` holding the base URL of the source API.
    base_url_attr: ClassVar[str] = ""
    #: Path appended to the base URL (e.g. "/stats" — leading slash optional).
    path: ClassVar[str] = ""
    #: Optional default query params.
    default_params: ClassVar[dict[str, Any] | None] = None

    def __init__(
        self,
        *,
        base_url: str | None = None,
        params: dict[str, Any] | None = None,
        timeout: float = DEFAULT_TIMEOUT_SEC,
    ) -> None:
        if base_url is None:
            settings = get_settings()
            base_url = getattr(settings, self.base_url_attr, "") or ""
        self.base_url = base_url.rstrip("/")
        self.params = {**(self.default_params or {}), **(params or {})}
        self.timeout = timeout

    @property
    def url(self) -> str:
        path = self.path if self.path.startswith("/") else f"/{self.path}"
        return f"{self.base_url}{path}"

    async def __call__(self, client: httpx.AsyncClient | None = None) -> list[dict[str, Any]]:
        return await self.fetch(client=client)

    async def fetch(self, client: httpx.AsyncClient | None = None) -> list[dict[str, Any]]:
        if not self.base_url:
            raise AppEtlError(
                f"base URL for department {self.department!r} is not configured",
                department=self.department,
            )
        own_client = client is None
        cli = client or httpx.AsyncClient(timeout=self.timeout)
        try:
            try:
                resp = await cli.get(self.url, params=self.params or None)
            except (httpx.RequestError, httpx.TimeoutException) as exc:
                raise AppEtlError(
                    f"network error while fetching {self.url}: {exc}",
                    department=self.department,
                    url=self.url,
                ) from exc
            if resp.status_code >= 400:
                raise AppEtlError(
                    f"upstream {self.url} returned HTTP {resp.status_code}",
                    department=self.department,
                    url=self.url,
                )
            try:
                payload = resp.json()
            except ValueError as exc:
                raise AppEtlError(
                    f"non-JSON response from {self.url}",
                    department=self.department,
                    url=self.url,
                ) from exc
            return self._unwrap(payload)
        finally:
            if own_client:
                await cli.aclose()

    @staticmethod
    def _unwrap(payload: Any) -> list[dict[str, Any]]:
        """Normalize an upstream JSON payload into a list of row-like dicts."""
        if isinstance(payload, list):
            return [dict(r) if isinstance(r, dict) else {"value": r} for r in payload]
        if isinstance(payload, dict):
            for key in ("items", "data", "results", "rows"):
                if key in payload and isinstance(payload[key], list):
                    return [dict(r) if isinstance(r, dict) else {"value": r} for r in payload[key]]
            # /stats style: a single envelope is returned as one row.
            return [dict(payload)]
        return [{"value": payload}]
