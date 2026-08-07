"""AI 危険予測サービスの単体テスト (stub + 実 API モック)."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from sq_api.services.ai_risk_predictor import RiskContext, predict


def test_predict_falls_back_to_stub_when_unconfigured() -> None:
    """SQ_AZURE_OPENAI_API_KEY 未設定なら stub を返す."""
    ctx = RiskContext(
        work_content="高所作業",
        weather="rain",
        workers=5,
        historical_near_miss_count=2,
        hazards=["fall", "wind"],
    )
    with patch("sq_api.services.ai_risk_predictor.settings") as s:
        s.azure_openai_api_key = ""
        s.azure_openai_endpoint = ""
        result = predict(ctx)

    assert result["source"] == "stub"
    assert result["risk_level"] in ("low", "medium", "high", "critical")
    assert isinstance(result["suggested_countermeasures"], list)
    assert len(result["suggested_countermeasures"]) >= 1


def test_predict_calls_azure_openai_when_configured() -> None:
    """API key/endpoint が揃っていれば Azure OpenAI を呼び、応答を正規化する."""
    ctx = RiskContext(work_content="脚立作業", workers=3, hazards=["転倒"])
    fake_choice = MagicMock()
    fake_choice.message.content = (
        '{"risk_level": "high", '
        '"hazards": ["脚立転倒", "頭部打撲"], '
        '"suggested_countermeasures": ["脚立点検", "二人作業"], '
        '"reasoning": "高さがあり単独作業のリスク", '
        '"confidence": 0.82}'
    )
    fake_resp = MagicMock()
    fake_resp.choices = [fake_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = fake_resp

    with patch("sq_api.services.ai_risk_predictor.settings") as s, \
         patch("sq_api.services.ai_risk_predictor._azure_client", return_value=mock_client):
        s.azure_openai_api_key = "test-key"
        s.azure_openai_endpoint = "https://test.openai.azure.com"
        result = predict(ctx)

    assert result["source"] == "azure_openai"
    assert result["risk_level"] == "high"
    assert "脚立転倒" in result["hazards"]
    assert result["confidence"] == 0.82
    mock_client.chat.completions.create.assert_called_once()
