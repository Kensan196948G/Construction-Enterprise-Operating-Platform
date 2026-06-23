"""LLM Client unit tests (Sprint 4 coverage expansion).

カバレッジ:
    - StubLLMClient が LLMResponse を返すこと
    - StubLLMClient が呼び出し履歴を記録すること
    - AnthropicLLMClient が ANTHROPIC_API_KEY 未設定時に RuntimeError を raise すること
    - LLMResponse が frozen dataclass であること（mutability テスト）
"""

from __future__ import annotations

import dataclasses

import pytest

from ai_gateway_app.llm.llm_client import (
    AnthropicLLMClient,
    LLMResponse,
    StubLLMClient,
)


# ---------------------------------------------------------------------------
# StubLLMClient
# ---------------------------------------------------------------------------


def test_stub_returns_llm_response() -> None:
    """StubLLMClient.invoke() が LLMResponse を返す."""
    stub = StubLLMClient()
    result = stub.invoke(
        provider="openai",
        model="gpt-4o",
        prompt="テスト用プロンプト",
        context_refs=["doc_tena_20260502_0001"],
    )
    assert isinstance(result, LLMResponse)
    assert result.response_text
    assert result.reasoning_summary


def test_stub_response_contains_provider_and_model() -> None:
    """StubLLMClient の response_text に provider/model が含まれる."""
    stub = StubLLMClient()
    result = stub.invoke(
        provider="local-vllm",
        model="local-llama-3.1-8b",
        prompt="ローカル LLM テスト",
        context_refs=[],
    )
    assert "local-vllm" in result.response_text
    assert "local-llama-3.1-8b" in result.response_text


def test_stub_records_call_history() -> None:
    """StubLLMClient は呼び出し履歴を calls に保持する."""
    stub = StubLLMClient()
    assert stub.calls == []

    stub.invoke(
        provider="openai",
        model="gpt-4o",
        prompt="1 回目",
        context_refs=["ref1"],
    )
    stub.invoke(
        provider="anthropic",
        model="claude-sonnet-4-6",
        prompt="2 回目",
        context_refs=["ref2", "ref3"],
    )

    assert len(stub.calls) == 2

    first = stub.calls[0]
    assert first["provider"] == "openai"
    assert first["model"] == "gpt-4o"
    assert first["prompt"] == "1 回目"
    assert first["context_refs"] == ["ref1"]

    second = stub.calls[1]
    assert second["provider"] == "anthropic"
    assert second["model"] == "claude-sonnet-4-6"
    assert second["context_refs"] == ["ref2", "ref3"]


def test_stub_reasoning_summary_mentions_context_count() -> None:
    """reasoning_summary にコンテキスト参照数が反映される."""
    stub = StubLLMClient()
    result = stub.invoke(
        provider="openai",
        model="gpt-4o",
        prompt="コンテキスト数テスト",
        context_refs=["a", "b", "c"],
    )
    # context refs の数が reasoning summary に含まれるか
    assert "3" in result.reasoning_summary


def test_stub_prompt_truncated_in_response_text() -> None:
    """長いプロンプトでも response_text に echo される（80 文字以内にトリミング）."""
    stub = StubLLMClient()
    long_prompt = "あ" * 200
    result = stub.invoke(
        provider="openai",
        model="gpt-4o",
        prompt=long_prompt,
        context_refs=[],
    )
    # StubLLMClient は prompt[:80] で echo する
    assert "あ" * 80 in result.response_text


# ---------------------------------------------------------------------------
# AnthropicLLMClient
# ---------------------------------------------------------------------------


def test_anthropic_client_raises_without_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    """ANTHROPIC_API_KEY が未設定の場合、invoke() で RuntimeError を raise する."""
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    client = AnthropicLLMClient()
    with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
        client.invoke(
            provider="anthropic",
            model="claude-sonnet-4-6",
            prompt="APIキー未設定テスト",
            context_refs=[],
        )


def test_anthropic_client_lazy_init_without_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """ANTHROPIC_API_KEY 未設定でも AnthropicLLMClient のインスタンス生成は成功する.

    RuntimeError は _get_client() の lazy init 時にのみ発生する。
    """
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    # インスタンス生成は成功する（lazy init のため）
    client = AnthropicLLMClient()
    assert client._client is None


# ---------------------------------------------------------------------------
# LLMResponse — frozen dataclass
# ---------------------------------------------------------------------------


def test_llm_response_is_frozen_dataclass() -> None:
    """LLMResponse は frozen=True の dataclass であり、フィールドを変更できない."""
    response = LLMResponse(
        response_text="テスト応答",
        reasoning_summary="テスト理由",
    )
    assert response.response_text == "テスト応答"
    assert response.reasoning_summary == "テスト理由"

    # frozen=True なので属性変更は FrozenInstanceError を raise する
    with pytest.raises((dataclasses.FrozenInstanceError, AttributeError, TypeError)):
        response.response_text = "変更後テキスト"  # type: ignore[misc]


def test_llm_response_equality() -> None:
    """同じ値の LLMResponse は等しい（frozen dataclass の値比較）."""
    a = LLMResponse(response_text="same", reasoning_summary="reason")
    b = LLMResponse(response_text="same", reasoning_summary="reason")
    assert a == b


def test_llm_response_inequality() -> None:
    """値が異なる LLMResponse は等しくない."""
    a = LLMResponse(response_text="A", reasoning_summary="reason")
    b = LLMResponse(response_text="B", reasoning_summary="reason")
    assert a != b
