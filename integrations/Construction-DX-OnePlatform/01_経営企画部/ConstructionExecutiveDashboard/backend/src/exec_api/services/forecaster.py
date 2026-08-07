"""AI 予測サービス.

- Prophet による時系列予測 (利益率/受注高など)
- scikit-learn による分類 (赤字案件予測 / 工期遅延予測 / 人材不足予測)

Prophet が import 失敗または学習データが極端に少ない場合はナイーブな
線形外挿にフォールバックする (CI 環境/未学習時の安全網)。
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any

log = logging.getLogger(__name__)

try:  # Prophet は重量級 -- 任意依存にする
    from prophet import Prophet  # type: ignore[import-not-found]

    _HAS_PROPHET = True
except Exception as _e:  # pragma: no cover
    log.info("Prophet 未利用 (フォールバック): %s", _e)
    _HAS_PROPHET = False

try:
    import numpy as np
    from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier

    _HAS_SKLEARN = True
except Exception as _e:  # pragma: no cover
    log.info("scikit-learn 未利用 (フォールバック): %s", _e)
    _HAS_SKLEARN = False


@dataclass(frozen=True)
class TimeseriesPoint:
    ds: date
    y: float


@dataclass(frozen=True)
class ForecastPoint:
    ds: date
    yhat: float
    yhat_lower: float
    yhat_upper: float


@dataclass(frozen=True)
class ForecastOutput:
    target_metric: str
    model_name: str
    horizon_days: int
    confidence_interval: float
    predictions: list[ForecastPoint]
    summary: str = ""
    risk_score: float | None = None
    feature_importance: dict[str, float] = field(default_factory=dict)


def _naive_linear_extrapolation(
    points: list[TimeseriesPoint],
    horizon_days: int,
    target_metric: str,
    confidence_interval: float,
) -> ForecastOutput:
    """学習データ不足時の最小フォールバック."""
    if not points:
        return ForecastOutput(
            target_metric=target_metric,
            model_name="naive",
            horizon_days=horizon_days,
            confidence_interval=confidence_interval,
            predictions=[],
            summary="No historical data; forecast skipped.",
        )
    ys = [p.y for p in points]
    base = sum(ys) / len(ys)
    if len(ys) >= 2:
        slope = (ys[-1] - ys[0]) / max(len(ys) - 1, 1)
    else:
        slope = 0.0
    last_ds = points[-1].ds
    spread = max(abs(base) * (1 - confidence_interval), 1.0)
    preds = []
    for i in range(1, horizon_days + 1):
        ds = last_ds + timedelta(days=i)
        yhat = ys[-1] + slope * i
        preds.append(ForecastPoint(ds=ds, yhat=yhat, yhat_lower=yhat - spread, yhat_upper=yhat + spread))
    return ForecastOutput(
        target_metric=target_metric,
        model_name="naive",
        horizon_days=horizon_days,
        confidence_interval=confidence_interval,
        predictions=preds,
        summary=f"naive-linear (slope={slope:.4f}, base={base:.4f})",
    )


def forecast_timeseries(
    points: list[TimeseriesPoint],
    target_metric: str,
    horizon_days: int = 90,
    confidence_interval: float = 0.8,
    *,
    freq: str = "D",
) -> ForecastOutput:
    """時系列を Prophet で予測, 失敗時は naive にフォールバック.

    Args:
        points: 履歴データ (ds=date, y=float)
        target_metric: メトリック名
        horizon_days: 予測ステップ数 (freq に依存)
        confidence_interval: 信頼区間 (0..1). 95% なら 0.95
        freq: 予測粒度 ("D"=日, "MS"=月初). 月次予測には "MS" を渡す。
    """
    if not _HAS_PROPHET or len(points) < 5:
        return _naive_linear_extrapolation(points, horizon_days, target_metric, confidence_interval)
    try:
        import pandas as pd  # type: ignore[import-not-found]

        df = pd.DataFrame([{"ds": p.ds, "y": p.y} for p in points])
        m = Prophet(
            interval_width=confidence_interval,
            daily_seasonality=False,
            weekly_seasonality=False,
            yearly_seasonality=(freq == "MS"),
        )
        m.fit(df)
        future = m.make_future_dataframe(periods=horizon_days, freq=freq)
        fc = m.predict(future).tail(horizon_days)
        preds = [
            ForecastPoint(
                ds=row.ds.date() if hasattr(row.ds, "date") else row.ds,
                yhat=float(row.yhat),
                yhat_lower=float(row.yhat_lower),
                yhat_upper=float(row.yhat_upper),
            )
            for row in fc.itertuples(index=False)
        ]
        return ForecastOutput(
            target_metric=target_metric,
            model_name="prophet",
            horizon_days=horizon_days,
            confidence_interval=confidence_interval,
            predictions=preds,
            summary=f"prophet trained on {len(points)} points (freq={freq})",
        )
    except Exception as e:  # pragma: no cover - 学習例外時の安全網
        log.warning("Prophet failed (%s); fallback to naive.", e)
        return _naive_linear_extrapolation(points, horizon_days, target_metric, confidence_interval)


def forecast_monthly(
    points: list[TimeseriesPoint],
    target_metric: str,
    horizon_months: int = 12,
    confidence_interval: float = 0.95,
) -> ForecastOutput:
    """月次時系列を Prophet で 12ヶ月先まで予測 (95% CI 既定).

    入力は月次粒度の TimeseriesPoint を想定。Prophet 未導入 / 履歴 5 未満なら
    naive にフォールバックする (この場合 ds は ``points[-1].ds`` から月単位で増加)。
    """
    if not _HAS_PROPHET or len(points) < 5:
        # naive: 月単位で外挿. timedelta(days=30) で月を模擬。
        if not points:
            return _naive_linear_extrapolation(points, horizon_months, target_metric, confidence_interval)
        ys = [p.y for p in points]
        base = sum(ys) / len(ys)
        slope = (ys[-1] - ys[0]) / max(len(ys) - 1, 1) if len(ys) >= 2 else 0.0
        last = points[-1].ds
        spread = max(abs(base) * (1 - confidence_interval), 1.0)
        preds = []
        for i in range(1, horizon_months + 1):
            ds = last + timedelta(days=30 * i)
            yhat = ys[-1] + slope * i
            preds.append(ForecastPoint(ds=ds, yhat=yhat, yhat_lower=yhat - spread, yhat_upper=yhat + spread))
        return ForecastOutput(
            target_metric=target_metric,
            model_name="naive-monthly",
            horizon_days=horizon_months,
            confidence_interval=confidence_interval,
            predictions=preds,
            summary=f"naive-monthly (slope={slope:.4f}, base={base:.4f})",
        )
    return forecast_timeseries(
        points, target_metric, horizon_months, confidence_interval, freq="MS",
    )


@dataclass(frozen=True)
class ProjectFeatureRow:
    """工事案件の特徴量 (赤字予測 / 遅延予測 / 人材不足予測共通)."""

    project_id: int
    contract_amount: float
    cost_progress_ratio: float  # 0..1
    schedule_progress_ratio: float  # 0..1
    labor_shortage_ratio: float  # 0..1 (要員不足度合い)
    weather_risk_score: float  # 0..1
    label: int | None = None  # 教師ラベル (学習用)


def predict_deficit_projects(
    train: list[ProjectFeatureRow],
    predict: list[ProjectFeatureRow],
) -> list[tuple[int, float]]:
    """赤字案件予測 (Gradient Boosting). ラベル無し時はルール採点."""
    if not predict:
        return []
    if _HAS_SKLEARN and len([r for r in train if r.label is not None]) >= 10:
        X = np.array([[r.contract_amount, r.cost_progress_ratio,
                       r.schedule_progress_ratio, r.labor_shortage_ratio,
                       r.weather_risk_score] for r in train])
        y = np.array([r.label for r in train])
        clf = GradientBoostingClassifier(random_state=42)
        clf.fit(X, y)
        Xp = np.array([[r.contract_amount, r.cost_progress_ratio,
                        r.schedule_progress_ratio, r.labor_shortage_ratio,
                        r.weather_risk_score] for r in predict])
        proba = clf.predict_proba(Xp)[:, 1]
        return [(r.project_id, float(p)) for r, p in zip(predict, proba, strict=True)]
    # ルールベースフォールバック: 原価進捗が工期進捗を大きく上回ると赤字リスク
    out: list[tuple[int, float]] = []
    for r in predict:
        risk = max(0.0, r.cost_progress_ratio - r.schedule_progress_ratio)
        risk = min(1.0, risk * 2 + r.labor_shortage_ratio * 0.3 + r.weather_risk_score * 0.2)
        out.append((r.project_id, risk))
    return out


def predict_schedule_delay(
    train: list[ProjectFeatureRow],
    predict: list[ProjectFeatureRow],
) -> list[tuple[int, float]]:
    """工期遅延予測 (Random Forest)."""
    if not predict:
        return []
    if _HAS_SKLEARN and len([r for r in train if r.label is not None]) >= 10:
        X = np.array([[r.cost_progress_ratio, r.schedule_progress_ratio,
                       r.labor_shortage_ratio, r.weather_risk_score] for r in train])
        y = np.array([r.label for r in train])
        clf = RandomForestClassifier(random_state=42, n_estimators=50)
        clf.fit(X, y)
        Xp = np.array([[r.cost_progress_ratio, r.schedule_progress_ratio,
                        r.labor_shortage_ratio, r.weather_risk_score] for r in predict])
        proba = clf.predict_proba(Xp)[:, 1]
        return [(r.project_id, float(p)) for r, p in zip(predict, proba, strict=True)]
    out: list[tuple[int, float]] = []
    for r in predict:
        gap = max(0.0, r.cost_progress_ratio - r.schedule_progress_ratio)
        risk = min(1.0, gap + r.labor_shortage_ratio * 0.5 + r.weather_risk_score * 0.3)
        out.append((r.project_id, risk))
    return out


def predict_workforce_shortage(
    headcount_demand: list[tuple[date, int]],
    headcount_supply: list[tuple[date, int]],
) -> list[dict[str, Any]]:
    """技術者需給ギャップを簡易計算. 不足量と不足率を返す."""
    supply_map = {d: c for d, c in headcount_supply}
    out: list[dict[str, Any]] = []
    for d, demand in headcount_demand:
        supply = supply_map.get(d, 0)
        gap = max(0, demand - supply)
        ratio = (gap / demand) if demand > 0 else 0.0
        out.append({"date": d.isoformat(), "demand": demand, "supply": supply,
                    "gap": gap, "shortage_ratio": ratio})
    return out


def now_utc() -> datetime:
    """現在 UTC (テスト容易化のためモジュール経由)."""
    return datetime.utcnow()
