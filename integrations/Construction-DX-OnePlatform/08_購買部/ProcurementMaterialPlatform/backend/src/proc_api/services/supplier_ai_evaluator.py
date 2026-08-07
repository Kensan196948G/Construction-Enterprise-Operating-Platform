"""協力会社 AI 評価サービス.

既存ルールベース (supplier_evaluator) を拡張:
  - 過去の納期遵守率 / 品質クレーム / 事故率 から将来リスク予測 (ロジスティック近似)
  - Azure OpenAI 経由で評価サマリ生成 (API 未設定時はテンプレ文)

外部依存無し (Azure OpenAI 呼び出しは httpx を遅延 import) で動作するため、
AZURE_OPENAI_API_KEY 未設定でも全テストが通る設計。
"""
from __future__ import annotations

import math
import os
from dataclasses import dataclass, field
from typing import Sequence

from .supplier_evaluator import SupplierMetrics, evaluate_supplier


# ---------- データクラス ----------


@dataclass(frozen=True)
class HistoricalRecord:
    """過去 1 期分の実績."""

    period: str  # YYYY-Qn or YYYY-MM
    on_time_delivery_rate: float
    defect_rate: float
    accidents: int
    orders: int


@dataclass
class AiEvaluationResult:
    """AI 評価結果."""

    supplier_id: int
    base_rank: str
    base_score: float
    risk_score: float                      # 0-100 (高いほど将来リスク大)
    risk_level: str                        # low / medium / high
    trend: str                             # improving / stable / declining
    summary: str
    factors: dict[str, float] = field(default_factory=dict)
    powered_by: str = "rule_based"         # azure_openai / rule_based


# ---------- リスク予測 ----------


def _logistic(x: float) -> float:
    try:
        return 1.0 / (1.0 + math.exp(-x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0


def _predict_risk(records: Sequence[HistoricalRecord]) -> tuple[float, dict[str, float]]:
    """履歴からリスク (0-100) と寄与因子辞書を返す."""
    if not records:
        return 50.0, {"history_missing": 1.0}
    avg_ot = sum(r.on_time_delivery_rate for r in records) / len(records)
    avg_def = sum(r.defect_rate for r in records) / len(records)
    total_acc = sum(r.accidents for r in records)
    total_ord = sum(r.orders for r in records) or 1
    acc_rate = total_acc / total_ord

    # 線形組合 → logistic で 0-1
    # 係数は経験則: 納期低下/不良率/事故率が高いほどリスク↑
    z = (
        -2.0 * (avg_ot - 0.9)          # 0.9 を基準
        + 8.0 * avg_def                 # 不良率は強く効く
        + 50.0 * acc_rate               # 事故率は最強
    )
    risk = _logistic(z) * 100.0
    return round(risk, 2), {
        "avg_on_time_rate": round(avg_ot, 3),
        "avg_defect_rate": round(avg_def, 4),
        "accident_rate": round(acc_rate, 4),
    }


def _classify_risk(score: float) -> str:
    if score >= 65:
        return "high"
    if score >= 35:
        return "medium"
    return "low"


def _detect_trend(records: Sequence[HistoricalRecord]) -> str:
    if len(records) < 2:
        return "stable"
    half = len(records) // 2
    early = records[:half]
    late = records[half:]
    early_ot = sum(r.on_time_delivery_rate for r in early) / len(early)
    late_ot = sum(r.on_time_delivery_rate for r in late) / len(late)
    diff = late_ot - early_ot
    if diff > 0.03:
        return "improving"
    if diff < -0.03:
        return "declining"
    return "stable"


# ---------- 要約生成 ----------


def _template_summary(
    supplier_name: str, base_rank: str, risk_level: str, trend: str, factors: dict[str, float]
) -> str:
    ot = factors.get("avg_on_time_rate", 0.0)
    df = factors.get("avg_defect_rate", 0.0)
    ar = factors.get("accident_rate", 0.0)
    trend_jp = {"improving": "改善傾向", "stable": "横ばい", "declining": "悪化傾向"}[trend]
    risk_jp = {"low": "低リスク", "medium": "要注意", "high": "高リスク"}[risk_level]
    return (
        f"{supplier_name} の総合ランクは {base_rank} で、将来リスクは {risk_jp} です。"
        f"納期遵守率 {ot*100:.1f}%, 不良率 {df*100:.2f}%, 事故率 {ar*100:.2f}% を踏まえ、"
        f"直近実績は{trend_jp}と評価されます。"
        f"{'継続的な発注を推奨。' if risk_level == 'low' else '主要工程での発注は慎重判断が必要。'}"
    )


def _azure_summary(
    supplier_name: str,
    base_rank: str,
    risk_level: str,
    trend: str,
    factors: dict[str, float],
) -> str | None:
    """Azure OpenAI が設定されていれば呼び出し、未設定 / 失敗時は None.

    httpx は遅延 import (テスト環境/モック容易化)。
    """
    api_key = os.environ.get("AZURE_OPENAI_API_KEY")
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
    deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT")
    if not (api_key and endpoint and deployment):
        return None
    try:
        import httpx  # noqa: F401

        prompt = (
            f"協力会社 {supplier_name} の評価サマリを 3 行で日本語で書いてください。"
            f"ランク={base_rank}, リスク={risk_level}, トレンド={trend}, 指標={factors}"
        )
        url = (
            f"{endpoint.rstrip('/')}/openai/deployments/{deployment}/chat/completions"
            "?api-version=2024-02-15-preview"
        )
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 200,
        }
        with httpx.Client(timeout=10.0) as c:
            r = c.post(url, headers={"api-key": api_key}, json=payload)
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


# ---------- 公開関数 ----------


def evaluate_supplier_with_ai(
    supplier_id: int,
    supplier_name: str,
    current_metrics: SupplierMetrics,
    history: Sequence[HistoricalRecord],
) -> AiEvaluationResult:
    """ルールベース評価 + AI 拡張."""
    base = evaluate_supplier(current_metrics)
    risk, factors = _predict_risk(history)
    risk_level = _classify_risk(risk)
    trend = _detect_trend(history)

    summary = _azure_summary(supplier_name, base.rank, risk_level, trend, factors)
    powered_by = "azure_openai" if summary else "rule_based"
    if summary is None:
        summary = _template_summary(supplier_name, base.rank, risk_level, trend, factors)

    return AiEvaluationResult(
        supplier_id=supplier_id,
        base_rank=base.rank,
        base_score=base.total_score,
        risk_score=risk,
        risk_level=risk_level,
        trend=trend,
        summary=summary,
        factors=factors,
        powered_by=powered_by,
    )
