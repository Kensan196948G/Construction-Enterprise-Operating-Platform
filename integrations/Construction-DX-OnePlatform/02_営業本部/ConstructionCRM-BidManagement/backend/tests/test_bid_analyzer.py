"""bid_analyzer 単体テスト."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from crm_api.services.bid_analyzer import BidAnalysisInput, analyze


def test_analyze_win_rate_and_competitor_ranking() -> None:
    records = [
        BidAnalysisInput(
            bid_id=1,
            result="won",
            bid_price=Decimal("9500000"),
            estimated_price=Decimal("10000000"),
            winner_name=None,
        ),
        BidAnalysisInput(
            bid_id=2,
            result="lost",
            bid_price=Decimal("9800000"),
            estimated_price=Decimal("10000000"),
            winner_name="他社A",
        ),
        BidAnalysisInput(
            bid_id=3,
            result="lost",
            bid_price=Decimal("9900000"),
            estimated_price=Decimal("10000000"),
            winner_name="他社A",
        ),
        BidAnalysisInput(
            bid_id=4,
            result="cancel",
            bid_price=None,
            estimated_price=None,
            winner_name=None,
        ),
        BidAnalysisInput(
            bid_id=5,
            result="lost",
            bid_price=Decimal("9700000"),
            estimated_price=Decimal("10000000"),
            winner_name="他社B",
        ),
    ]
    r = analyze(records)
    # cancel は除外、4件中 won 1
    assert r.total_count == 4
    assert r.won_count == 1
    assert r.lost_count == 3
    assert r.win_rate == Decimal("0.25")
    # 平均価格差異率: (500k + 200k + 100k + 300k) / 10M / 4 = 0.0275
    assert r.average_price_gap_ratio is not None
    assert round(r.average_price_gap_ratio, 4) == Decimal("0.0275")
    # 競合ランキング: 他社A=2 が首位
    assert r.top_competitors[0] == ("他社A", 2)


def test_analyze_empty_input() -> None:
    r = analyze([])
    assert r.total_count == 0
    assert r.win_rate == Decimal("0")
    assert r.average_price_gap_ratio is None
    assert r.top_competitors == []


def test_analyze_win_rate_by_issuer_and_period() -> None:
    """発注者別/期間別の落札率集計を検証."""
    records = [
        BidAnalysisInput(
            bid_id=1, result="won", bid_price=Decimal("90"),
            estimated_price=Decimal("100"), winner_name=None,
            issuer_name="国交省", bid_date=date(2026, 1, 5),
        ),
        BidAnalysisInput(
            bid_id=2, result="lost", bid_price=Decimal("95"),
            estimated_price=Decimal("100"), winner_name="他社X",
            issuer_name="国交省", bid_date=date(2026, 1, 20),
        ),
        BidAnalysisInput(
            bid_id=3, result="won", bid_price=Decimal("80"),
            estimated_price=Decimal("100"), winner_name=None,
            issuer_name="A市", bid_date=date(2026, 2, 10),
        ),
    ]
    r = analyze(records)
    # 発注者別: 国交省 2件中 1勝 = 0.5、A市 1件中 1勝 = 1.0
    by_issuer = {g.key: g for g in r.by_issuer}
    assert by_issuer["国交省"].win_rate == Decimal("0.5")
    assert by_issuer["A市"].win_rate == Decimal("1")
    # 期間別: 2026-01 0.5, 2026-02 1.0
    by_period = {g.key: g for g in r.by_period}
    assert by_period["2026-01"].total == 2
    assert by_period["2026-02"].total == 1


def test_analyze_competitor_stats_win_rate() -> None:
    """競合社別の勝率 (lost 件数 / 出現件数)."""
    records = [
        BidAnalysisInput(
            bid_id=1, result="lost", bid_price=Decimal("100"),
            estimated_price=Decimal("100"), winner_name="他社A",
        ),
        BidAnalysisInput(
            bid_id=2, result="lost", bid_price=Decimal("100"),
            estimated_price=Decimal("100"), winner_name="他社A",
        ),
        BidAnalysisInput(
            bid_id=3, result="lost", bid_price=Decimal("100"),
            estimated_price=Decimal("100"), winner_name="他社B",
        ),
    ]
    r = analyze(records)
    by_name = {c.name: c for c in r.competitor_stats}
    assert by_name["他社A"].wins == 2
    assert by_name["他社A"].win_rate == Decimal("1")  # 出現2/勝2
    assert by_name["他社B"].wins == 1


def test_analyze_award_deviation_ratio() -> None:
    """予定価格逸脱率 = (落札額 - 予定価格)/予定価格."""
    records = [
        BidAnalysisInput(
            bid_id=1, result="won",
            bid_price=Decimal("9500000"),
            estimated_price=Decimal("10000000"),
            award_price=Decimal("9500000"),
            winner_name=None,
        ),
        BidAnalysisInput(
            bid_id=2, result="lost",
            bid_price=Decimal("9800000"),
            estimated_price=Decimal("10000000"),
            award_price=Decimal("9000000"),
            winner_name="他社A",
        ),
    ]
    r = analyze(records)
    # 平均逸脱率 = ((-500000) + (-1000000)) / 10M / 2 = -0.075
    assert r.average_award_deviation_ratio is not None
    assert round(r.average_award_deviation_ratio, 4) == Decimal("-0.0750")


def test_analyze_strategy_distribution() -> None:
    """価格戦略分析: tier 毎の勝率分布."""
    records = [
        # high (>0.95): bid=98M / est=100M = 0.98, won
        BidAnalysisInput(
            bid_id=1, result="won", bid_price=Decimal("98000000"),
            estimated_price=Decimal("100000000"), winner_name=None,
        ),
        # mid (0.85-0.95): bid=90M / est=100M = 0.9, lost
        BidAnalysisInput(
            bid_id=2, result="lost", bid_price=Decimal("90000000"),
            estimated_price=Decimal("100000000"), winner_name="他社",
        ),
        # mid: bid=88M / est=100M = 0.88, won
        BidAnalysisInput(
            bid_id=3, result="won", bid_price=Decimal("88000000"),
            estimated_price=Decimal("100000000"), winner_name=None,
        ),
        # low (<0.85): bid=70M / est=100M = 0.7, won
        BidAnalysisInput(
            bid_id=4, result="won", bid_price=Decimal("70000000"),
            estimated_price=Decimal("100000000"), winner_name=None,
        ),
    ]
    r = analyze(records)
    tiers = {s.tier: s for s in r.strategy_distribution}
    assert tiers["high"].count == 1 and tiers["high"].won == 1
    assert tiers["mid"].count == 2 and tiers["mid"].won == 1
    assert tiers["mid"].win_rate == Decimal("0.5")
    assert tiers["low"].count == 1 and tiers["low"].won == 1
