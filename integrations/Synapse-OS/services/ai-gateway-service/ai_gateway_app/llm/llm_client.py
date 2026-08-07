"""LLM Adapter (BL-006 / Sprint 3).

Sprint 3 以降は ANTHROPIC_API_KEY が設定されている場合に AnthropicLLMClient を使用する。
未設定の場合は StubLLMClient にフォールバックし、テスト環境・CI での安定動作を保証する。

なぜ stub を最初に固定したか:
    - Acceptance 2 #5 "reasoning_summary が確認できる" は LLM 実装の有無に依らず
      AI Gateway 経路の **契約** として満たさなければならない (ADR-006).
    - 本物 LLM 接続は Pilot 時点 (BL-013 統合) で SLA / Cost / Rate Limit を
      個別検討するため、Sprint 2 では切り離して進めた.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass(frozen=True)
class LLMResponse:
    """LLM 1 ターン応答.

    response_text     : Caller に返す本文.
    reasoning_summary : Acceptance 2 #5 / ADR-006. chain-of-thought ではなく "Why".
    """

    response_text: str
    reasoning_summary: str


class LLMClient(Protocol):
    def invoke(
        self,
        *,
        provider: str,
        model: str,
        prompt: str,
        context_refs: list[str],
    ) -> LLMResponse:
        ...


@dataclass
class StubLLMClient:
    """Test / Sprint 2 単体起動時の stub.

    決定的な応答を返すことで test の安定性を確保する。
    呼び出し履歴は ``calls`` に保持し、test で
    "本当に provider が書き換えられた" などを assertion 可能にする。
    """

    calls: list[dict[str, Any]] = field(default_factory=list)

    def invoke(
        self,
        *,
        provider: str,
        model: str,
        prompt: str,
        context_refs: list[str],
    ) -> LLMResponse:
        self.calls.append(
            {
                "provider": provider,
                "model": model,
                "prompt": prompt,
                "context_refs": list(context_refs),
            }
        )
        text = f"[stub:{provider}/{model}] echoes: {prompt[:80]}"
        ctx_count = len(context_refs)
        why = (
            f"Stub LLM produced this answer using {ctx_count} context reference(s). "
            f"Provider={provider}, model={model}. "
            "本回答は Sprint 2 stub 実装に基づくもので、Sprint 3 以降で本物 LLM に差し替えられる。"
        )
        return LLMResponse(response_text=text, reasoning_summary=why)


@dataclass
class AnthropicLLMClient:
    """Real Anthropic Claude client using ANTHROPIC_API_KEY env var (Sprint 3).

    Instantiated only when ANTHROPIC_API_KEY is set; otherwise StubLLMClient is used.
    The _client is lazy-initialized to avoid import-time side effects in test environments.
    """

    _client: Any = field(default=None, init=False, repr=False)

    def _get_client(self) -> Any:
        if self._client is None:
            api_key = os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                raise RuntimeError(
                    "AnthropicLLMClient requires ANTHROPIC_API_KEY. "
                    "Either set the environment variable or use StubLLMClient."
                )
            import anthropic  # lazy import: keep test environments free of the dep

            self._client = anthropic.Anthropic(api_key=api_key)
        return self._client

    def invoke(
        self,
        *,
        provider: str,
        model: str,
        prompt: str,
        context_refs: list[str],
    ) -> LLMResponse:
        client = self._get_client()
        message = client.messages.create(
            model=model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text: str = message.content[0].text
        ctx_count = len(context_refs)
        reasoning_summary = (
            f"Anthropic {model} responded via provider={provider}. "
            f"{ctx_count} context reference(s) provided. "
            f"input_tokens={message.usage.input_tokens}, "
            f"output_tokens={message.usage.output_tokens}."
        )
        return LLMResponse(response_text=response_text, reasoning_summary=reasoning_summary)
