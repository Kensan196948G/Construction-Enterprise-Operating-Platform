"""燃費最適化サービス.

航海データ (距離 / 速度 / 積載量 / 海象) から最小燃費となる速度を推定する。

シンプル消費モデル:
    fuel(L) = α * distance_nm + β * speed_knots^3 * (distance_nm / speed_knots)
            + γ * sea_state * distance_nm + δ * cargo_tons * distance_nm

    = α * D + β * D * v^2 + γ * S * D + δ * C * D

ここで「v^3 * (D / v) = D * v^2」は航走時間あたり馬力 ∝ v^3 を距離コスト化したもの。
履歴データがあれば scikit-learn 線形回帰でα,β,γ,δを学習。
データが少ない / scikit-learn 未インストール時は既定係数を使う。

最適化:
    L/NM = α + β * v^2 + γ * S + δ * C  → v に関しては monotonic 増 (β > 0)
ただし「移送 (時間) コスト」を考慮するため、目的関数を
    F(v) = α + β * v^2 + γ * S + δ * C + λ / v   (時間ペナルティ)
とする。F'(v) = 2β v - λ / v^2 = 0 → v* = (λ / (2β))^(1/3)
"""
from __future__ import annotations

import logging
from collections.abc import Sequence
from dataclasses import dataclass

LOG = logging.getLogger(__name__)


# 既定係数 (履歴データ不足時のフォールバック)
DEFAULT_ALPHA = 1.0       # 距離あたり固定消費 (L/NM)
DEFAULT_BETA = 0.002      # 速度二乗あたり (L/NM/(kn^2))
DEFAULT_GAMMA = 0.3       # 海象ステート (波高 m あたり L/NM)
DEFAULT_DELTA = 0.0005    # 積載量 t あたり L/NM
DEFAULT_LAMBDA = 8.0      # 時間ペナルティ (L/NM ・kn) — 経済巡航 ~ 12kn 付近を狙う


@dataclass(frozen=True)
class FuelModel:
    alpha: float = DEFAULT_ALPHA
    beta: float = DEFAULT_BETA
    gamma: float = DEFAULT_GAMMA
    delta: float = DEFAULT_DELTA
    time_lambda: float = DEFAULT_LAMBDA
    source: str = "DEFAULT"  # "DEFAULT" / "LR" (Linear Regression)

    def consumption_per_nm(
        self, speed_knots: float, sea_state: float, cargo_tons: float
    ) -> float:
        """ある条件における L/NM を返す."""
        return (
            self.alpha
            + self.beta * (speed_knots ** 2)
            + self.gamma * sea_state
            + self.delta * cargo_tons
        )

    def total_consumption(
        self,
        distance_nm: float,
        speed_knots: float,
        sea_state: float,
        cargo_tons: float,
    ) -> float:
        return self.consumption_per_nm(speed_knots, sea_state, cargo_tons) * distance_nm


@dataclass(frozen=True)
class OptimizationResult:
    optimal_speed_knots: float
    consumption_per_nm: float
    total_fuel_liters: float
    travel_hours: float
    model_source: str
    co2_kg: float


@dataclass(frozen=True)
class HistoricalSample:
    """過去の航海 1 件分 (回帰学習用)."""

    distance_nm: float
    speed_knots: float
    sea_state: float
    cargo_tons: float
    fuel_liters: float


def train_model(samples: Sequence[HistoricalSample]) -> FuelModel:
    """履歴データから線形回帰で係数を学習する.

    特徴量: [distance, distance * speed^2, distance * sea_state, distance * cargo]
    目的変数: fuel_liters
    切片なしのモデルでフィット。
    """
    if len(samples) < 4:
        return FuelModel()
    try:
        import numpy as np
        from sklearn.linear_model import LinearRegression
    except Exception as e:
        LOG.info("sklearn unavailable, using default coefficients: %s", e)
        return FuelModel()

    X = np.array(
        [
            [
                s.distance_nm,
                s.distance_nm * s.speed_knots ** 2,
                s.distance_nm * s.sea_state,
                s.distance_nm * s.cargo_tons,
            ]
            for s in samples
        ]
    )
    y = np.array([s.fuel_liters for s in samples])
    try:
        reg = LinearRegression(fit_intercept=False, positive=True).fit(X, y)
        coefs = reg.coef_
        return FuelModel(
            alpha=float(max(coefs[0], 0.01)),
            beta=float(max(coefs[1], 1e-5)),
            gamma=float(max(coefs[2], 0.0)),
            delta=float(max(coefs[3], 0.0)),
            time_lambda=DEFAULT_LAMBDA,
            source="LR",
        )
    except Exception as e:  # pragma: no cover
        LOG.warning("LinearRegression failed: %s", e)
        return FuelModel()


def optimize_speed(
    *,
    distance_nm: float,
    sea_state: float,
    cargo_tons: float,
    model: FuelModel | None = None,
    min_speed_knots: float = 6.0,
    max_speed_knots: float = 18.0,
    co2_factor: float = 3.06,
) -> OptimizationResult:
    """最適速度を計算する.

    解析解: v* = (λ / (2β))^(1/3)
    その値を [min, max] にクリップして返す。
    """
    if distance_nm <= 0:
        raise ValueError("distance_nm must be positive")
    if sea_state < 0:
        raise ValueError("sea_state must be non-negative")
    if cargo_tons < 0:
        raise ValueError("cargo_tons must be non-negative")
    if min_speed_knots <= 0 or max_speed_knots <= min_speed_knots:
        raise ValueError("invalid speed range")

    m = model or FuelModel()
    # 解析的最適点 (時間ペナルティを含めた目的関数の極小)
    v_star = (m.time_lambda / (2 * m.beta)) ** (1.0 / 3.0)
    v_opt = max(min_speed_knots, min(max_speed_knots, v_star))

    lpnm = m.consumption_per_nm(v_opt, sea_state, cargo_tons)
    total = lpnm * distance_nm
    hours = distance_nm / v_opt
    co2 = total * co2_factor

    return OptimizationResult(
        optimal_speed_knots=round(v_opt, 2),
        consumption_per_nm=round(lpnm, 3),
        total_fuel_liters=round(total, 1),
        travel_hours=round(hours, 2),
        model_source=m.source,
        co2_kg=round(co2, 1),
    )
