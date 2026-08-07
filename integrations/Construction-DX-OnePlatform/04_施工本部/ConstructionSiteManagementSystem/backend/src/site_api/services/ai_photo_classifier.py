"""AI 写真分類サービス (Azure OpenAI GPT-4o Vision).

- 入力: 画像 Blob (bytes)
- 出力: ``{tags: [...], hazards: [...], objects: [...], confidence: float, ...}``
- ``AZURE_OPENAI_API_KEY`` / ``AZURE_OPENAI_ENDPOINT`` が未設定の場合は stub を返す。
- 設定済みの場合は Azure OpenAI Chat Completions (Vision 対応 deployment) を呼び出す。

JSON 出力契約 (システムプロンプトで明示):
    {
      "category": "出来形 | 材料 | 安全設備 | 全景 | 重機 | 作業員 | その他",
      "tags":    ["string", ...],
      "hazards": ["string", ...],
      "objects": ["string", ...],
      "confidence": 0.0-1.0
    }
"""
from __future__ import annotations

import base64
import json
import logging
from typing import Any

import httpx

from ..config import get_settings

logger = logging.getLogger(__name__)

CATEGORIES = ["出来形", "材料", "安全設備", "全景", "重機", "作業員", "その他"]

SYSTEM_PROMPT = (
    "あなたは建設現場写真の分析アシスタントです。"
    "与えられた画像から、安全リスク(hazards)・作業内容(category と tags)・登場物体(objects)を"
    "日本語で抽出し、必ず以下の JSON スキーマで返答してください。前置きや解説は不要です。\n"
    "{\n"
    '  "category": "出来形 | 材料 | 安全設備 | 全景 | 重機 | 作業員 | その他",\n'
    '  "tags": ["string", ...],\n'
    '  "hazards": ["string", ...],\n'
    '  "objects": ["string", ...],\n'
    '  "confidence": 0.0-1.0\n'
    "}\n"
)

USER_PROMPT = "この建設現場写真を分析してください。"

_STUB_RESULT: dict[str, Any] = {
    "category": "全景",
    "tags": ["site", "exterior"],
    "hazards": [],
    "objects": [],
    "confidence": 0.85,
    "provider": "stub",
}


class AIPhotoClassifier:
    """Azure OpenAI Vision (gpt-4o) を呼び写真を分類する."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def _build_url(self) -> str:
        endpoint = (self.settings.azure_openai_endpoint or "").rstrip("/")
        deployment = self.settings.azure_openai_deployment
        return (
            f"{endpoint}/openai/deployments/{deployment}"
            "/chat/completions?api-version=2024-08-01-preview"
        )

    def _build_payload(self, image_bytes: bytes, mime: str = "image/jpeg") -> dict[str, Any]:
        b64 = base64.b64encode(image_bytes).decode("ascii")
        data_url = f"data:{mime};base64,{b64}"
        return {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": USER_PROMPT},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
            "max_tokens": 600,
            "temperature": 0.0,
            "response_format": {"type": "json_object"},
        }

    @staticmethod
    def _parse_response(payload: dict[str, Any]) -> dict[str, Any]:
        """Azure OpenAI chat completion レスポンスから JSON 結果を抽出."""
        try:
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            return dict(_STUB_RESULT, provider="azure_openai_malformed")
        if isinstance(content, list):
            # 念のため複数パートに対応
            text_parts = [p.get("text", "") for p in content if isinstance(p, dict)]
            content = "".join(text_parts)
        try:
            data: dict[str, Any] = json.loads(content)
        except (TypeError, ValueError):
            return dict(_STUB_RESULT, provider="azure_openai_invalid_json", raw=content)
        # 既定値の補完
        result: dict[str, Any] = {
            "category": data.get("category", "その他"),
            "tags": list(data.get("tags") or []),
            "hazards": list(data.get("hazards") or []),
            "objects": list(data.get("objects") or []),
            "confidence": float(data.get("confidence", 0.0) or 0.0),
            "provider": "azure_openai",
        }
        return result

    async def classify(
        self, image_bytes: bytes, *, mime: str = "image/jpeg"
    ) -> dict[str, Any]:
        """画像バイト列を AI 分類する。"""
        if not self.settings.azure_openai_endpoint or not self.settings.azure_openai_key:
            logger.info("Azure OpenAI not configured; returning stub classification")
            return dict(_STUB_RESULT)

        url = self._build_url()
        headers = {
            "api-key": self.settings.azure_openai_key,
            "Content-Type": "application/json",
        }
        payload = self._build_payload(image_bytes, mime=mime)
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                return self._parse_response(resp.json())
        except httpx.HTTPError as exc:
            logger.warning("Azure OpenAI call failed: %s", exc)
            return dict(_STUB_RESULT, provider="azure_openai_error", error=str(exc))
