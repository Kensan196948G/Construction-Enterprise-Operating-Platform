"""取締役会報告書生成サービス.

KPI / 予測 / アラート から Markdown 形式の報告書を生成。
Azure OpenAI が設定されていれば AI 要約を呼び出す (stub: 未設定時は
ヒューリスティック要約)。
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date
from typing import Any

from ..config import get_settings

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class BoardReportDraft:
    title: str
    fiscal_period: str
    report_date: date
    body_markdown: str
    ai_summary: str
    kpi_excerpt: dict[str, Any]


def _heuristic_summary(kpis: dict[str, Any], alerts: list[dict[str, Any]]) -> str:
    """KPI/アラートからヒューリスティックに箇条書き要約を生成."""
    bullets: list[str] = []
    margin = float(kpis.get("average_profit_margin", 0) or 0)
    if margin >= 0.08:
        bullets.append(f"平均利益率 {margin:.1%} は堅調に推移。")
    elif margin >= 0.05:
        bullets.append(f"平均利益率 {margin:.1%} は計画水準ぎりぎり。")
    else:
        bullets.append(f"平均利益率 {margin:.1%} は警戒水準。早急な対策が必要。")

    acc = int(kpis.get("accident_count", 0) or 0)
    if acc == 0:
        bullets.append("重大事故ゼロを維持。安全文化の定着を継続。")
    else:
        bullets.append(f"事故 {acc} 件発生。原因分析と再発防止を最優先。")

    deficit = int(kpis.get("deficit_project_count", 0) or 0)
    if deficit > 0:
        bullets.append(f"赤字案件 {deficit} 件。利益率予測モデルで精査推奨。")

    if alerts:
        critical = sum(1 for a in alerts if a.get("level") == "critical")
        bullets.append(f"未解決アラート {len(alerts)} 件 (重大 {critical} 件)。")

    return "\n".join(f"- {b}" for b in bullets) or "- 報告事項は特にありません。"


def _azure_openai_summary(
    kpis: dict[str, Any],
    alerts: list[dict[str, Any]],
    fallback: str,
) -> str:
    """Azure OpenAI で要約生成. 未設定 / 失敗時は ``fallback`` を返す."""
    s = get_settings()
    if not (s.azure_openai_endpoint and s.azure_openai_api_key and s.azure_openai_deployment):
        return fallback
    try:  # pragma: no cover - 実 API 呼び出しはテスト対象外
        import httpx

        url = (
            f"{s.azure_openai_endpoint.rstrip('/')}/openai/deployments/"
            f"{s.azure_openai_deployment}/chat/completions?api-version=2024-02-15-preview"
        )
        prompt = (
            "あなたは建設業の経営企画担当役員です。次の経営 KPI と未解決アラートから、"
            "取締役会向けに 5 行以内の日本語サマリ段落を作成してください。\n\n"
            f"KPI: {kpis}\nアラート: {alerts}\n"
        )
        body = {
            "messages": [
                {"role": "system", "content": "あなたは熟練した CFO のような戦略アナリストです。"},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 400,
        }
        headers = {"api-key": s.azure_openai_api_key, "Content-Type": "application/json"}
        with httpx.Client(timeout=10.0) as c:
            r = c.post(url, json=body, headers=headers)
            r.raise_for_status()
            data = r.json()
            content = data["choices"][0]["message"]["content"]
            return content.strip() or fallback
    except Exception as e:  # pragma: no cover
        log.warning("Azure OpenAI summary failed (%s); fallback to heuristic.", e)
        return fallback


def _ai_summarize(kpis: dict[str, Any], alerts: list[dict[str, Any]]) -> str:
    """Azure OpenAI が設定済なら要約, 未設定ならヒューリスティック."""
    fallback = _heuristic_summary(kpis, alerts)
    return _azure_openai_summary(kpis, alerts, fallback)


def generate(
    *,
    fiscal_period: str,
    report_date: date,
    kpis: dict[str, Any],
    forecasts: list[dict[str, Any]] | None = None,
    alerts: list[dict[str, Any]] | None = None,
    esg: dict[str, Any] | None = None,
) -> BoardReportDraft:
    """取締役会報告書ドラフトを生成."""
    forecasts = forecasts or []
    alerts = alerts or []
    esg = esg or {}

    summary = _ai_summarize(kpis, alerts)

    md_lines: list[str] = []
    md_lines.append(f"# 取締役会報告書 ({fiscal_period})")
    md_lines.append(f"\n報告日: {report_date.isoformat()}\n")
    md_lines.append("## 1. エグゼクティブサマリ\n")
    md_lines.append(summary)
    md_lines.append("\n## 2. 主要 KPI\n")
    md_lines.append("| KPI | 値 |")
    md_lines.append("|------|------|")
    for k, v in kpis.items():
        md_lines.append(f"| {k} | {v} |")

    if forecasts:
        md_lines.append("\n## 3. AI 予測 (抜粋)\n")
        for f in forecasts[:5]:
            md_lines.append(
                f"- {f.get('target_metric')}: {f.get('summary', '')} "
                f"(model={f.get('model_name')})"
            )

    if alerts:
        md_lines.append("\n## 4. 経営アラート\n")
        for a in alerts:
            md_lines.append(f"- [{a.get('level','?').upper()}] {a.get('title')} — {a.get('message')}")

    if esg:
        md_lines.append("\n## 5. ESG/SDGs ハイライト\n")
        for k, v in esg.items():
            md_lines.append(f"- {k}: {v}")

    body = "\n".join(md_lines)
    return BoardReportDraft(
        title=f"取締役会報告書 {fiscal_period}",
        fiscal_period=fiscal_period,
        report_date=report_date,
        body_markdown=body,
        ai_summary=summary,
        kpi_excerpt=kpis,
    )
