"""Tests for the embedding/vector retrieval paths (DB calls are mocked)."""
from __future__ import annotations

from types import SimpleNamespace

import pytest
from itsm_api.services import rag_engine


class _FakeArticle:
    def __init__(self, aid: str, title: str, summary: str, content: str) -> None:
        self.article_id = aid
        self.title = title
        self.summary = summary
        self.content = content


def test_embed_texts_returns_none_without_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        rag_engine,
        "get_settings",
        lambda: SimpleNamespace(
            azure_openai_endpoint="",
            azure_openai_api_key="",
            azure_openai_api_version="v1",
            azure_openai_deployment="x",
            azure_openai_embedding_deployment="emb",
        ),
    )
    assert rag_engine.embed_texts(["hello"]) is None
    assert rag_engine.embed_one("hello") is None


def test_keyword_fallback_when_no_embedding(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(rag_engine, "embed_one", lambda _q: None)

    fake = [
        _FakeArticle("a1", "VPN接続トラブル", "FortiClient再起動", "詳細手順..."),
        _FakeArticle("a2", "プリンタ設定", "ドライバ再インストール", "..."),
    ]

    class FakeScalars:
        def all(self):
            return fake

    class FakeResult:
        def scalars(self):
            return FakeScalars()

    class FakeDb:
        def execute(self, _stmt):
            return FakeResult()

    out = rag_engine.retrieve(FakeDb(), "VPN", k=3)
    assert out
    assert out[0].title == "VPN接続トラブル"


def test_vector_retrieve_uses_pgvector(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(rag_engine, "embed_one", lambda _q: [0.1] * 1536)

    captured: dict = {}

    class FakeRow:
        def __init__(self, aid, title, summary, distance):
            self.article_id = aid
            self.title = title
            self.summary = summary
            self.content = summary
            self.distance = distance

    class FakeResult:
        def __init__(self, rows):
            self._rows = rows

        def all(self):
            return self._rows

    class FakeDb:
        def execute(self, stmt, params):
            captured["sql"] = str(stmt)
            captured["params"] = params
            return FakeResult(
                [
                    FakeRow("a1", "VPN", "snippet1", 0.10),
                    FakeRow("a2", "MFA", "snippet2", 0.30),
                ]
            )

    out = rag_engine.retrieve(FakeDb(), "VPN", k=2)
    assert "embedding <=>" in captured["sql"]
    assert "k" in captured["params"] and captured["params"]["k"] == 2
    assert out[0].article_id == "a1"
    assert out[0].score == pytest.approx(0.9, abs=1e-3)
    assert out[1].score == pytest.approx(0.7, abs=1e-3)


def test_stream_chat_stub_yields_once(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        rag_engine,
        "get_settings",
        lambda: SimpleNamespace(
            azure_openai_endpoint="",
            azure_openai_api_key="",
            azure_openai_api_version="v1",
            azure_openai_deployment="x",
            azure_openai_embedding_deployment="emb",
        ),
    )
    chunks = list(rag_engine.stream_chat([{"role": "user", "content": "hello"}]))
    assert chunks == ["[stub-response] " + "参考ナレッジ:"[:0] + "hello"[:200]] or len(chunks) == 1
    assert chunks[0].startswith("[stub-response]")
