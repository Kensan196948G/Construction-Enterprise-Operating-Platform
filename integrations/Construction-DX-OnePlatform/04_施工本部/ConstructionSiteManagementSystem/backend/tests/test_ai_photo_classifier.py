"""AIPhotoClassifier 単体テスト.

- AZURE_OPENAI_KEY 未設定 → stub fallback
- 設定済み → httpx をモック (実 API は呼ばない)
"""
from __future__ import annotations

import json
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from site_api.services.ai_photo_classifier import AIPhotoClassifier


@pytest.mark.asyncio
async def test_classify_stub_when_unconfigured(monkeypatch: pytest.MonkeyPatch) -> None:
    """API キーが無いとき stub を返す。"""
    classifier = AIPhotoClassifier()
    monkeypatch.setattr(classifier.settings, "azure_openai_endpoint", None)
    monkeypatch.setattr(classifier.settings, "azure_openai_key", None)
    result = await classifier.classify(b"\x00\x01\x02")
    assert result["provider"] == "stub"
    assert "tags" in result
    assert "hazards" in result
    assert "objects" in result
    assert 0.0 <= result["confidence"] <= 1.0


@pytest.mark.asyncio
async def test_classify_calls_azure_openai(monkeypatch: pytest.MonkeyPatch) -> None:
    """設定済みの場合 httpx 経由で Azure OpenAI を呼び、JSON を解釈する。"""
    classifier = AIPhotoClassifier()
    monkeypatch.setattr(
        classifier.settings, "azure_openai_endpoint", "https://example.openai.azure.com"
    )
    monkeypatch.setattr(classifier.settings, "azure_openai_key", "dummy-key")
    monkeypatch.setattr(classifier.settings, "azure_openai_deployment", "gpt-4o")

    mock_response_body: dict[str, Any] = {
        "choices": [
            {
                "message": {
                    "content": json.dumps(
                        {
                            "category": "安全設備",
                            "tags": ["ヘルメット", "高所"],
                            "hazards": ["転落"],
                            "objects": ["作業員", "足場"],
                            "confidence": 0.92,
                        },
                        ensure_ascii=False,
                    )
                }
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.json.return_value = mock_response_body
    mock_resp.raise_for_status = MagicMock(return_value=None)

    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("site_api.services.ai_photo_classifier.httpx.AsyncClient", return_value=mock_client):
        result = await classifier.classify(b"\x00\x01\x02")

    assert result["provider"] == "azure_openai"
    assert result["category"] == "安全設備"
    assert "転落" in result["hazards"]
    assert "ヘルメット" in result["tags"]
    assert result["confidence"] == pytest.approx(0.92)
    # endpoint URL に deployment が含まれる
    called_url = mock_client.post.await_args.args[0]
    assert "/deployments/gpt-4o/" in called_url


@pytest.mark.asyncio
async def test_classify_falls_back_on_http_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """HTTP エラー時は stub にフォールバック (例外を投げない)."""
    import httpx

    classifier = AIPhotoClassifier()
    monkeypatch.setattr(
        classifier.settings, "azure_openai_endpoint", "https://example.openai.azure.com"
    )
    monkeypatch.setattr(classifier.settings, "azure_openai_key", "dummy-key")

    mock_client = MagicMock()
    mock_client.post = AsyncMock(side_effect=httpx.ConnectError("boom"))
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("site_api.services.ai_photo_classifier.httpx.AsyncClient", return_value=mock_client):
        result = await classifier.classify(b"\x00")

    assert result["provider"] == "azure_openai_error"
    assert "error" in result
