"""proposal_summarizer 単体テスト (Azure 未設定 = テンプレ fallback)."""

from __future__ import annotations

from decimal import Decimal

from crm_api.services.proposal_summarizer import (
    ProposalSummarizeInput,
    summarize_opportunity,
)


def test_summarize_opportunity_uses_template_when_azure_unset(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.delenv("AZURE_OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("AZURE_OPENAI_ENDPOINT", raising=False)
    payload = ProposalSummarizeInput(
        opportunity_code="OPP-001",
        title="○○ビル新築工事",
        client_name="サンプル建設",
        stage="proposal",
        win_probability=Decimal("70"),
        expected_amount=Decimal("100000000"),
        work_category="建築一式",
        description="工期12ヶ月、地下1階地上8階",
    )
    r = summarize_opportunity(payload)
    assert r.model_used == "template_fallback"
    assert "○○ビル新築工事" in r.summary
    assert "サンプル建設" in r.email_skeleton
    assert "100,000,000円" in r.summary
