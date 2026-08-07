"""ESG / SDGs 指標計算サービス.

- CO2 Scope1/2/3 合算 (環境)
- 離職率 / 女性管理職比率 (社会)
- 協力会社評価 / 法令違反件数 (ガバナンス)
- 社内 KPI から SDGs 17 ゴールへのマッピング (Loop #5)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Co2Input:
    scope1_t: float  # 直接排出 (自社設備の燃料燃焼等), t-CO2
    scope2_t: float  # 間接排出 (購入電力等), t-CO2
    scope3_t: float  # その他間接 (協力会社, 資材, 輸送等), t-CO2


@dataclass(frozen=True)
class Co2Result:
    total_t: float
    scope1_t: float
    scope2_t: float
    scope3_t: float
    scope3_share: float  # Scope3 が全体に占める割合


def calc_co2(input_: Co2Input) -> Co2Result:
    """CO2 排出量の合算と Scope3 比率."""
    total = input_.scope1_t + input_.scope2_t + input_.scope3_t
    share = (input_.scope3_t / total) if total > 0 else 0.0
    return Co2Result(
        total_t=total,
        scope1_t=input_.scope1_t,
        scope2_t=input_.scope2_t,
        scope3_t=input_.scope3_t,
        scope3_share=share,
    )


def calc_turnover_rate(leavers: int, avg_headcount: int) -> float:
    """離職率 = 期中離職者数 / 平均従業員数."""
    if avg_headcount <= 0:
        return 0.0
    return leavers / avg_headcount


def calc_female_manager_ratio(female_managers: int, total_managers: int) -> float:
    """女性管理職比率."""
    if total_managers <= 0:
        return 0.0
    return female_managers / total_managers


@dataclass(frozen=True)
class PartnerScoreInput:
    """協力会社評価入力."""

    partner_code: str
    quality_score: float  # 0-100
    safety_score: float
    delivery_score: float
    compliance_score: float


def calc_partner_score(input_: PartnerScoreInput) -> float:
    """協力会社評価 (加重平均)."""
    weights = {"quality": 0.30, "safety": 0.30, "delivery": 0.20, "compliance": 0.20}
    return (
        input_.quality_score * weights["quality"]
        + input_.safety_score * weights["safety"]
        + input_.delivery_score * weights["delivery"]
        + input_.compliance_score * weights["compliance"]
    )


@dataclass(frozen=True)
class EsgScorecard:
    environment_score: float
    social_score: float
    governance_score: float
    overall_score: float


def calc_overall_esg_score(
    co2_total_t: float,
    co2_target_t: float,
    turnover_rate: float,
    female_manager_ratio: float,
    compliance_violations: int,
    partner_score_avg: float,
) -> EsgScorecard:
    """ESG 3 軸スコア (0-100, 大きいほど良い).

    - environment_score: CO2 目標達成率 (排出が目標以下 = 100)
    - social_score: (1 - 離職率) * 50 + 女性管理職比率 * 50
    - governance_score: 100 - 違反件数 * 10 + 協力会社評価平均 (cap 100)
    """
    env_score = 100.0 * (co2_target_t / co2_total_t) if co2_total_t > 0 else 100.0
    env_score = max(0.0, min(100.0, env_score))

    soc_score = max(0.0, min(100.0, (1.0 - turnover_rate) * 50.0 + female_manager_ratio * 100.0 * 0.5))

    gov_score = max(0.0, min(100.0, 100.0 - compliance_violations * 10.0 + (partner_score_avg - 50.0) * 0.4))

    overall = (env_score + soc_score + gov_score) / 3.0
    return EsgScorecard(
        environment_score=env_score,
        social_score=soc_score,
        governance_score=gov_score,
        overall_score=overall,
    )


# --- SDGs 17 ゴール マッピング (Loop #5) ---------------------------------

#: SDGs 17 ゴール (国連 2030 アジェンダ).
SDG_GOALS: dict[int, str] = {
    1: "貧困をなくそう",
    2: "飢餓をゼロに",
    3: "すべての人に健康と福祉を",
    4: "質の高い教育をみんなに",
    5: "ジェンダー平等を実現しよう",
    6: "安全な水とトイレを世界中に",
    7: "エネルギーをみんなに そしてクリーンに",
    8: "働きがいも経済成長も",
    9: "産業と技術革新の基盤をつくろう",
    10: "人や国の不平等をなくそう",
    11: "住み続けられるまちづくりを",
    12: "つくる責任 つかう責任",
    13: "気候変動に具体的な対策を",
    14: "海の豊かさを守ろう",
    15: "陸の豊かさも守ろう",
    16: "平和と公正をすべての人に",
    17: "パートナーシップで目標を達成しよう",
}

#: 社内 KPI と SDGs ゴール の対応表 (建設業務の主要マッピング).
KPI_TO_SDG_MAPPING: dict[str, list[int]] = {
    # 環境
    "co2_total_t": [7, 13],
    "co2_scope3_share": [12, 13],
    "renewable_energy_ratio": [7, 13],
    "waste_recycle_ratio": [11, 12],
    # 社会
    "accident_count": [3, 8],
    "near_miss_count": [3, 8],
    "labor_overtime_avg": [3, 8],
    "turnover_rate": [8],
    "female_manager_ratio": [5, 10],
    "training_hours_per_employee": [4, 8],
    # ガバナンス
    "compliance_violations": [16],
    "partner_score_avg": [16, 17],
    "supply_chain_audits": [12, 17],
    # 事業
    "orders_amount": [8, 9],
    "deficit_project_count": [8, 9],
    "delayed_project_count": [9, 11],
    "infrastructure_resilience_index": [9, 11],
}


def get_sdg_mapping() -> list[dict[str, Any]]:
    """KPI → SDGs ゴール のマッピング表を返す.

    Returns:
        各 KPI に対する [{kpi, sdg_goals: [{id, title}]}] のリスト。
    """
    out: list[dict[str, Any]] = []
    for kpi, goal_ids in KPI_TO_SDG_MAPPING.items():
        out.append(
            {
                "kpi": kpi,
                "sdg_goals": [
                    {"id": gid, "title": SDG_GOALS[gid]} for gid in goal_ids
                ],
            }
        )
    return out


def calc_sdg_coverage(active_kpis: list[str]) -> dict[str, Any]:
    """与えられた KPI 集合が SDGs 17 ゴールのうち何件をカバーするかを集計.

    Args:
        active_kpis: 計測中の KPI 名リスト

    Returns:
        ``{"covered_goals": [...], "coverage_ratio": 0..1, "by_goal": {gid: [kpi,...]}}``
    """
    by_goal: dict[int, list[str]] = {gid: [] for gid in SDG_GOALS}
    for kpi in active_kpis:
        for gid in KPI_TO_SDG_MAPPING.get(kpi, []):
            by_goal[gid].append(kpi)
    covered = sorted(gid for gid, kpis in by_goal.items() if kpis)
    return {
        "covered_goals": covered,
        "coverage_ratio": len(covered) / len(SDG_GOALS),
        "by_goal": {
            gid: {"title": SDG_GOALS[gid], "kpis": kpis}
            for gid, kpis in by_goal.items()
        },
    }
