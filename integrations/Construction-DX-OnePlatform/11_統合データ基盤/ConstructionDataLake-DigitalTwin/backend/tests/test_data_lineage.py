"""Data lineage graph: trace_to_sources."""
from __future__ import annotations

from data_api.services.data_lineage import build_default_lineage


def test_trace_to_sources_reaches_input_systems() -> None:
    g = build_default_lineage()
    sources = g.trace_to_sources("dataset:exec_dashboard")
    # 経営ダッシュボード is derived from construction + safety source systems via fct table.
    assert "source:04_construction.projects" in sources
    assert "source:06_safety.records" in sources
    # vessels/hr are not on this path
    assert "source:09_marine.vessels" not in sources
