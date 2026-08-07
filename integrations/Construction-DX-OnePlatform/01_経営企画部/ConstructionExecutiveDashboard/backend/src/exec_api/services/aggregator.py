"""他部門 API 集約サービス (Loop #5).

10 部門 (02..11) + Loop#4 互換ドメイン (sales/construction/...) の
``/api/v1/{dept}/stats`` を httpx で **並列** に取得する。

- 各部門 5 秒タイムアウト
- 失敗時は KPI を None で埋め (full-failure ではない)
- TTL 5 分のメモリキャッシュ
- 部門 URL は config(env) で上書き可能、未設定なら ``DEPT_API_DEFAULT_BASE``
  (既定 ``http://mocks:8000``) を使う。
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any, TypedDict

import httpx

from ..config import ExecApiSettings, get_settings

log = logging.getLogger(__name__)


# --- 10 部門定義 ---------------------------------------------------------
# (dept_code, attr_on_settings, /api/v1/<path>/stats のパス)
DEPT_SPECS: list[tuple[str, str, str]] = [
    ("dept02", "dept02_api_base", "sales"),          # 02 営業本部
    ("dept03", "dept03_api_base", "solution_sales"), # 03 ソリューション営業本部
    ("dept04", "dept04_api_base", "construction"),   # 04 施工本部
    ("dept05", "dept05_api_base", "engineering"),    # 05 技術本部
    ("dept06", "dept06_api_base", "safety"),         # 06 安全品質環境本部
    ("dept07", "dept07_api_base", "corporate"),      # 07 管理本部
    ("dept08", "dept08_api_base", "procurement"),    # 08 購買部
    ("dept09", "dept09_api_base", "marine"),         # 09 船舶事業部
    ("dept10", "dept10_api_base", "itsm"),           # 10 IT-DX部門
    ("dept11", "dept11_api_base", "data_platform"),  # 11 統合データ基盤
]


@dataclass
class AggregatedMetrics:
    """集約結果.

    Loop#4 互換属性 (sales/construction/...) と Loop#5 の
    10 部門 (dept02..dept11) を両方保持する。
    """

    # Loop#4 互換
    sales: dict[str, Any] = field(default_factory=dict)
    construction: dict[str, Any] = field(default_factory=dict)
    safety: dict[str, Any] = field(default_factory=dict)
    corporate: dict[str, Any] = field(default_factory=dict)
    procurement: dict[str, Any] = field(default_factory=dict)
    itsm: dict[str, Any] = field(default_factory=dict)

    # Loop#5: 10 部門ペイロード
    departments: dict[str, dict[str, Any]] = field(default_factory=dict)
    department_errors: dict[str, str] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)


# プロセス内シンプルキャッシュ (TTL)
_cache: dict[str, tuple[float, dict[str, Any]]] = {}


def _clear_cache() -> None:
    """テスト用にキャッシュをクリア."""
    _cache.clear()


def _none_payload(dept: str) -> dict[str, Any]:
    """部門 API 失敗時の None 埋めペイロード."""
    return {
        "orders_amount": None,
        "profit_margin": None,
        "cost_ratio": None,
        "accident_count": None,
        "near_miss_count": None,
        "labor_overtime_avg": None,
        "deficit_project_count": None,
        "delayed_project_count": None,
        "delay_ratio": None,
        "incident_count": None,
        "_failed": True,
        "_dept": dept,
    }


async def _fetch_one(
    client: httpx.AsyncClient,
    dept: str,
    path: str,
    base_url: str,
    timeout: float,
    cache_ttl: int,
) -> tuple[str, dict[str, Any], str | None]:
    """単一部門の /api/v1/{path}/stats を取得.

    Returns: (dept, payload, error_message_or_None)
    """
    cache_key = f"{dept}:{base_url}:{path}"
    now = time.time()
    cached = _cache.get(cache_key)
    if cached and now - cached[0] < cache_ttl:
        return dept, cached[1], None

    url = f"{base_url.rstrip('/')}/api/v1/{path}/stats"
    try:
        res = await client.get(url, timeout=timeout)
        res.raise_for_status()
        data = res.json()
        if not isinstance(data, dict):
            raise ValueError(f"non-object response: {type(data).__name__}")
        _cache[cache_key] = (now, data)
        return dept, data, None
    except (httpx.HTTPError, ValueError) as e:
        log.warning("aggregator: fetch failed dept=%s url=%s err=%s", dept, url, e)
        if cached:
            return dept, cached[1], f"stale-cache: {e}"
        return dept, _none_payload(dept), str(e)


def _resolve_base(s: ExecApiSettings, attr: str) -> str:
    val = getattr(s, attr, None)
    if val:
        return val
    return s.dept_api_default_base


async def aggregate_all(
    settings: ExecApiSettings | None = None,
    *,
    client: httpx.AsyncClient | None = None,
) -> AggregatedMetrics:
    """全 10 部門 + Loop#4 互換ドメインを並列に集約.

    Args:
        settings: 設定インスタンス (省略時は ``get_settings()``).
        client:   httpx.AsyncClient 注入用 (テスト時 MockTransport).
                  未指定時は内部で生成・クローズする。
    """
    s = settings or get_settings()

    result = AggregatedMetrics()

    async def _run(c: httpx.AsyncClient) -> None:
        dept_coros = [
            _fetch_one(
                c, dept, path, _resolve_base(s, attr),
                s.aggregator_timeout_seconds, s.aggregator_cache_ttl_seconds,
            )
            for dept, attr, path in DEPT_SPECS
        ]
        rows = await asyncio.gather(*dept_coros, return_exceptions=False)
        for dept, payload, err in rows:
            result.departments[dept] = payload
            if err:
                result.department_errors[dept] = err
                result.errors.append(f"{dept}: {err}")

    if client is None:
        async with httpx.AsyncClient() as c:
            await _run(c)
    else:
        await _run(client)

    # Loop#4 互換: 主要ドメインを 10 部門結果から派生
    result.sales = result.departments.get("dept02", {})
    result.construction = result.departments.get("dept04", {})
    result.safety = result.departments.get("dept06", {})
    result.corporate = result.departments.get("dept07", {})
    result.procurement = result.departments.get("dept08", {})
    result.itsm = result.departments.get("dept10", {})

    return result


def consolidate_kpi(metrics: AggregatedMetrics) -> dict[str, float]:
    """集約結果からトップレベル KPI を計算.

    None (部門API失敗) は 0 にフォールバック。
    """

    def _num(d: dict[str, Any], key: str, default: float = 0.0) -> float:
        try:
            v = d.get(key, default)
            if v is None:
                return default
            return float(v or 0)
        except (TypeError, ValueError):
            return default

    return {
        "orders_amount": _num(metrics.sales, "orders_amount"),
        "average_profit_margin": _num(metrics.construction, "profit_margin"),
        "cost_ratio": _num(metrics.construction, "cost_ratio"),
        "accident_count": _num(metrics.safety, "accident_count"),
        "near_miss_count": _num(metrics.safety, "near_miss_count"),
        "deficit_project_count": _num(metrics.construction, "deficit_project_count"),
        "delayed_project_count": _num(metrics.construction, "delayed_project_count"),
        "labor_overtime_avg": _num(metrics.corporate, "labor_overtime_avg"),
        "procurement_delay_ratio": _num(metrics.procurement, "delay_ratio"),
        "itsm_incident_count": _num(metrics.itsm, "incident_count"),
    }


# --- KPISnapshot 変換 ----------------------------------------------------


class KpiSnapshotRow(TypedDict):
    """``KpiSnapshot`` ORM へ insert 可能な dict 行 (Loop #8 で型ヒント整備).

    ``to_kpi_snapshots`` の戻り値要素。呼び出し側で ``KpiSnapshot(**row)`` で
    組み立てるため、ORM の列名と一致させる。
    """

    snapshot_date: date
    period_type: str
    fiscal_year: int | None
    fiscal_month: int | None
    kpi_type: str
    actual_value: Decimal
    source: str


def to_kpi_snapshots(
    metrics: AggregatedMetrics,
    *,
    snapshot_date: date,
    period_type: str = "daily",
    fiscal_year: int | None = None,
    fiscal_month: int | None = None,
) -> list[KpiSnapshotRow]:
    """集約結果を KpiSnapshot ORM へ insert 可能な dict のリストへ変換.

    DB へ直接保存しないのは、ルート/CLI から session を差し込めるように
    するため。呼び出し側で ``KpiSnapshot(**row)`` で組み立てる。
    """
    kpis = consolidate_kpi(metrics)
    rows: list[KpiSnapshotRow] = []
    for kpi_type, value in kpis.items():
        rows.append(
            KpiSnapshotRow(
                snapshot_date=snapshot_date,
                period_type=period_type,
                fiscal_year=fiscal_year,
                fiscal_month=fiscal_month,
                kpi_type=kpi_type,
                actual_value=Decimal(str(value)),
                source="aggregator",
            )
        )
    return rows
