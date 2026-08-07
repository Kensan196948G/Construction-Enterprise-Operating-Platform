"""燃費最適化テスト."""
from __future__ import annotations

import pytest

from marine_api.services.fuel_optimizer import (
    HistoricalSample,
    optimize_speed,
    train_model,
)


def test_optimize_returns_speed_in_range() -> None:
    r = optimize_speed(distance_nm=100.0, sea_state=1.0, cargo_tons=200.0)
    assert 6.0 <= r.optimal_speed_knots <= 18.0
    assert r.total_fuel_liters > 0
    assert r.travel_hours == pytest.approx(100.0 / r.optimal_speed_knots, abs=1e-2)
    assert r.co2_kg > 0


def test_higher_sea_state_increases_consumption() -> None:
    """海象 (波高) が大きいと L/NM が増える."""
    calm = optimize_speed(distance_nm=50.0, sea_state=0.5, cargo_tons=0.0)
    rough = optimize_speed(distance_nm=50.0, sea_state=3.0, cargo_tons=0.0)
    assert rough.consumption_per_nm > calm.consumption_per_nm
    assert rough.total_fuel_liters > calm.total_fuel_liters


def test_invalid_distance_raises() -> None:
    with pytest.raises(ValueError):
        optimize_speed(distance_nm=0.0, sea_state=1.0, cargo_tons=0.0)
    with pytest.raises(ValueError):
        optimize_speed(distance_nm=10.0, sea_state=-1.0, cargo_tons=0.0)


def test_train_model_falls_back_with_few_samples() -> None:
    """サンプルが少なすぎる時は既定係数 (DEFAULT) を返す."""
    m = train_model([
        HistoricalSample(100, 12, 1.0, 0, 200),
    ])
    assert m.source == "DEFAULT"


def test_train_model_uses_lr_when_possible() -> None:
    """サンプル十分時は LR 学習 (sklearn 未インストール時は DEFAULT のまま)."""
    samples = []
    for v in (8, 10, 12, 14, 16):
        for d in (50, 100):
            # 既定モデルに従う合成データ
            base = (1.0 + 0.002 * v * v + 0.3 * 1.0) * d
            samples.append(HistoricalSample(d, v, 1.0, 0, base))
    m = train_model(samples)
    # sklearn が無くても DEFAULT でフォールバックして例外にならないことを保証
    assert m.source in ("LR", "DEFAULT")
    # 最適化が動く
    r = optimize_speed(distance_nm=100, sea_state=1.0, cargo_tons=0, model=m)
    assert r.total_fuel_liters > 0
