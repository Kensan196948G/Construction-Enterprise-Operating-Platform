"""Tests for the AI HelpDesk SSE endpoint (logic only, no FastAPI client)."""
from __future__ import annotations

from itsm_api.routes import ai_helpdesk
from itsm_api.services import rag_engine
from itsm_api.services.rag_engine import RagSource


def test_sse_event_stream_yields_tokens_then_sources(monkeypatch) -> None:
    sources = [RagSource(article_id="a1", title="T1", score=0.9, snippet="snip")]
    monkeypatch.setattr(rag_engine, "retrieve", lambda _db, _q, k=3: sources)
    monkeypatch.setattr(ai_helpdesk, "retrieve", lambda _db, _q, k=3: sources)
    monkeypatch.setattr(ai_helpdesk, "stream_chat", lambda _msgs: iter(["こんにちは、", "答えです。"]))

    out = list(ai_helpdesk.sse_event_stream("VPN", 3, db=None))
    decoded = [b.decode("utf-8") for b in out]
    assert any("event: token" in d and "こんにちは" in d for d in decoded)
    assert any("event: token" in d and "答えです" in d for d in decoded)
    sources_lines = [d for d in decoded if d.startswith("event: sources")]
    assert len(sources_lines) == 1
    assert "T1" in sources_lines[0]
    assert decoded[-1].startswith("event: done")
