"""ETL scheduler skeleton.

In production the scheduling is delegated to Airflow (cdx_etl_* DAGs); the
``get_dag_definition()`` helper here exports the same job catalog as a
dict-of-dicts that an Airflow DAG factory (or, for local dev, APScheduler)
can iterate over.

The intent of this module is to keep the *catalog of jobs* — cron, fetcher
class, transforms, output table — in a single place that both the running
service and the deployed DAG share.
"""
from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from data_api.etl.fetchers import (
    AppEtlError,
    BaseFetcher,
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
from data_api.services.etl_engine import EtlOutcome, InMemorySink, Sink, run_etl

logger = logging.getLogger(__name__)


@dataclass
class EtlJobSpec:
    """Declarative ETL job description (cron + fetcher + transforms + sink)."""

    name: str
    department: str
    fetcher_factory: Callable[[], BaseFetcher]
    output_table: str
    schedule_cron: str
    transforms: list[dict[str, Any]] = field(default_factory=list)
    description: str = ""

    def to_airflow_dict(self) -> dict[str, Any]:
        return {
            "dag_id": f"cdx_etl_{self.name}",
            "schedule": self.schedule_cron,
            "department": self.department,
            "output_table": self.output_table,
            "transforms": list(self.transforms),
            "description": self.description,
        }


# ---- Job catalog --------------------------------------------------------
JOB_CATALOG: list[EtlJobSpec] = [
    EtlJobSpec(
        name="construction_stats",
        department="04_construction",
        fetcher_factory=ConstructionFetcher,
        output_table="curated_construction_stats",
        schedule_cron="*/15 * * * *",
        description="04 施工部門の KPI スナップショット",
    ),
    EtlJobSpec(
        name="safety_stats",
        department="06_safety",
        fetcher_factory=SafetyFetcher,
        output_table="curated_safety_stats",
        schedule_cron="*/15 * * * *",
        description="06 安全部門の事故/KY 集計",
    ),
    EtlJobSpec(
        name="itsm_stats",
        department="10_itsm",
        fetcher_factory=ItsmFetcher,
        output_table="curated_itsm_stats",
        schedule_cron="*/10 * * * *",
        description="10 ITSM チケット推移",
    ),
    EtlJobSpec(
        name="corp_stats",
        department="07_corp",
        fetcher_factory=CorpFetcher,
        output_table="curated_corp_stats",
        schedule_cron="0 */1 * * *",
        description="07 管理部門の人事/勤怠集計",
    ),
    EtlJobSpec(
        name="proc_stats",
        department="08_procurement",
        fetcher_factory=ProcFetcher,
        output_table="curated_proc_stats",
        schedule_cron="0 */1 * * *",
        description="08 購買部門の発注/在庫",
    ),
    EtlJobSpec(
        name="marine_stats",
        department="09_marine",
        fetcher_factory=MarineFetcher,
        output_table="curated_marine_stats",
        schedule_cron="*/30 * * * *",
        description="09 船舶部門の運航状況",
    ),
    EtlJobSpec(
        name="crm_stats",
        department="02_crm",
        fetcher_factory=CrmFetcher,
        output_table="curated_crm_stats",
        schedule_cron="0 */1 * * *",
        description="02 営業部門の案件パイプライン",
    ),
    EtlJobSpec(
        name="solution_stats",
        department="03_solution",
        fetcher_factory=SolutionFetcher,
        output_table="curated_solution_stats",
        schedule_cron="0 */2 * * *",
        description="03 ソリューション部門",
    ),
    EtlJobSpec(
        name="exec_stats",
        department="01_exec",
        fetcher_factory=ExecFetcher,
        output_table="curated_exec_stats",
        schedule_cron="0 */1 * * *",
        description="01 経営部門サマリ",
    ),
    EtlJobSpec(
        name="tech_stats",
        department="05_tech",
        fetcher_factory=TechFetcher,
        output_table="curated_tech_stats",
        schedule_cron="0 */2 * * *",
        description="05 技術部門",
    ),
]


def get_dag_definition() -> dict[str, dict[str, Any]]:
    """Export the job catalog as a dict keyed by DAG id (Airflow-compatible)."""
    return {f"cdx_etl_{spec.name}": spec.to_airflow_dict() for spec in JOB_CATALOG}


async def run_job(spec: EtlJobSpec, *, sink: Sink | None = None) -> EtlOutcome:
    """Execute a single job spec via :func:`run_etl`."""
    used_sink: Sink = sink or InMemorySink()
    fetcher = spec.fetcher_factory()
    try:
        return await run_etl(
            fetcher=fetcher,
            transforms=spec.transforms,
            sink=used_sink,
            output_table=spec.output_table,
        )
    except AppEtlError as exc:
        logger.warning("ETL job %s failed: %s", spec.name, exc)
        raise


async def run_all_jobs(*, sink: Sink | None = None) -> dict[str, EtlOutcome]:
    """Run every job in the catalog concurrently (for ad-hoc bulk refresh)."""
    used_sink: Sink = sink or InMemorySink()
    coros = {spec.name: run_job(spec, sink=used_sink) for spec in JOB_CATALOG}
    results = await asyncio.gather(*coros.values(), return_exceptions=True)
    out: dict[str, EtlOutcome] = {}
    for name, result in zip(coros.keys(), results, strict=True):
        if isinstance(result, EtlOutcome):
            out[name] = result
        else:  # exception
            logger.error("job %s raised: %r", name, result)
    return out
