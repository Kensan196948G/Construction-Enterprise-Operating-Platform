"""Critical Path Method 単体テスト.

教科書的サンプル: PMBOK でよく出る 5 タスクのネットワーク。

  A (3) ─┬─> B (2) ──> D (4) ─┐
         └─> C (5) ──────────┴─> E (1)

期待:
  A: ES=0, EF=3
  B: ES=3, EF=5
  C: ES=3, EF=8
  D: ES=5, EF=9   (B 経由)
  E: ES=9, EF=10  (D の方が遅いので C(8) vs D(9) -> 9)
  Project duration = 10
  Critical path: A -> C -> ? E は 9 で開始しなければならない。
    -> 実際の CPM では A(3)->C(5)->E(1) = 9 ではない。
       しかし E は D の終了 9 を待つ → ES(E)=9
       LS(C) = LS(E) - duration(C) = 9 - 5 = 4 → C は 1日遅らせられる → Slack=1
       LS(B) = LS(D) - 2 = 5 - 2 = 3 → B Slack=0
       LS(D) = LS(E) - 4 = 9 - 4 = 5 → D Slack=0
       LS(A) = 0 → A Slack=0
       LS(E) = 9, LF(E)=10 → E Slack=0
  Critical path: A -> B -> D -> E (slack=0)
"""
from __future__ import annotations

from site_api.services.critical_path import CPMTask, compute_cpm


def test_simple_chain() -> None:
    """直列 3 タスク: 全てクリティカル."""
    tasks = [
        CPMTask("A", 2),
        CPMTask("B", 3, ("A",)),
        CPMTask("C", 1, ("B",)),
    ]
    res = compute_cpm(tasks)
    assert res.duration == 6
    assert res.critical_path == ["A", "B", "C"]
    by_id = {t.id: t for t in res.tasks}
    assert by_id["A"].es == 0 and by_id["A"].ef == 2
    assert by_id["B"].es == 2 and by_id["B"].ef == 5
    assert by_id["C"].es == 5 and by_id["C"].ef == 6
    for t in res.tasks:
        assert t.slack == 0
        assert t.is_critical


def test_textbook_diamond() -> None:
    """ダイヤモンド型ネットワーク (PMBOK 風)."""
    tasks = [
        CPMTask("A", 3),
        CPMTask("B", 2, ("A",)),
        CPMTask("C", 5, ("A",)),
        CPMTask("D", 4, ("B",)),
        CPMTask("E", 1, ("C", "D")),
    ]
    res = compute_cpm(tasks)
    by_id = {t.id: t for t in res.tasks}

    assert by_id["A"].es == 0 and by_id["A"].ef == 3
    assert by_id["B"].es == 3 and by_id["B"].ef == 5
    assert by_id["C"].es == 3 and by_id["C"].ef == 8
    assert by_id["D"].es == 5 and by_id["D"].ef == 9
    assert by_id["E"].es == 9 and by_id["E"].ef == 10
    assert res.duration == 10

    # C は Slack = 1 (LS=4, ES=3)
    assert by_id["C"].slack == 1
    assert not by_id["C"].is_critical

    # critical path
    assert res.critical_path == ["A", "B", "D", "E"]
    for tid in ["A", "B", "D", "E"]:
        assert by_id[tid].slack == 0
        assert by_id[tid].is_critical


def test_empty_input() -> None:
    res = compute_cpm([])
    assert res.duration == 0
    assert res.tasks == []
    assert res.critical_path == []


def test_parallel_tasks_with_slack() -> None:
    """並列 2 タスク (片方短い) → 短い方に slack."""
    tasks = [
        CPMTask("Start", 1),
        CPMTask("Long", 5, ("Start",)),
        CPMTask("Short", 2, ("Start",)),
        CPMTask("End", 1, ("Long", "Short")),
    ]
    res = compute_cpm(tasks)
    by_id = {t.id: t for t in res.tasks}
    assert res.duration == 7
    assert by_id["Long"].slack == 0
    assert by_id["Short"].slack == 3
    assert by_id["Short"].is_critical is False
    assert res.critical_path == ["Start", "Long", "End"]


def test_cycle_raises() -> None:
    import pytest

    tasks = [
        CPMTask("A", 1, ("B",)),
        CPMTask("B", 1, ("A",)),
    ]
    with pytest.raises(ValueError):
        compute_cpm(tasks)
