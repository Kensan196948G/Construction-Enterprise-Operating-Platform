"""インフラ老朽度アナライザのユニットテスト."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from sol_api.services.infrastructure_age_analyzer import (
    AgeAnalysisInput,
    AssetPoint,
    analyze,
    build_heatmap_geojson,
    color_for_score,
)


def test_coastal_high_importance_old_bridge_urgent() -> None:
    """築 60 年, 海岸, 重要度 A の橋梁 -> URGENT."""
    inp = AgeAnalysisInput(
        built_year=1965,
        last_inspection_date=date(2024, 6, 1),
        inspection_score=None,
        environment="coastal",
        importance_level="A",
    )
    res = analyze(inp, today=date(2025, 4, 1))
    assert res.age_years == 60
    # 60 * 1.2 = 72, 72 * 1.2(coastal) * 1.2(A) = 103.68 -> clip 100 -> URGENT
    assert res.deterioration_score == Decimal("100.00")
    assert res.priority == "URGENT"


def test_new_low_importance_asset_low_priority() -> None:
    """築 5 年, 都市, 重要度 C -> LOW."""
    inp = AgeAnalysisInput(
        built_year=2020,
        last_inspection_date=None,
        inspection_score=None,
        environment="urban",
        importance_level="C",
    )
    res = analyze(inp, today=date(2025, 4, 1))
    assert res.age_years == 5
    # base = 5 * 1.2 = 6.0; * 1.0(urban) * 0.85(C) = 5.10
    assert res.deterioration_score == Decimal("5.10")
    assert res.priority == "LOW"


# ============ ヒートマップ GeoJSON ============


def test_color_for_score_thresholds() -> None:
    """色は URGENT/HIGH/MEDIUM/LOW で切替わる."""
    assert color_for_score(Decimal("90")) == "#dc2626"  # URGENT
    assert color_for_score(Decimal("65")) == "#ea580c"  # HIGH
    assert color_for_score(Decimal("45")) == "#f59e0b"  # MEDIUM
    assert color_for_score(Decimal("10")) == "#16a34a"  # LOW


def test_build_heatmap_geojson_skips_assets_without_coords() -> None:
    """緯度経度の無い資産は features から除外される."""
    points = [
        AssetPoint(
            asset_id=1,
            asset_code="A001",
            name="Tokyo Bridge",
            asset_type="bridge",
            longitude=139.7,
            latitude=35.6,
            built_year=1965,
            inspection_score=None,
            environment="coastal",
            importance_level="A",
        ),
        AssetPoint(
            asset_id=2,
            asset_code="A002",
            name="ghost asset",
            asset_type="dam",
            longitude=None,
            latitude=None,
            built_year=2000,
            inspection_score=None,
            environment="mountain",
            importance_level="B",
        ),
    ]
    fc = build_heatmap_geojson(points, today=date(2025, 4, 1))
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) == 1
    f = fc["features"][0]
    assert f["geometry"]["coordinates"] == [139.7, 35.6]
    assert f["properties"]["asset_id"] == 1
    assert f["properties"]["priority"] in {"URGENT", "HIGH", "MEDIUM", "LOW"}
    # color が color_stops のいずれか
    stop_colors = {c["color"] for c in fc["color_stops"]}
    assert f["properties"]["color"] in stop_colors
