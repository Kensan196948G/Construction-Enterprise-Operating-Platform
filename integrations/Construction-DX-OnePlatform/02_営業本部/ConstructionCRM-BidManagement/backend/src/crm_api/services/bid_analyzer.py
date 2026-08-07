"""入札分析サービス (Loop #6 詳細実装).

- 落札率 (won / total) (期間別/発注者別/工種別)
- 競合分析: top 5 競合社 + 各社平均落札率
- 予定価格逸脱率: (落札額 - 予定価格) / 予定価格
- 価格戦略分析: 入札額の予定価格比でクラス分け (高入札 / 中位 / 安価) し
  クラス毎の勝率分布を返す。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class BidAnalysisInput:
    """単一入札の集計入力."""

    bid_id: int
    result: str  # won|lost|cancel|pending
    bid_price: Decimal | None
    estimated_price: Decimal | None
    winner_name: str | None
    award_price: Decimal | None = None
    issuer_name: str | None = None
    work_category: str | None = None
    bid_date: date | None = None


@dataclass(frozen=True)
class CompetitorStat:
    name: str
    wins: int
    win_rate: Decimal  # その競合社が含まれる lost 件中の落札率


@dataclass(frozen=True)
class GroupStat:
    key: str
    total: int
    won: int
    win_rate: Decimal


@dataclass(frozen=True)
class StrategyStat:
    tier: str  # "high" | "mid" | "low"
    count: int
    won: int
    win_rate: Decimal


@dataclass(frozen=True)
class BidAnalysisResult:
    total_count: int
    won_count: int
    lost_count: int
    win_rate: Decimal  # 0.0-1.0
    average_price_gap_ratio: Decimal | None  # (estimated - bid) / estimated
    average_award_deviation_ratio: Decimal | None  # (award - estimated) / estimated
    top_competitors: list[tuple[str, int]]  # 後方互換
    competitor_stats: list[CompetitorStat] = field(default_factory=list)
    by_issuer: list[GroupStat] = field(default_factory=list)
    by_work_category: list[GroupStat] = field(default_factory=list)
    by_period: list[GroupStat] = field(default_factory=list)  # YYYY-MM
    strategy_distribution: list[StrategyStat] = field(default_factory=list)


def _group_win_rate(
    records: list[BidAnalysisInput], key_fn
) -> list[GroupStat]:
    bucket: dict[str, dict[str, int]] = {}
    for r in records:
        if r.result in ("cancel", "pending"):
            continue
        k = key_fn(r)
        if k is None:
            continue
        slot = bucket.setdefault(str(k), {"total": 0, "won": 0})
        slot["total"] += 1
        if r.result == "won":
            slot["won"] += 1
    out: list[GroupStat] = []
    for k, v in bucket.items():
        total = v["total"]
        won = v["won"]
        rate = Decimal(won) / Decimal(total) if total else Decimal("0")
        out.append(GroupStat(key=k, total=total, won=won, win_rate=rate))
    return sorted(out, key=lambda g: (-g.total, g.key))


def _strategy_distribution(records: list[BidAnalysisInput]) -> list[StrategyStat]:
    """予定価格比による戦略分析.

    - high: bid/estimated > 0.95
    - mid:  0.85 <= bid/estimated <= 0.95
    - low:  bid/estimated < 0.85
    """
    tiers = {"high": {"count": 0, "won": 0}, "mid": {"count": 0, "won": 0}, "low": {"count": 0, "won": 0}}
    for r in records:
        if r.result in ("cancel", "pending"):
            continue
        if r.bid_price is None or not r.estimated_price or r.estimated_price <= 0:
            continue
        ratio = r.bid_price / r.estimated_price
        if ratio > Decimal("0.95"):
            tier = "high"
        elif ratio >= Decimal("0.85"):
            tier = "mid"
        else:
            tier = "low"
        tiers[tier]["count"] += 1
        if r.result == "won":
            tiers[tier]["won"] += 1
    return [
        StrategyStat(
            tier=name,
            count=v["count"],
            won=v["won"],
            win_rate=(Decimal(v["won"]) / Decimal(v["count"])) if v["count"] else Decimal("0"),
        )
        for name, v in tiers.items()
    ]


def _competitor_stats(records: list[BidAnalysisInput]) -> list[CompetitorStat]:
    wins: dict[str, int] = {}
    appearances: dict[str, int] = {}
    for r in records:
        if r.result in ("cancel", "pending"):
            continue
        if not r.winner_name:
            continue
        appearances[r.winner_name] = appearances.get(r.winner_name, 0) + 1
        if r.result == "lost":  # 我々が負けて競合が勝った
            wins[r.winner_name] = wins.get(r.winner_name, 0) + 1
    out: list[CompetitorStat] = []
    for name, n_appear in appearances.items():
        w = wins.get(name, 0)
        rate = Decimal(w) / Decimal(n_appear) if n_appear else Decimal("0")
        out.append(CompetitorStat(name=name, wins=w, win_rate=rate))
    return sorted(out, key=lambda c: -c.wins)[:5]


def analyze(records: list[BidAnalysisInput]) -> BidAnalysisResult:
    """入札記録を集計する."""
    total = 0
    won = 0
    lost = 0
    ratios: list[Decimal] = []
    award_devs: list[Decimal] = []
    competitor_wins: dict[str, int] = {}

    for r in records:
        if r.result == "cancel" or r.result == "pending":
            continue
        total += 1
        if r.result == "won":
            won += 1
        elif r.result == "lost":
            lost += 1

        if r.bid_price is not None and r.estimated_price and r.estimated_price > 0:
            gap = (r.estimated_price - r.bid_price) / r.estimated_price
            ratios.append(gap)

        if (
            r.award_price is not None
            and r.estimated_price
            and r.estimated_price > 0
        ):
            dev = (r.award_price - r.estimated_price) / r.estimated_price
            award_devs.append(dev)

        if r.result == "lost" and r.winner_name:
            competitor_wins[r.winner_name] = competitor_wins.get(r.winner_name, 0) + 1

    win_rate = Decimal(won) / Decimal(total) if total > 0 else Decimal("0")
    avg_ratio: Decimal | None = (
        (sum(ratios, Decimal("0")) / Decimal(len(ratios))) if ratios else None
    )
    avg_award_dev: Decimal | None = (
        (sum(award_devs, Decimal("0")) / Decimal(len(award_devs))) if award_devs else None
    )
    top = sorted(competitor_wins.items(), key=lambda x: x[1], reverse=True)[:5]

    by_issuer = _group_win_rate(records, lambda r: r.issuer_name)
    by_work = _group_win_rate(records, lambda r: r.work_category)
    by_period = _group_win_rate(
        records, lambda r: r.bid_date.strftime("%Y-%m") if r.bid_date else None
    )
    strategy = _strategy_distribution(records)
    comp_stats = _competitor_stats(records)

    return BidAnalysisResult(
        total_count=total,
        won_count=won,
        lost_count=lost,
        win_rate=win_rate,
        average_price_gap_ratio=avg_ratio,
        average_award_deviation_ratio=avg_award_dev,
        top_competitors=top,
        competitor_stats=comp_stats,
        by_issuer=by_issuer,
        by_work_category=by_work,
        by_period=by_period,
        strategy_distribution=strategy,
    )
