"""Critical Path Method (CPM) 計算サービス.

工程タスク (task_id, start, end, predecessor[]) から ES/EF/LS/LF/Slack を算出し、
Slack=0 のチェーンをクリティカルパスとして返却する。

設計:
  - 入力: ``CPMTask`` のリスト (各タスクは duration を持つ)
  - 出力: ``CPMResult`` (各タスクの計算値 + critical_path + total duration)
  - 単位は日 (int)。日付ベース呼び出しは ``compute_from_schedules`` で吸収する。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Iterable


@dataclass(frozen=True)
class CPMTask:
    """CPM 入力タスク."""

    id: str
    duration: int
    predecessors: tuple[str, ...] = ()


@dataclass
class CPMTaskResult:
    id: str
    duration: int
    es: int
    ef: int
    ls: int
    lf: int
    slack: int
    is_critical: bool


@dataclass
class CPMResult:
    tasks: list[CPMTaskResult] = field(default_factory=list)
    critical_path: list[str] = field(default_factory=list)
    duration: int = 0


def _topological_order(tasks: dict[str, CPMTask]) -> list[str]:
    """Kahn のアルゴリズムでトポロジカル順序を返す."""
    indeg: dict[str, int] = {tid: 0 for tid in tasks}
    for t in tasks.values():
        for p in t.predecessors:
            if p in tasks:
                indeg[t.id] += 1
    # 安定順 (id 昇順) で開始ノードを取り出す
    queue: list[str] = sorted([tid for tid, d in indeg.items() if d == 0])
    order: list[str] = []
    # 入次数を copy しながら更新
    remaining = dict(indeg)
    successors: dict[str, list[str]] = {tid: [] for tid in tasks}
    for t in tasks.values():
        for p in t.predecessors:
            if p in successors:
                successors[p].append(t.id)
    while queue:
        n = queue.pop(0)
        order.append(n)
        for s in sorted(successors[n]):
            remaining[s] -= 1
            if remaining[s] == 0:
                queue.append(s)
    if len(order) != len(tasks):
        raise ValueError("schedule contains a cycle")
    return order


def compute_cpm(task_list: Iterable[CPMTask]) -> CPMResult:
    """タスク集合から CPM を計算する."""
    tasks: dict[str, CPMTask] = {t.id: t for t in task_list}
    if not tasks:
        return CPMResult()

    order = _topological_order(tasks)

    es: dict[str, int] = {}
    ef: dict[str, int] = {}
    # Forward pass
    for tid in order:
        t = tasks[tid]
        preds = [p for p in t.predecessors if p in tasks]
        es[tid] = max((ef[p] for p in preds), default=0)
        ef[tid] = es[tid] + t.duration

    project_end = max(ef.values()) if ef else 0

    # Backward pass
    ls: dict[str, int] = {}
    lf: dict[str, int] = {}
    successors: dict[str, list[str]] = {tid: [] for tid in tasks}
    for t in tasks.values():
        for p in t.predecessors:
            if p in successors:
                successors[p].append(t.id)

    for tid in reversed(order):
        t = tasks[tid]
        succs = successors[tid]
        if not succs:
            lf[tid] = project_end
        else:
            lf[tid] = min(ls[s] for s in succs)
        ls[tid] = lf[tid] - t.duration

    results: list[CPMTaskResult] = []
    for tid in order:
        t = tasks[tid]
        slack = ls[tid] - es[tid]
        results.append(
            CPMTaskResult(
                id=tid,
                duration=t.duration,
                es=es[tid],
                ef=ef[tid],
                ls=ls[tid],
                lf=lf[tid],
                slack=slack,
                is_critical=(slack == 0),
            )
        )

    # クリティカルパス: 開始ノードから slack=0 を辿ってチェーンを 1 本構築
    critical_ids = {r.id for r in results if r.is_critical}
    path: list[str] = []
    # 開始候補: critical な中で predecessors が critical でないノード
    start_candidates = [
        r.id
        for r in results
        if r.is_critical
        and not any(p in critical_ids for p in tasks[r.id].predecessors)
    ]
    if start_candidates:
        cur: str | None = sorted(start_candidates)[0]
        while cur is not None:
            path.append(cur)
            nexts = sorted(
                [s for s in successors[cur] if s in critical_ids and es[s] == ef[cur]]
            )
            cur = nexts[0] if nexts else None

    return CPMResult(tasks=results, critical_path=path, duration=project_end)


def compute_from_schedules(rows: Iterable[object]) -> CPMResult:
    """``ScheduleTask`` ORM 行からの薄いアダプタ.

    duration は ``planned_end - planned_start + 1`` (両端含む) で算出。
    日付が無い行はスキップ。predecessor は単一 (predecessor_task_id) のみ。
    """
    cpm_tasks: list[CPMTask] = []
    for r in rows:
        tid = getattr(r, "task_id", None)
        start: date | None = getattr(r, "planned_start", None)
        end: date | None = getattr(r, "planned_end", None)
        pred = getattr(r, "predecessor_task_id", None)
        if tid is None or start is None or end is None:
            continue
        duration = (end - start).days + 1
        if duration < 0:
            duration = 0
        cpm_tasks.append(
            CPMTask(
                id=str(tid),
                duration=duration,
                predecessors=(str(pred),) if pred else (),
            )
        )
    return compute_cpm(cpm_tasks)
