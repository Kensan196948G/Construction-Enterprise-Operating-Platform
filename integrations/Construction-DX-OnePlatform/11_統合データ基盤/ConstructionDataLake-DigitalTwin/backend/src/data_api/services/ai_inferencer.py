"""AI inference dispatcher.

Routes inference calls to:
  * Azure OpenAI (LangChain + chat completions) for RAG / NLP
  * scikit-learn pickled artifacts for classification / regression
  * Prophet-like forecasting (stubbed when library absent)

Additional high-level helpers expected by the data API:
  * ``summarize_kpi(snapshot)``  — natural-language KPI summary
  * ``classify_alert(text)``     — classifies free text as incident / risk / opportunity / info
  * ``predict_risk(features)``   — runs a scikit-learn pickle (falls back to a deterministic stub)

If no backend is configured, returns deterministic mock outputs so that the
API contract is stable for downstream development and tests.
"""
from __future__ import annotations

import logging
import pickle
import re
import time
from pathlib import Path
from typing import Any

from data_api.config import get_settings

logger = logging.getLogger(__name__)


# ---- low-level backends -------------------------------------------------
def infer_sklearn(artifact_uri: str, inputs: list[dict] | dict) -> dict[str, Any]:
    """Load a pickled sklearn model and run predict()."""
    p = Path(artifact_uri)
    if not p.exists():
        return _mock("sklearn", inputs, reason=f"artifact not found: {artifact_uri}")
    try:
        with p.open("rb") as fh:
            model = pickle.load(fh)
        rows = inputs if isinstance(inputs, list) else [inputs]
        X = [list(r.values()) for r in rows]
        preds = model.predict(X).tolist() if hasattr(model, "predict") else []
        return {"framework": "sklearn", "predictions": preds}
    except Exception as exc:  # noqa: BLE001
        logger.warning("sklearn inference failed: %s", exc)
        return _mock("sklearn", inputs, reason=str(exc))


def infer_azure_openai(prompt: str, *, system: str | None = None) -> dict[str, Any]:
    """Call Azure OpenAI chat completion via LangChain. Falls back to mock."""
    settings = get_settings()
    if not (settings.azure_openai_endpoint and settings.azure_openai_api_key):
        return _mock("azure-openai", prompt, reason="endpoint/key not configured")
    try:
        from langchain_openai import AzureChatOpenAI  # type: ignore

        llm = AzureChatOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            azure_deployment=settings.azure_openai_deployment,
            api_version=settings.azure_openai_api_version,
            temperature=0.2,
        )
        messages = []
        if system:
            messages.append(("system", system))
        messages.append(("human", prompt))
        result = llm.invoke(messages)
        return {"framework": "azure-openai", "content": getattr(result, "content", str(result))}
    except Exception as exc:  # noqa: BLE001
        logger.warning("Azure OpenAI inference failed: %s", exc)
        return _mock("azure-openai", prompt, reason=str(exc))


def infer_forecast(history: list[float], horizon: int = 7) -> dict[str, Any]:
    """Naive moving-average forecaster (Prophet replacement for skeleton)."""
    if not history:
        return {"framework": "forecast", "forecast": [], "method": "naive"}
    window = history[-min(len(history), 7):]
    avg = sum(window) / len(window)
    return {
        "framework": "forecast",
        "forecast": [round(avg, 4)] * horizon,
        "method": "moving-average",
        "window_size": len(window),
    }


# ---- high-level helpers -------------------------------------------------
def summarize_kpi(snapshot: dict[str, Any]) -> dict[str, Any]:
    """Summarize a KPI snapshot in natural language.

    When Azure OpenAI is configured, the snapshot is rendered as a compact
    bullet list and sent to the chat completion endpoint.  When it isn't,
    a deterministic fallback summary is produced from the top numeric fields
    so the calling endpoint stays usable in dev/CI.
    """
    bullets = []
    for k, v in snapshot.items():
        bullets.append(f"- {k}: {v}")
    prompt = (
        "以下の KPI スナップショットを 3 文以内の日本語で経営者向けに要約してください。\n"
        + "\n".join(bullets)
    )
    settings = get_settings()
    if settings.azure_openai_endpoint and settings.azure_openai_api_key:
        return infer_azure_openai(
            prompt, system="あなたは建設業界 DX プラットフォームの分析アシスタントです。"
        )
    # deterministic fallback summary
    numeric = {k: v for k, v in snapshot.items() if isinstance(v, (int, float))}
    if numeric:
        top = sorted(numeric.items(), key=lambda kv: kv[1], reverse=True)[:3]
        summary = " / ".join(f"{k}={v}" for k, v in top)
    else:
        summary = ", ".join(map(str, list(snapshot.keys())[:5])) or "(空のスナップショット)"
    return {
        "framework": "kpi-summary",
        "mock": True,
        "reason": "Azure OpenAI not configured",
        "summary": f"主要指標: {summary}",
        "echo": snapshot,
    }


_ALERT_KEYWORDS: dict[str, list[str]] = {
    "incident": ["事故", "災害", "怪我", "落下", "停電", "障害", "incident", "outage"],
    "risk":     ["危険", "懸念", "遅延", "リスク", "warning", "risk", "delay"],
    "opportunity": ["改善", "提案", "効率化", "opportunity", "improvement"],
}


def classify_alert(text: str) -> dict[str, Any]:
    """Classify free-form alert text into incident / risk / opportunity / info.

    Uses Azure OpenAI when configured; otherwise falls back to a keyword
    heuristic.  Output shape is stable across both branches:

    .. code-block:: python

        {"framework": "...", "label": "incident", "confidence": 0.0..1.0, "echo": text}
    """
    settings = get_settings()
    text = (text or "").strip()
    if not text:
        return {
            "framework": "alert-classifier",
            "mock": True,
            "label": "info",
            "confidence": 0.0,
            "reason": "empty input",
            "echo": text,
        }

    if settings.azure_openai_endpoint and settings.azure_openai_api_key:
        prompt = (
            "次のテキストを incident / risk / opportunity / info のいずれか 1 語で分類してください。\n"
            f"テキスト: {text}"
        )
        result = infer_azure_openai(
            prompt, system="あなたは建設現場アラート分類器です。1 単語のみ返してください。"
        )
        if not result.get("mock"):
            label = _extract_label(str(result.get("content", "")))
            return {
                "framework": "alert-classifier",
                "label": label,
                "confidence": 0.85,
                "echo": text,
            }

    # heuristic fallback
    scores: dict[str, int] = dict.fromkeys(_ALERT_KEYWORDS, 0)
    lower = text.lower()
    for label, kws in _ALERT_KEYWORDS.items():
        for kw in kws:
            if kw in text or kw.lower() in lower:
                scores[label] += 1
    best_label = max(scores, key=lambda k: scores[k])
    confidence = scores[best_label] / max(1, sum(scores.values()))
    label = best_label if scores[best_label] > 0 else "info"
    return {
        "framework": "alert-classifier",
        "mock": True,
        "reason": "keyword heuristic",
        "label": label,
        "confidence": round(confidence, 3),
        "echo": text,
    }


def _extract_label(content: str) -> str:
    """Pull the first recognised label out of an LLM response."""
    token = re.split(r"[\s\W]+", content.strip().lower(), maxsplit=1)[0]
    if token in {"incident", "risk", "opportunity", "info"}:
        return token
    return "info"


def predict_risk(
    features: dict[str, float] | list[dict[str, float]],
    *,
    artifact_uri: str | None = None,
) -> dict[str, Any]:
    """Predict a risk score from feature vector(s).

    Tries to load the configured sklearn pickle from ``artifact_uri``.  If the
    artifact is missing, returns a deterministic stub score derived from the
    feature magnitudes so downstream UIs always receive a numeric value.
    """
    if artifact_uri:
        result = infer_sklearn(artifact_uri, features)
        if not result.get("mock"):
            preds = result.get("predictions", [])
            return {
                "framework": "risk-model",
                "predictions": preds,
                "score": float(preds[0]) if preds else 0.0,
                "method": "sklearn",
            }
    # stub: bounded average of numeric features in [0,1]
    rows = features if isinstance(features, list) else [features]
    flat = [
        float(v)
        for r in rows
        for v in r.values()
        if isinstance(v, (int, float))
    ]
    score = 0.0
    if flat:
        avg = sum(abs(x) for x in flat) / len(flat)
        score = max(0.0, min(1.0, avg / (avg + 1.0)))
    return {
        "framework": "risk-model",
        "mock": True,
        "reason": "no artifact_uri or model unavailable",
        "predictions": [round(score, 4)] * len(rows),
        "score": round(score, 4),
        "method": "stub",
    }


# ---- dispatcher ---------------------------------------------------------
def dispatch(
    model_type: str,
    *,
    inputs: Any,
    artifact_uri: str | None = None,
    framework: str | None = None,
) -> dict[str, Any]:
    """Top-level inference dispatcher used by the routes layer."""
    started = time.perf_counter()
    fw = (framework or "").lower()
    mt = model_type.lower()
    if mt == "rag" or fw in {"azure-openai", "langchain"}:
        prompt = inputs.get("prompt") if isinstance(inputs, dict) else str(inputs)
        result = infer_azure_openai(prompt or "", system=inputs.get("system") if isinstance(inputs, dict) else None)
    elif mt == "forecast":
        history = inputs.get("history", []) if isinstance(inputs, dict) else []
        horizon = inputs.get("horizon", 7) if isinstance(inputs, dict) else 7
        result = infer_forecast(history, horizon)
    elif mt == "kpi_summary":
        snapshot = inputs if isinstance(inputs, dict) else {"value": inputs}
        result = summarize_kpi(snapshot)
    elif mt == "alert_classification":
        text = inputs.get("text", "") if isinstance(inputs, dict) else str(inputs)
        result = classify_alert(text)
    elif mt == "risk":
        features = inputs.get("features", inputs) if isinstance(inputs, dict) else inputs
        result = predict_risk(features, artifact_uri=artifact_uri)
    elif mt in {"classification", "regression", "anomaly"} and artifact_uri:
        result = infer_sklearn(artifact_uri, inputs)
    else:
        result = _mock(fw or mt, inputs, reason="no backend matched")
    result["elapsed_ms"] = round((time.perf_counter() - started) * 1000, 2)
    return result


def _mock(framework: str, inputs: Any, *, reason: str) -> dict[str, Any]:
    return {
        "framework": framework,
        "mock": True,
        "reason": reason,
        "echo": inputs if isinstance(inputs, (dict, list, str, int, float)) else str(inputs),
    }
