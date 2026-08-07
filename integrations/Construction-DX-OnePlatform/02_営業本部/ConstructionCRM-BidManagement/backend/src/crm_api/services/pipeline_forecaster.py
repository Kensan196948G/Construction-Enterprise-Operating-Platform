"""受注パイプライン受注予測サービス.

Loop #6 詳細実装:
- データ点 >= 5 かつ Prophet 利用可能なら Prophet で月次トレンド予測
- データ点 >= 5 かつ Prophet 不可で scikit-learn 利用可能なら線形回帰 fallback
- それ未満は weighted average fallback (旧 stub 実装)

出力:
- 月次バケット (期待値 + 95% 信頼区間)
- 失注リスクスコア (個別案件) と全体平均
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    pass


@dataclass(frozen=True)
class OpportunityForecastInput:
    """フォーキャスタ入力."""

    opportunity_id: int
    win_probability: Decimal  # 0-100
    expected_amount: Decimal  # 円
    expected_close_date: date | None
    stage: str = "qualified"


@dataclass(frozen=True)
class ForecastBucket:
    """期間バケットごとの集計."""

    period: str  # YYYY-MM
    opportunity_count: int
    gross_amount: Decimal  # 単純合計
    weighted_amount: Decimal  # 確度加重合計 (期待値)
    lower_bound: Decimal | None = None  # 95% 下限
    upper_bound: Decimal | None = None  # 95% 上限


@dataclass(frozen=True)
class OpportunityRiskScore:
    opportunity_id: int
    risk_score: Decimal  # 0.0-1.0 (高いほど失注リスク)


@dataclass(frozen=True)
class ForecastResult:
    total_count: int
    total_gross_amount: Decimal
    total_weighted_amount: Decimal
    buckets: list[ForecastBucket]
    model_used: str = "weighted_average"  # "prophet" | "sklearn" | "weighted_average"
    average_risk_score: Decimal = Decimal("0")
    risk_scores: list[OpportunityRiskScore] = field(default_factory=list)


def _stage_floor(stage: str) -> Decimal:
    """各段階の最低確度フロア (確度未入力時のフォールバック)."""
    table = {
        "lead": Decimal("10"),
        "qualified": Decimal("25"),
        "proposal": Decimal("50"),
        "bid": Decimal("70"),
        "won": Decimal("100"),
        "lost": Decimal("0"),
    }
    return table.get(stage, Decimal("20"))


def _stage_risk_base(stage: str) -> Decimal:
    """段階ごとの基礎失注リスク (0.0-1.0)."""
    table = {
        "lead": Decimal("0.70"),
        "qualified": Decimal("0.55"),
        "proposal": Decimal("0.40"),
        "bid": Decimal("0.25"),
        "won": Decimal("0.0"),
        "lost": Decimal("1.0"),
    }
    return table.get(stage, Decimal("0.60"))


def _calc_risk_score(opp: OpportunityForecastInput) -> Decimal:
    """個別案件の失注リスクスコア (0.0-1.0).

    確度が高いほど低リスク、ステージが後ろほど低リスク。
    score = 0.6 * (1 - prob/100) + 0.4 * stage_base
    """
    prob = opp.win_probability if opp.win_probability > 0 else _stage_floor(opp.stage)
    prob_term = (Decimal("100") - prob) / Decimal("100")
    stage_term = _stage_risk_base(opp.stage)
    score = Decimal("0.6") * prob_term + Decimal("0.4") * stage_term
    if score < Decimal("0"):
        return Decimal("0")
    if score > Decimal("1"):
        return Decimal("1")
    return score.quantize(Decimal("0.0001"))


def _bucket_weighted_average(
    opportunities: list[OpportunityForecastInput],
) -> tuple[
    list[ForecastBucket], Decimal, Decimal, int, list[OpportunityRiskScore], Decimal
]:
    """単純加重平均でバケット集計 (旧実装相当)."""
    buckets: dict[str, dict[str, Decimal | int]] = {}
    total_gross = Decimal("0")
    total_weighted = Decimal("0")
    total_count = 0
    risks: list[OpportunityRiskScore] = []
    risk_sum = Decimal("0")
    risk_n = 0

    for opp in opportunities:
        risk = _calc_risk_score(opp)
        risks.append(OpportunityRiskScore(opportunity_id=opp.opportunity_id, risk_score=risk))
        if opp.stage != "lost":
            risk_sum += risk
            risk_n += 1
        if opp.stage == "lost":
            continue
        prob = opp.win_probability if opp.win_probability > 0 else _stage_floor(opp.stage)
        weight = prob / Decimal("100")
        weighted = (opp.expected_amount or Decimal("0")) * weight
        period = (
            opp.expected_close_date.strftime("%Y-%m") if opp.expected_close_date else "未定"
        )

        if period not in buckets:
            buckets[period] = {"count": 0, "gross": Decimal("0"), "weighted": Decimal("0")}
        bucket = buckets[period]
        bucket["count"] = int(bucket["count"]) + 1
        bucket["gross"] = Decimal(bucket["gross"]) + (opp.expected_amount or Decimal("0"))
        bucket["weighted"] = Decimal(bucket["weighted"]) + weighted

        total_count += 1
        total_gross += opp.expected_amount or Decimal("0")
        total_weighted += weighted

    result_buckets = sorted(
        [
            ForecastBucket(
                period=p,
                opportunity_count=int(b["count"]),
                gross_amount=Decimal(b["gross"]),
                weighted_amount=Decimal(b["weighted"]),
            )
            for p, b in buckets.items()
        ],
        key=lambda x: x.period,
    )
    avg_risk = (risk_sum / Decimal(risk_n)) if risk_n > 0 else Decimal("0")
    return result_buckets, total_gross, total_weighted, total_count, risks, avg_risk


def _try_prophet_forecast(
    base_buckets: list[ForecastBucket],
) -> list[ForecastBucket] | None:
    """Prophet で月次トレンド予測し、信頼区間を付与する.

    base_buckets の weighted_amount を時系列として渡し、最後の月+3ヶ月先まで
    予測する代わりに、本実装では既存バケットに対して信頼区間 (yhat_lower / upper)
    を付加する形にとどめる。Prophet 不在なら None を返す.
    """
    try:
        import pandas as pd  # type: ignore[import-not-found]
        from prophet import Prophet  # type: ignore[import-not-found]
    except Exception:
        return None

    rows = [b for b in base_buckets if b.period != "未定"]
    if len(rows) < 2:
        return None

    df = pd.DataFrame(
        {
            "ds": [f"{b.period}-01" for b in rows],
            "y": [float(b.weighted_amount) for b in rows],
        }
    )
    try:
        m = Prophet(interval_width=0.95)
        m.fit(df)
        future = m.make_future_dataframe(periods=0, freq="MS")
        fc = m.predict(future)
    except Exception:
        return None

    enriched: list[ForecastBucket] = []
    fc_indexed = {row["ds"].strftime("%Y-%m"): row for _, row in fc.iterrows()}
    for b in base_buckets:
        f = fc_indexed.get(b.period)
        if f is None:
            enriched.append(b)
            continue
        enriched.append(
            ForecastBucket(
                period=b.period,
                opportunity_count=b.opportunity_count,
                gross_amount=b.gross_amount,
                weighted_amount=b.weighted_amount,
                lower_bound=Decimal(str(max(0.0, float(f["yhat_lower"])))),
                upper_bound=Decimal(str(max(0.0, float(f["yhat_upper"])))),
            )
        )
    return enriched


def _try_sklearn_forecast(
    base_buckets: list[ForecastBucket],
) -> list[ForecastBucket] | None:
    """scikit-learn 線形回帰で簡易信頼区間を付加する fallback."""
    try:
        import numpy as np  # type: ignore[import-not-found]
        from sklearn.linear_model import LinearRegression  # type: ignore[import-not-found]
    except Exception:
        return None

    rows = [b for b in base_buckets if b.period != "未定"]
    if len(rows) < 2:
        return None

    X = np.arange(len(rows)).reshape(-1, 1)
    y = np.array([float(b.weighted_amount) for b in rows])
    try:
        model = LinearRegression()
        model.fit(X, y)
        y_pred = model.predict(X)
        residuals = y - y_pred
        # 標本標準偏差 (自由度補正)
        if len(y) > 1:
            std = float(np.std(residuals, ddof=1))
        else:
            std = 0.0
        # 95% 区間 (正規近似)
        half = 1.96 * std
    except Exception:
        return None

    enriched: list[ForecastBucket] = []
    idx = 0
    for b in base_buckets:
        if b.period == "未定":
            enriched.append(b)
            continue
        center = float(y_pred[idx])
        lower = max(0.0, center - half)
        upper = max(0.0, center + half)
        enriched.append(
            ForecastBucket(
                period=b.period,
                opportunity_count=b.opportunity_count,
                gross_amount=b.gross_amount,
                weighted_amount=b.weighted_amount,
                lower_bound=Decimal(str(lower)),
                upper_bound=Decimal(str(upper)),
            )
        )
        idx += 1
    return enriched


def forecast(
    opportunities: list[OpportunityForecastInput],
) -> ForecastResult:
    """受注予測を集計する.

    - 月次バケット (YYYY-MM) に振り分け
    - 確度 (win_probability / 100) を金額に掛けて期待値を算出
    - lost 案件は集計から除外
    - データ点 5 以上なら Prophet -> sklearn の順で信頼区間付与を試行
    """
    (
        base_buckets,
        total_gross,
        total_weighted,
        total_count,
        risks,
        avg_risk,
    ) = _bucket_weighted_average(opportunities)

    model = "weighted_average"
    enriched: list[ForecastBucket] = base_buckets

    if total_count >= 5:
        prophet_result = _try_prophet_forecast(base_buckets)
        if prophet_result is not None:
            enriched = prophet_result
            model = "prophet"
        else:
            sk_result = _try_sklearn_forecast(base_buckets)
            if sk_result is not None:
                enriched = sk_result
                model = "sklearn"

    return ForecastResult(
        total_count=total_count,
        total_gross_amount=total_gross,
        total_weighted_amount=total_weighted,
        buckets=enriched,
        model_used=model,
        average_risk_score=avg_risk.quantize(Decimal("0.0001"))
        if avg_risk
        else Decimal("0"),
        risk_scores=risks,
    )
