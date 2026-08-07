"""AI 危険予測サービス (Azure OpenAI GPT-4o 連携 + stub フォールバック).

ISO 45001 / 労働安全衛生法に基づき、ヒヤリハット/KY 記録および現場属性を
context として Azure OpenAI GPT-4o に投げ、危険レベルと対策を JSON で返す。

`SQ_AZURE_OPENAI_API_KEY` (and endpoint) が未設定の場合は stub に
フォールバックするため、CI / オフライン環境でも安全に呼び出せる。
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any

from ..config import settings

logger = logging.getLogger(__name__)

# Azure OpenAI deployment 名 (env で上書き可)
DEFAULT_DEPLOYMENT = "gpt-4o"
DEFAULT_API_VERSION = "2024-08-01-preview"

SYSTEM_PROMPT = (
    "ISO 45001 / 労働安全衛生法に基づき、建設現場の危険予測と対策提案を行う"
    "安全担当 AI です。入力 context (作業内容/場所/天候/作業者数/類似ヒヤリハット)"
    " から、危険源 (hazards) を特定し、リスクレベル (low/medium/high/critical)、"
    "推奨対策 (suggested_countermeasures)、根拠 (reasoning)、信頼度 (confidence 0-1) "
    "を JSON で返してください。出力は valid JSON 単体で、追加のテキストや code fence "
    "は含めないこと。"
)

RISK_LEVELS = ("low", "medium", "high", "critical")


@dataclass
class RiskContext:
    """AI に渡す現場 context."""

    work_content: str
    location: str | None = None
    weather: str | None = None
    workers: int = 1
    historical_near_miss_count: int = 0
    hazards: list[str] = field(default_factory=list)
    similar_events: list[dict[str, Any]] = field(default_factory=list)
    project_id: str | None = None


def _stub_predict(ctx: RiskContext) -> dict[str, Any]:
    """Azure OpenAI 未設定時のヒューリスティック (Loop#1 stub と整合)."""
    score = 10 + ctx.workers * 2 + ctx.historical_near_miss_count * 5
    score += 10 * len(ctx.hazards)
    if (ctx.weather or "").lower() in {"rain", "雨", "snow", "雪", "storm"}:
        score += 20
    score = min(score, 100)
    if score >= 85:
        level = "critical"
    elif score >= 70:
        level = "high"
    elif score >= 40:
        level = "medium"
    else:
        level = "low"

    return {
        "risk_level": level,
        "risk_score": score,
        "hazards": ctx.hazards or ["転倒", "重機接触", "高所からの墜落"],
        "suggested_countermeasures": [
            "KY 活動でリスクランクを再確認 (ISO 45001 6.1.2)",
            "高所/重機作業は安全帯/合図者を再点検 (労安法第21条)",
            "作業前ミーティングで危険源を共有",
        ],
        "reasoning": (
            "stub フォールバック: 作業者数/履歴ヒヤリハット数/想定ハザード数/天候から"
            "線形スコアで推定 (Azure OpenAI 未設定)"
        ),
        "confidence": 0.4,
        "source": "stub",
    }


def _build_user_prompt(ctx: RiskContext) -> str:
    """LLM に渡すユーザープロンプトを組み立てる."""
    lines = [
        "以下の現場 context を分析し、危険予測と対策を JSON で返してください。",
        "",
        f"作業内容: {ctx.work_content}",
        f"場所: {ctx.location or '不明'}",
        f"天候: {ctx.weather or '不明'}",
        f"作業者数: {ctx.workers}",
        f"過去ヒヤリハット件数: {ctx.historical_near_miss_count}",
        f"想定ハザード: {', '.join(ctx.hazards) if ctx.hazards else 'なし'}",
    ]
    if ctx.similar_events:
        lines.append("類似事象:")
        for ev in ctx.similar_events[:5]:
            desc = ev.get("description") or ev.get("title") or ""
            lvl = ev.get("risk_level") or ev.get("severity") or ""
            lines.append(f"  - [{lvl}] {desc}")
    lines.append("")
    lines.append(
        "出力スキーマ: "
        '{"risk_level": "low|medium|high|critical", '
        '"hazards": [string], '
        '"suggested_countermeasures": [string], '
        '"reasoning": string, '
        '"confidence": number}'
    )
    return "\n".join(lines)


def _normalize_response(raw: str, ctx: RiskContext) -> dict[str, Any]:
    """LLM 応答 (JSON 文字列) を正規化し、欠落フィールドは補完."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # code fence 等を簡易除去
        cleaned = raw.strip().strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            logger.warning("LLM JSON parse failed; falling back to stub")
            fb = _stub_predict(ctx)
            fb["source"] = "stub_parse_error"
            return fb

    level = str(data.get("risk_level", "medium")).lower()
    if level not in RISK_LEVELS:
        level = "medium"

    return {
        "risk_level": level,
        "hazards": list(data.get("hazards") or []),
        "suggested_countermeasures": list(data.get("suggested_countermeasures") or []),
        "reasoning": str(data.get("reasoning") or ""),
        "confidence": float(data.get("confidence") or 0.7),
        "source": "azure_openai",
    }


def _azure_client() -> Any:
    """Azure OpenAI client を遅延 import で構築 (未インストール時は None)."""
    try:
        from openai import AzureOpenAI  # type: ignore
    except ImportError:
        logger.info("openai SDK not installed; using stub")
        return None
    return AzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=DEFAULT_API_VERSION,
    )


def predict(ctx: RiskContext) -> dict[str, Any]:
    """危険予測を返す。Azure OpenAI 未設定時は stub にフォールバック."""
    if not settings.azure_openai_api_key or not settings.azure_openai_endpoint:
        return _stub_predict(ctx)

    client = _azure_client()
    if client is None:
        return _stub_predict(ctx)

    try:
        resp = client.chat.completions.create(
            model=DEFAULT_DEPLOYMENT,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(ctx)},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=800,
        )
        raw = resp.choices[0].message.content or "{}"
        return _normalize_response(raw, ctx)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Azure OpenAI call failed: %s", exc)
        fb = _stub_predict(ctx)
        fb["source"] = "stub_api_error"
        fb["error"] = str(exc)[:200]
        return fb
