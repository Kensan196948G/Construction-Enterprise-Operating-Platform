"""IFC ファイルの拡張パーサ (IFC.js / IfcOpenShell の代替).

骨格段階では Python 標準のみで STEP テキスト (IFC SPF) を解析する。
Loop #6 で以下の詳細抽出を追加:

- IFCBUILDING / IFCBUILDINGSTOREY / IFCSPACE / IFCWALL / IFCSLAB / IFCBEAM / IFCCOLUMN
- 空間階層 (Project -> Site -> Building -> Storey -> Space) のツリー化
- GlobalId / Name / LongName / 位置情報抽出
- 部材数集計, バウンディングボックス計算
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import IO

_ENTITY_LINE = re.compile(r"^#(\d+)\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*;?\s*$", re.IGNORECASE)
_ENTITY_HEAD = re.compile(r"^#(\d+)\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(", re.IGNORECASE)
_CARTESIAN_POINT = re.compile(
    r"IFCCARTESIANPOINT\s*\(\s*\(\s*([\-\d\.eE+]+)\s*,\s*([\-\d\.eE+]+)\s*,\s*([\-\d\.eE+]+)?",
    re.IGNORECASE,
)
_SCHEMA = re.compile(r"FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'", re.IGNORECASE)
_REL_AGG = re.compile(r"IFCRELAGGREGATES", re.IGNORECASE)
_REL_CONTAINED = re.compile(r"IFCRELCONTAINEDINSPATIALSTRUCTURE", re.IGNORECASE)

# IFC 主要部材
_STRUCTURAL_TYPES = {
    "IFCWALL",
    "IFCWALLSTANDARDCASE",
    "IFCSLAB",
    "IFCBEAM",
    "IFCCOLUMN",
    "IFCDOOR",
    "IFCWINDOW",
    "IFCROOF",
    "IFCSTAIR",
    "IFCRAILING",
    "IFCFOOTING",
    "IFCPILE",
}
_SPATIAL_TYPES = {"IFCPROJECT", "IFCSITE", "IFCBUILDING", "IFCBUILDINGSTOREY", "IFCSPACE"}


@dataclass
class BoundingBox:
    min_x: float = 0.0
    min_y: float = 0.0
    min_z: float = 0.0
    max_x: float = 0.0
    max_y: float = 0.0
    max_z: float = 0.0
    valid: bool = False

    def as_dict(self) -> dict[str, float | bool]:
        return {
            "min_x": self.min_x,
            "min_y": self.min_y,
            "min_z": self.min_z,
            "max_x": self.max_x,
            "max_y": self.max_y,
            "max_z": self.max_z,
            "valid": self.valid,
        }


@dataclass
class IfcEntity:
    """IFC エンティティ詳細 (GlobalId / Name / LongName など)."""

    line_id: int
    type_name: str
    global_id: str | None = None
    name: str | None = None
    long_name: str | None = None
    children: list["IfcEntity"] = field(default_factory=list)

    def as_dict(self) -> dict[str, object]:
        return {
            "line_id": self.line_id,
            "type": self.type_name,
            "global_id": self.global_id,
            "name": self.name,
            "long_name": self.long_name,
            "children": [c.as_dict() for c in self.children],
        }


@dataclass
class IfcSummary:
    schema: str | None = None
    entity_total: int = 0
    entity_histogram: dict[str, int] = field(default_factory=dict)
    bbox: BoundingBox = field(default_factory=BoundingBox)
    has_project: bool = False
    has_site: bool = False
    has_building: bool = False
    has_storey: bool = False
    # Loop #6 追加: 詳細
    member_counts: dict[str, int] = field(default_factory=dict)
    hierarchy_tree: list[IfcEntity] = field(default_factory=list)
    spatial_entities: dict[str, list[dict[str, object]]] = field(default_factory=dict)

    def as_dict(self) -> dict[str, object]:
        return {
            "schema": self.schema,
            "entity_total": self.entity_total,
            "entity_histogram": self.entity_histogram,
            "bbox": self.bbox.as_dict(),
            "hierarchy": {
                "has_project": self.has_project,
                "has_site": self.has_site,
                "has_building": self.has_building,
                "has_storey": self.has_storey,
            },
            "member_counts": self.member_counts,
            "hierarchy_tree": [e.as_dict() for e in self.hierarchy_tree],
            "spatial_entities": self.spatial_entities,
        }


_HIER_MARKERS = {
    "IFCPROJECT": "has_project",
    "IFCSITE": "has_site",
    "IFCBUILDING": "has_building",
    "IFCBUILDINGSTOREY": "has_storey",
}


def _split_params(params: str) -> list[str]:
    """IFC エンティティのパラメータを括弧/引用符を考慮して分割する."""
    parts: list[str] = []
    buf: list[str] = []
    depth = 0
    in_str = False
    i = 0
    while i < len(params):
        ch = params[i]
        if in_str:
            buf.append(ch)
            if ch == "'":
                # IFC では '' でエスケープ
                if i + 1 < len(params) and params[i + 1] == "'":
                    buf.append(params[i + 1])
                    i += 2
                    continue
                in_str = False
            i += 1
            continue
        if ch == "'":
            in_str = True
            buf.append(ch)
        elif ch == "(":
            depth += 1
            buf.append(ch)
        elif ch == ")":
            depth -= 1
            buf.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(buf).strip())
            buf = []
        else:
            buf.append(ch)
        i += 1
    if buf:
        parts.append("".join(buf).strip())
    return parts


def _unquote(value: str) -> str | None:
    """IFC 文字列リテラル ('text') をデコードする."""
    v = value.strip()
    if v == "$" or v == "*" or v == "":
        return None
    if v.startswith("'") and v.endswith("'") and len(v) >= 2:
        return v[1:-1].replace("''", "'")
    return v


def _ref(value: str) -> int | None:
    """参照 (#123) を整数 ID に変換する."""
    v = value.strip()
    if v.startswith("#"):
        try:
            return int(v[1:])
        except ValueError:
            return None
    return None


def _refs_in_list(value: str) -> list[int]:
    """(#1, #2, #3) のような参照リストを抽出する."""
    out: list[int] = []
    for token in re.findall(r"#(\d+)", value):
        try:
            out.append(int(token))
        except ValueError:
            continue
    return out


def parse_ifc_text(text: str) -> IfcSummary:
    """STEP テキスト形式 (IFC SPF) を解析して要約を返す."""
    summary = IfcSummary()
    schema_match = _SCHEMA.search(text)
    if schema_match:
        summary.schema = schema_match.group(1)

    min_x = min_y = min_z = float("inf")
    max_x = max_y = max_z = float("-inf")
    saw_point = False

    # 全エンティティを格納 (id -> (type, params))
    entities: dict[int, tuple[str, str]] = {}
    # 詳細エンティティ (空間 + 部材) を保持
    detailed: dict[int, IfcEntity] = {}
    # 関連 (parent_id -> [child_id])
    aggregates: dict[int, list[int]] = {}
    contained: dict[int, list[int]] = {}  # storey -> [elements]

    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("/*"):
            continue
        head = _ENTITY_HEAD.match(line)
        if not head:
            continue
        line_id = int(head.group(1))
        entity = head.group(2).upper()
        # パラメータ部 (最初の "(" の次から末尾 ");" 除去)
        open_idx = line.index("(")
        # 末尾 ");" を取り除く
        tail = line[open_idx + 1 :].rstrip()
        if tail.endswith(";"):
            tail = tail[:-1].rstrip()
        if tail.endswith(")"):
            tail = tail[:-1]
        entities[line_id] = (entity, tail)

        summary.entity_total += 1
        summary.entity_histogram[entity] = summary.entity_histogram.get(entity, 0) + 1
        marker = _HIER_MARKERS.get(entity)
        if marker:
            setattr(summary, marker, True)

        if entity == "IFCCARTESIANPOINT":
            cp = _CARTESIAN_POINT.search(line)
            if cp:
                try:
                    x = float(cp.group(1))
                    y = float(cp.group(2))
                    z = float(cp.group(3)) if cp.group(3) is not None else 0.0
                except ValueError:
                    continue
                saw_point = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                min_z = min(min_z, z)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
                max_z = max(max_z, z)

        if entity in _SPATIAL_TYPES or entity in _STRUCTURAL_TYPES:
            try:
                params = _split_params(tail)
                # 通常 (GlobalId, OwnerHistory, Name, Description, ...)
                global_id = _unquote(params[0]) if len(params) > 0 else None
                name = _unquote(params[2]) if len(params) > 2 else None
                long_name: str | None = None
                # IFCBUILDING/IFCBUILDINGSTOREY/IFCSPACE は LongName を index 7 に含む
                if entity in {"IFCBUILDING", "IFCBUILDINGSTOREY", "IFCSPACE"} and len(params) > 7:
                    long_name = _unquote(params[7])
                detailed[line_id] = IfcEntity(
                    line_id=line_id,
                    type_name=entity,
                    global_id=global_id,
                    name=name,
                    long_name=long_name,
                )
            except Exception:  # pragma: no cover - 防御的
                pass

        if entity == "IFCRELAGGREGATES":
            # (GlobalId, OwnerHistory, Name, Desc, RelatingObject, RelatedObjects)
            try:
                params = _split_params(tail)
                if len(params) >= 6:
                    parent = _ref(params[4])
                    children = _refs_in_list(params[5])
                    if parent is not None:
                        aggregates.setdefault(parent, []).extend(children)
            except Exception:  # pragma: no cover
                pass

        if entity == "IFCRELCONTAINEDINSPATIALSTRUCTURE":
            # (GlobalId, OwnerHistory, Name, Desc, RelatedElements, RelatingStructure)
            try:
                params = _split_params(tail)
                if len(params) >= 6:
                    elements = _refs_in_list(params[4])
                    structure = _ref(params[5])
                    if structure is not None:
                        contained.setdefault(structure, []).extend(elements)
            except Exception:  # pragma: no cover
                pass

    if saw_point:
        summary.bbox = BoundingBox(
            min_x=min_x,
            min_y=min_y,
            min_z=min_z,
            max_x=max_x,
            max_y=max_y,
            max_z=max_z,
            valid=True,
        )

    # 部材数集計
    for member_type in _STRUCTURAL_TYPES:
        cnt = summary.entity_histogram.get(member_type, 0)
        if cnt > 0:
            summary.member_counts[member_type] = cnt

    # 空間エンティティを type ごとにまとめる
    spatial_groups: dict[str, list[dict[str, object]]] = {}
    for ent in detailed.values():
        if ent.type_name in _SPATIAL_TYPES:
            spatial_groups.setdefault(ent.type_name, []).append(
                {
                    "line_id": ent.line_id,
                    "global_id": ent.global_id,
                    "name": ent.name,
                    "long_name": ent.long_name,
                }
            )
    summary.spatial_entities = spatial_groups

    # 階層ツリー構築: IFCPROJECT を根にして IFCRELAGGREGATES で結ぶ
    root_ids = [lid for lid, ent in detailed.items() if ent.type_name == "IFCPROJECT"]
    for rid in root_ids:
        _attach_children(rid, detailed, aggregates, contained, visited=set())
        summary.hierarchy_tree.append(detailed[rid])

    return summary


def _attach_children(
    node_id: int,
    detailed: dict[int, IfcEntity],
    aggregates: dict[int, list[int]],
    contained: dict[int, list[int]],
    visited: set[int],
) -> None:
    if node_id in visited:
        return
    visited.add(node_id)
    node = detailed.get(node_id)
    if node is None:
        return
    # 空間集約
    for child_id in aggregates.get(node_id, []):
        child = detailed.get(child_id)
        if child is None:
            continue
        node.children.append(child)
        _attach_children(child_id, detailed, aggregates, contained, visited)
    # storey に含まれる部材
    for child_id in contained.get(node_id, []):
        child = detailed.get(child_id)
        if child is None:
            continue
        node.children.append(child)
        _attach_children(child_id, detailed, aggregates, contained, visited)


def parse_ifc_stream(stream: IO[bytes], max_bytes: int = 50 * 1024 * 1024) -> IfcSummary:
    """ストリームから IFC を読み取り要約を返す (デフォルト 50MB 上限)."""
    data = stream.read(max_bytes)
    text = data.decode("utf-8", errors="ignore")
    return parse_ifc_text(text)
