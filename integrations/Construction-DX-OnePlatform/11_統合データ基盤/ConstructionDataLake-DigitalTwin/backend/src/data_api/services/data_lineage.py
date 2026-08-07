"""Data lineage tracking (source → transform → output).

Stores a graph of nodes (sources / lake tables / analytics datasets) and edges
(produced_by / transformed_by). Lightweight in-memory implementation suitable
for skeleton + tests. In production this is backed by `t_data_lineage_edge`.
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field


@dataclass(frozen=True)
class LineageNode:
    node_id: str          # unique key, e.g. "source:01_construction.projects"
    kind: str             # source | table | dataset | model
    label: str


@dataclass(frozen=True)
class LineageEdge:
    src: str
    dst: str
    op: str = "transform"  # transform | load | derive


@dataclass
class LineageGraph:
    nodes: dict[str, LineageNode] = field(default_factory=dict)
    edges: list[LineageEdge] = field(default_factory=list)

    def add_node(self, node: LineageNode) -> None:
        self.nodes[node.node_id] = node

    def add_edge(self, src: str, dst: str, op: str = "transform") -> None:
        if src not in self.nodes or dst not in self.nodes:
            raise KeyError(f"node missing for edge {src} -> {dst}")
        self.edges.append(LineageEdge(src=src, dst=dst, op=op))

    def upstream(self, node_id: str) -> list[str]:
        return [e.src for e in self.edges if e.dst == node_id]

    def downstream(self, node_id: str) -> list[str]:
        return [e.dst for e in self.edges if e.src == node_id]

    def trace_to_sources(self, node_id: str) -> list[str]:
        """BFS upstream until nodes have no parent. Returns source-side leaves."""
        if node_id not in self.nodes:
            raise KeyError(node_id)
        visited: set[str] = set()
        frontier = [node_id]
        leaves: list[str] = []
        while frontier:
            current = frontier.pop()
            if current in visited:
                continue
            visited.add(current)
            parents = self.upstream(current)
            if not parents:
                if current != node_id:
                    leaves.append(current)
            else:
                frontier.extend(parents)
        return sorted(set(leaves))

    def to_dict(self) -> dict:
        return {
            "nodes": [n.__dict__ for n in self.nodes.values()],
            "edges": [e.__dict__ for e in self.edges],
        }


def build_default_lineage(extra_pairs: Iterable[tuple[str, str]] | None = None) -> LineageGraph:
    """Build a representative lineage graph spanning major source systems."""
    g = LineageGraph()
    sources = [
        ("source:04_construction.projects", "施工管理: 工事マスタ"),
        ("source:06_safety.records", "安全品質: ヒヤリハット"),
        ("source:07_hr.employees", "管理本部: 従業員"),
        ("source:02_sales.opportunities", "営業: 案件"),
        ("source:09_marine.vessels", "船舶: AIS"),
    ]
    for nid, label in sources:
        g.add_node(LineageNode(node_id=nid, kind="source", label=label))

    g.add_node(LineageNode(node_id="table:stg_projects", kind="table", label="stg_projects (raw)"))
    g.add_node(LineageNode(node_id="table:fct_project_summary", kind="table", label="fct_project_summary (curated)"))
    g.add_node(LineageNode(node_id="dataset:exec_dashboard", kind="dataset", label="経営ダッシュボード"))

    g.add_edge("source:04_construction.projects", "table:stg_projects", op="load")
    g.add_edge("table:stg_projects", "table:fct_project_summary", op="transform")
    g.add_edge("source:06_safety.records", "table:fct_project_summary", op="transform")
    g.add_edge("table:fct_project_summary", "dataset:exec_dashboard", op="derive")

    if extra_pairs:
        for src, dst in extra_pairs:
            if src in g.nodes and dst in g.nodes:
                g.add_edge(src, dst)
    return g
