"""audit-service entrypoint (Sprint 0).

起動例:
    uvicorn app.main:app --port 8003 --reload
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import audit_events as audit_events_api

_cors_origins = [
    o.strip()
    for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
]

app = FastAPI(
    title="Synapse-OS Audit Service",
    version="0.0.1-sprint0",
    description=(
        "Sprint 0 minimum Audit Event ingest API. "
        "Schema は synapse_shared.audit_base.AuditEvent を採用。"
        "永続化は in-memory + JSONL (Append Only)。"
        "WORM (Object Lock) と Hash Chain 検証は Sprint 1 以降。"
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audit_events_api.router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "audit-service", "sprint": "0"}
