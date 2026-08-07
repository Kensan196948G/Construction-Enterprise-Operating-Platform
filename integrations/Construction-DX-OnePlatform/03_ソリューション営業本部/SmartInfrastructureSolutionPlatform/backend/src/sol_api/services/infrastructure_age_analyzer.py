"""インフラ老朽度・優先度評価.

入力: 築年数 / 直近点検結果 / 環境(海岸/凍結等) / 重要度 A/B/C
出力: 0-100 老朽度スコア + 優先度ランク (URGENT/HIGH/MEDIUM/LOW)
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Iterable, Literal


Priority = Literal["URGENT", "HIGH", "MEDIUM", "LOW"]


@dataclass(frozen=True)
class AgeAnalysisInput:
    built_year: int | None
    last_inspection_date: date | None
    inspection_score: Decimal | None  # 0(健全)-100(劣化甚)
    environment: str | None  # 'coastal' | 'cold' | 'mountain' | 'urban' | None
    importance_level: str | None  # 'A' | 'B' | 'C'


@dataclass(frozen=True)
class AgeAnalysisResult:
    age_years: int | None
    deterioration_score: Decimal  # 0-100
    priority: Priority


_ENV_FACTOR = {
    "coastal": Decimal("1.2"),  # 塩害
    "cold": Decimal("1.15"),
    "mountain": Decimal("1.05"),
    "urban": Decimal("1.0"),
}

_IMPORTANCE_FACTOR = {
    "A": Decimal("1.2"),
    "B": Decimal("1.0"),
    "C": Decimal("0.85"),
}


def analyze(inp: AgeAnalysisInput, *, today: date | None = None) -> AgeAnalysisResult:
    today = today or date.today()
    age = today.year - inp.built_year if inp.built_year else None

    # ベーススコア
    if inp.inspection_score is not None:
        base = inp.inspection_score
    elif age is not None:
        # 50年で約60点になるリニア近似 (上限100)
        base = min(Decimal("100"), Decimal(age) * Decimal("1.2"))
    else:
        base = Decimal("0")

    env_factor = _ENV_FACTOR.get((inp.environment or "").lower(), Decimal("1.0"))
    imp_factor = _IMPORTANCE_FACTOR.get((inp.importance_level or "B").upper(), Decimal("1.0"))

    score = (base * env_factor * imp_factor).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    if score > Decimal("100"):
        score = Decimal("100")
    if score < Decimal("0"):
        score = Decimal("0")

    if score >= Decimal("80"):
        priority: Priority = "URGENT"
    elif score >= Decimal("60"):
        priority = "HIGH"
    elif score >= Decimal("40"):
        priority = "MEDIUM"
    else:
        priority = "LOW"

    return AgeAnalysisResult(age_years=age, deterioration_score=score, priority=priority)


# 老朽スコア -> color stop (信号機色)
_COLOR_STOPS: list[tuple[Decimal, str]] = [
    (Decimal("80"), "#dc2626"),  # URGENT red-600
    (Decimal("60"), "#ea580c"),  # HIGH orange-600
    (Decimal("40"), "#f59e0b"),  # MEDIUM amber-500
    (Decimal("0"), "#16a34a"),  # LOW green-600
]


def color_for_score(score: Decimal) -> str:
    for threshold, color in _COLOR_STOPS:
        if score >= threshold:
            return color
    return "#16a34a"


@dataclass(frozen=True)
class AssetPoint:
    """GeoJSON 生成用ヘッドレス DTO."""

    asset_id: int
    asset_code: str
    name: str
    asset_type: str
    longitude: float | None
    latitude: float | None
    built_year: int | None
    inspection_score: Decimal | None
    environment: str | None
    importance_level: str | None


def build_heatmap_geojson(
    assets: Iterable[AssetPoint], *, today: date | None = None
) -> dict[str, Any]:
    """資産一覧から老朽度ヒートマップ用 GeoJSON FeatureCollection を生成."""
    features: list[dict[str, Any]] = []
    for a in assets:
        if a.longitude is None or a.latitude is None:
            continue
        res = analyze(
            AgeAnalysisInput(
                built_year=a.built_year,
                last_inspection_date=None,
                inspection_score=a.inspection_score,
                environment=a.environment,
                importance_level=a.importance_level,
            ),
            today=today,
        )
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [a.longitude, a.latitude],
                },
                "properties": {
                    "asset_id": a.asset_id,
                    "asset_code": a.asset_code,
                    "name": a.name,
                    "asset_type": a.asset_type,
                    "age_years": res.age_years,
                    "deterioration_score": float(res.deterioration_score),
                    "priority": res.priority,
                    "color": color_for_score(res.deterioration_score),
                },
            }
        )
    return {
        "type": "FeatureCollection",
        "features": features,
        "color_stops": [
            {"min_score": float(t), "color": c} for t, c in _COLOR_STOPS
        ],
    }
