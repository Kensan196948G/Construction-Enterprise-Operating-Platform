"""mocks サーバ ↔ 各部門 API の契約整合チェック (Loop #7).

mocks/main.py の各 ``/api/v1/{dept}/stats`` レスポンス JSON のフィールド名/型と、
各部門 API ルート群 (``<dept>_api/routes/*.py``) で公開されている dashboard 系
エンドポイントに含まれる field 名 (Pydantic モデル / dict literal キー) を
簡易比較する。

注意:
    本スクリプトは **静的ヒューリスティック** であり、import 実行は行わない。
    各部門の Pydantic モデル ``class XxxResponse(BaseModel)`` のフィールド名と、
    mocks の固定 dict の ``kpi`` キーを照合して "ゆるい" 一致を見る。

出力:
    - PASS / WARN / ERROR の 3 段階
    - mocks がカバーしている KPI フィールドのうち、対応する部門 API 実装に
      まったく現れない名前を ERROR (契約乖離) として報告
    - 半数以上カバーされていれば PASS、カバー率 1-49% を WARN
"""

from __future__ import annotations

import ast
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MOCKS_FILE = Path(__file__).resolve().parent / "main.py"

# mocks endpoint <-> 部門 routes ディレクトリ
DEPT_ROUTES: dict[str, Path] = {
    "exec": ROOT / "01_経営企画部" / "ConstructionExecutiveDashboard" / "backend" / "src" / "exec_api" / "routes",
    "crm": ROOT / "02_営業本部" / "ConstructionCRM-BidManagement" / "backend" / "src" / "crm_api" / "routes",
    "solution": ROOT / "03_ソリューション営業本部" / "SmartInfrastructureSolutionPlatform" / "backend" / "src" / "sol_api" / "routes",
    "construction": ROOT / "04_施工本部" / "ConstructionSiteManagementSystem" / "backend" / "src" / "site_api" / "routes",
    "tech": ROOT / "05_技術本部" / "TechnicalKnowledge-BIMPlatform" / "backend" / "src" / "tech_api" / "routes",
    "safety": ROOT / "06_安全品質環境本部" / "SafetyQualityGovernancePlatform" / "backend" / "src" / "sq_api" / "routes",
    "corp": ROOT / "07_管理本部" / "CorporateOperationPlatform" / "backend" / "src" / "corp_api" / "routes",
    "proc": ROOT / "08_購買部" / "ProcurementMaterialPlatform" / "backend" / "src" / "proc_api" / "routes",
    "marine": ROOT / "09_船舶事業部" / "MarineFleetManagement" / "backend" / "src" / "marine_api" / "routes",
    "itsm": ROOT / "10_IT-DX部門" / "ConstructionITSM-ZeroTrustPlatform" / "backend" / "src" / "itsm_api" / "routes",
    "data": ROOT / "11_統合データ基盤" / "ConstructionDataLake-DigitalTwin" / "backend" / "src" / "data_api" / "routes",
    # Loop #8 追加: exec_api.aggregator.DEPT_SPECS が叩く path alias
    "sales": ROOT / "02_営業本部" / "ConstructionCRM-BidManagement" / "backend" / "src" / "crm_api" / "routes",
    "solution_sales": ROOT / "03_ソリューション営業本部" / "SmartInfrastructureSolutionPlatform" / "backend" / "src" / "sol_api" / "routes",
    "engineering": ROOT / "05_技術本部" / "TechnicalKnowledge-BIMPlatform" / "backend" / "src" / "tech_api" / "routes",
    "corporate": ROOT / "07_管理本部" / "CorporateOperationPlatform" / "backend" / "src" / "corp_api" / "routes",
    "procurement": ROOT / "08_購買部" / "ProcurementMaterialPlatform" / "backend" / "src" / "proc_api" / "routes",
    "data_platform": ROOT / "11_統合データ基盤" / "ConstructionDataLake-DigitalTwin" / "backend" / "src" / "data_api" / "routes",
}


@dataclass
class DeptResult:
    dept: str
    mocks_kpi_fields: list[str] = field(default_factory=list)
    api_field_names: set[str] = field(default_factory=set)
    matched: list[str] = field(default_factory=list)
    unmatched: list[str] = field(default_factory=list)
    status: str = "UNKNOWN"  # PASS / WARN / ERROR / SKIP

    @property
    def coverage(self) -> float:
        if not self.mocks_kpi_fields:
            return 0.0
        return len(self.matched) / len(self.mocks_kpi_fields)


# ---------------------------------------------------------------------------
# mocks/main.py から KPI フィールド名を抽出
# ---------------------------------------------------------------------------
def _parse_mocks_kpi() -> dict[str, list[str]]:
    """``@app.get("/api/v1/{dept}/stats")`` 関数本体から ``kpi`` dict のキーを抽出.

    Returns:
        { dept_key: [kpi field names], ... }
    """
    src = MOCKS_FILE.read_text(encoding="utf-8")
    tree = ast.parse(src)
    results: dict[str, list[str]] = {}

    for node in ast.walk(tree):
        if not isinstance(node, ast.FunctionDef):
            continue
        # router decorator から path 抽出
        path: str | None = None
        for deco in node.decorator_list:
            if not isinstance(deco, ast.Call):
                continue
            if not deco.args:
                continue
            arg0 = deco.args[0]
            if isinstance(arg0, ast.Constant) and isinstance(arg0.value, str):
                if arg0.value.startswith("/api/v1/") and arg0.value.endswith("/stats"):
                    path = arg0.value
                    break
        if path is None:
            continue
        # /api/v1/<dept>/stats から dept 抽出
        m = re.match(r"^/api/v1/([^/]+)/stats$", path)
        if not m:
            continue
        dept = m.group(1)

        # 関数本体の return dict から kpi の dict literal を取り出す
        kpi_keys: list[str] = []
        for stmt in node.body:
            if not isinstance(stmt, ast.Return):
                continue
            ret = stmt.value
            if not isinstance(ret, ast.Dict):
                continue
            for k, v in zip(ret.keys, ret.values):
                if isinstance(k, ast.Constant) and k.value == "kpi" and isinstance(v, ast.Dict):
                    for kk in v.keys:
                        if isinstance(kk, ast.Constant) and isinstance(kk.value, str):
                            kpi_keys.append(kk.value)
        results[dept] = kpi_keys
    return results


# ---------------------------------------------------------------------------
# 各部門 routes/*.py から識別子 (Pydantic フィールド / dict キー / 関数引数) を抽出
# ---------------------------------------------------------------------------
def _collect_api_field_names(routes_dir: Path) -> set[str]:
    names: set[str] = set()
    if not routes_dir.exists():
        return names
    for py in routes_dir.glob("*.py"):
        try:
            src = py.read_text(encoding="utf-8")
            tree = ast.parse(src)
        except SyntaxError:
            continue
        for node in ast.walk(tree):
            # Pydantic / dataclass フィールド: `field_name: type [= default]`
            if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
                names.add(node.target.id)
            # 関数定義の引数名
            if isinstance(node, ast.FunctionDef):
                for a in node.args.args:
                    names.add(a.arg)
                for a in node.args.kwonlyargs:
                    names.add(a.arg)
            # dict literal のキー
            if isinstance(node, ast.Dict):
                for k in node.keys:
                    if isinstance(k, ast.Constant) and isinstance(k.value, str):
                        names.add(k.value)
    return names


# ---------------------------------------------------------------------------
# 比較ロジック
# ---------------------------------------------------------------------------
def run() -> int:
    print("================================================================")
    print(" mocks <-> dept API contract check (Loop #7)")
    print("================================================================")
    print(f"ROOT       : {ROOT}")
    print(f"MOCKS FILE : {MOCKS_FILE}")
    print()

    mocks_kpi = _parse_mocks_kpi()
    if not mocks_kpi:
        print("[ERROR] mocks/main.py から KPI フィールドを抽出できませんでした。", file=sys.stderr)
        return 2
    print(f"mocks endpoints: {len(mocks_kpi)} 部門")

    results: list[DeptResult] = []
    for dept, kpi_fields in mocks_kpi.items():
        routes_dir = DEPT_ROUTES.get(dept)
        r = DeptResult(dept=dept, mocks_kpi_fields=list(kpi_fields))
        if routes_dir is None:
            r.status = "SKIP"
            results.append(r)
            continue
        api_names = _collect_api_field_names(routes_dir)
        r.api_field_names = api_names

        for k in kpi_fields:
            # 完全一致 or 部分一致 (snake_case トークンが交差)
            if k in api_names:
                r.matched.append(k)
                continue
            tokens = set(k.split("_"))
            hit = any(tokens & set(n.split("_")) for n in api_names)
            if hit:
                r.matched.append(k)
            else:
                r.unmatched.append(k)

        cov = r.coverage
        if cov >= 0.5:
            r.status = "PASS"
        elif cov > 0:
            r.status = "WARN"
        else:
            r.status = "ERROR"
        results.append(r)

    # 出力
    print()
    print(f"{'dept':<14}{'status':<8}{'cov':>6}  {'matched/total':<14}  unmatched")
    print("-" * 90)
    total_unmatched = 0
    error_count = 0
    for r in results:
        cov_pct = f"{int(r.coverage * 100)}%"
        mt = f"{len(r.matched)}/{len(r.mocks_kpi_fields)}"
        un = ", ".join(r.unmatched[:5]) + (" ..." if len(r.unmatched) > 5 else "")
        print(f"{r.dept:<14}{r.status:<8}{cov_pct:>6}  {mt:<14}  {un}")
        total_unmatched += len(r.unmatched)
        if r.status == "ERROR":
            error_count += 1

    print()
    print(f"Total unmatched KPI fields : {total_unmatched}")
    print(f"ERROR depts (cov=0)        : {error_count}")
    print()

    # JSON サマリも stdout に
    summary = {
        "depts": [
            {
                "dept": r.dept,
                "status": r.status,
                "coverage": round(r.coverage, 3),
                "matched": r.matched,
                "unmatched": r.unmatched,
                "mocks_kpi_count": len(r.mocks_kpi_fields),
                "api_name_count": len(r.api_field_names),
            }
            for r in results
        ],
        "summary": {
            "total": len(results),
            "pass": sum(1 for r in results if r.status == "PASS"),
            "warn": sum(1 for r in results if r.status == "WARN"),
            "error": error_count,
            "skip": sum(1 for r in results if r.status == "SKIP"),
        },
    }
    print("---- JSON summary ----")
    print(json.dumps(summary, ensure_ascii=False, indent=2))

    # 全部 SKIP / ERROR でなければ 0
    return 0 if error_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(run())
