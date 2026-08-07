"""Per-department ETL fetcher tests (httpx MockTransport).

One unit test per department fetcher (10 total).  Each test wires the fetcher
to a stub upstream that returns a tiny ``/stats`` envelope and asserts that
the row count + unwrapped shape are correct.
"""
from __future__ import annotations

import httpx
import pytest
from data_api.etl.fetchers import (
    AppEtlError,
    ConstructionFetcher,
    CorpFetcher,
    CrmFetcher,
    ExecFetcher,
    ItsmFetcher,
    MarineFetcher,
    ProcFetcher,
    SafetyFetcher,
    SolutionFetcher,
    TechFetcher,
)


def _stub_transport(expected_path: str, payload):
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == expected_path, (request.url.path, expected_path)
        return httpx.Response(200, json=payload)

    return httpx.MockTransport(handler)


@pytest.mark.asyncio
async def test_construction_fetcher_returns_stats_row() -> None:
    transport = _stub_transport(
        "/construction/stats",
        {"items": [{"id": 1, "project": "tunnel-A", "progress_pct": 42.5}]},
    )
    async with httpx.AsyncClient(transport=transport) as cli:
        fetcher = ConstructionFetcher(base_url="http://construction")
        rows = await fetcher.fetch(client=cli)
    assert rows == [{"id": 1, "project": "tunnel-A", "progress_pct": 42.5}]


@pytest.mark.asyncio
async def test_safety_fetcher_unwraps_dict_envelope() -> None:
    transport = _stub_transport(
        "/safety/stats",
        {"incidents_total": 3, "ky_pending": 12},
    )
    async with httpx.AsyncClient(transport=transport) as cli:
        rows = await SafetyFetcher(base_url="http://safety").fetch(client=cli)
    assert rows == [{"incidents_total": 3, "ky_pending": 12}]


@pytest.mark.asyncio
async def test_itsm_fetcher_handles_list_payload() -> None:
    transport = _stub_transport(
        "/itsm/stats",
        [{"id": "T-1", "state": "open"}, {"id": "T-2", "state": "closed"}],
    )
    async with httpx.AsyncClient(transport=transport) as cli:
        rows = await ItsmFetcher(base_url="http://itsm").fetch(client=cli)
    assert len(rows) == 2
    assert rows[0]["state"] == "open"


@pytest.mark.asyncio
async def test_corp_fetcher_basic() -> None:
    transport = _stub_transport(
        "/corp/stats",
        {"data": [{"hc": 1024, "ot_avg_h": 18.4}]},
    )
    async with httpx.AsyncClient(transport=transport) as cli:
        rows = await CorpFetcher(base_url="http://corp").fetch(client=cli)
    assert rows == [{"hc": 1024, "ot_avg_h": 18.4}]


@pytest.mark.asyncio
async def test_proc_fetcher_basic() -> None:
    transport = _stub_transport(
        "/procurement/stats",
        {"items": [{"po_count": 88, "lead_avg_d": 12.1}]},
    )
    async with httpx.AsyncClient(transport=transport) as cli:
        rows = await ProcFetcher(base_url="http://proc").fetch(client=cli)
    assert rows[0]["po_count"] == 88


@pytest.mark.asyncio
async def test_marine_fetcher_basic() -> None:
    transport = _stub_transport(
        "/marine/stats",
        {"results": [{"vessel": "MV-Kanagawa", "speed_kt": 12.3}]},
    )
    async with httpx.AsyncClient(transport=transport) as cli:
        rows = await MarineFetcher(base_url="http://marine").fetch(client=cli)
    assert rows[0]["vessel"] == "MV-Kanagawa"


@pytest.mark.asyncio
async def test_crm_fetcher_basic() -> None:
    transport = _stub_transport(
        "/crm/stats",
        {"pipeline_total": 4200000, "win_rate": 0.31},
    )
    async with httpx.AsyncClient(transport=transport) as cli:
        rows = await CrmFetcher(base_url="http://crm").fetch(client=cli)
    assert rows[0]["pipeline_total"] == 4200000


@pytest.mark.asyncio
async def test_solution_fetcher_basic() -> None:
    transport = _stub_transport(
        "/solution/stats",
        {"items": [{"product": "X", "deployments": 5}]},
    )
    async with httpx.AsyncClient(transport=transport) as cli:
        rows = await SolutionFetcher(base_url="http://sol").fetch(client=cli)
    assert rows[0]["deployments"] == 5


@pytest.mark.asyncio
async def test_exec_fetcher_basic() -> None:
    transport = _stub_transport(
        "/exec/stats",
        {"revenue_jpy": 1234567, "ebitda_pct": 11.5},
    )
    async with httpx.AsyncClient(transport=transport) as cli:
        rows = await ExecFetcher(base_url="http://exec").fetch(client=cli)
    assert rows[0]["ebitda_pct"] == 11.5


@pytest.mark.asyncio
async def test_tech_fetcher_basic() -> None:
    transport = _stub_transport(
        "/tech/stats",
        {"items": [{"patents_filed": 3, "rnd_topics": 12}]},
    )
    async with httpx.AsyncClient(transport=transport) as cli:
        rows = await TechFetcher(base_url="http://tech").fetch(client=cli)
    assert rows[0]["patents_filed"] == 3


@pytest.mark.asyncio
async def test_fetcher_raises_app_etl_error_on_network_failure() -> None:
    def boom(_request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused")

    transport = httpx.MockTransport(boom)
    async with httpx.AsyncClient(transport=transport) as cli:
        with pytest.raises(AppEtlError):
            await ConstructionFetcher(base_url="http://no").fetch(client=cli)
