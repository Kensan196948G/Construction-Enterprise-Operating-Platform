"""AI HelpDesk endpoint (RAG over knowledge articles).

Provides two routes:

* ``POST /api/v1/ai/chat``         - single-shot JSON answer (legacy)
* ``POST /api/v1/ai/chat/stream``  - Server-Sent Events streaming:
   - ``event: token`` lines carry incremental assistant text
   - one terminal ``event: sources`` line carries the citation list
   - ``event: done`` signals completion
"""
from __future__ import annotations

import json
from collections.abc import Iterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from itsm_api.db.session import get_db
from itsm_api.deps import get_current_user
from itsm_api.schemas import HelpdeskAnswer, HelpdeskQuery, HelpdeskSource
from itsm_api.services.rag_engine import (
    build_prompt,
    retrieve,
    run_chat,
    stream_chat,
)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


def _sources_payload(sources) -> list[dict]:
    return [
        {"article_id": s.article_id, "title": s.title, "score": s.score, "snippet": s.snippet}
        for s in sources
    ]


@router.post("/chat", response_model=HelpdeskAnswer)
def chat(
    payload: HelpdeskQuery,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> HelpdeskAnswer:
    sources = retrieve(db, payload.query, k=payload.top_k)
    messages = build_prompt(payload.query, sources)
    answer = run_chat(messages)
    return HelpdeskAnswer(
        answer=answer,
        sources=[
            HelpdeskSource(
                article_id=s.article_id, title=s.title, score=s.score, snippet=s.snippet
            )
            for s in sources
        ],
    )


def _sse_format(event: str, data: str) -> str:
    # SSE: each data line is "data: ...\n", terminated by an empty line
    return f"event: {event}\ndata: {data}\n\n"


def sse_event_stream(query: str, top_k: int, db: Session) -> Iterator[bytes]:
    sources = retrieve(db, query, k=top_k)
    messages = build_prompt(query, sources)
    for chunk in stream_chat(messages):
        if not chunk:
            continue
        yield _sse_format("token", json.dumps({"text": chunk}, ensure_ascii=False)).encode("utf-8")
    yield _sse_format(
        "sources", json.dumps(_sources_payload(sources), ensure_ascii=False)
    ).encode("utf-8")
    yield _sse_format("done", "{}").encode("utf-8")


@router.post("/chat/stream")
def chat_stream(
    payload: HelpdeskQuery,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> StreamingResponse:
    return StreamingResponse(
        sse_event_stream(payload.query, payload.top_k, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
