"""FastAPI entrypoint for Corporate Operation Platform."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes import (
    accounting,
    archives,
    contracts,
    costs,
    dashboard,
    invoices,
    legal,
    payables,
    receivables,
)

app = FastAPI(
    title="Corporate Operation Platform API",
    version="0.1.0",
    description="経理 / 原価 / 契約 / 法務 / 総務 / 人事 (電子帳簿保存法 / インボイス制度 / 建設業法 準拠)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.api_prefix
app.include_router(accounting.router, prefix=f"{prefix}/accounting", tags=["accounting"])
app.include_router(costs.router, prefix=f"{prefix}/costs", tags=["costs"])
app.include_router(invoices.router, prefix=f"{prefix}/invoices", tags=["invoices"])
app.include_router(payables.router, prefix=f"{prefix}/payables", tags=["payables"])
app.include_router(receivables.router, prefix=f"{prefix}/receivables", tags=["receivables"])
app.include_router(contracts.router, prefix=f"{prefix}/contracts", tags=["contracts"])
app.include_router(legal.router, prefix=f"{prefix}/legal", tags=["legal"])
app.include_router(archives.router, prefix=f"{prefix}/archives", tags=["archives"])
app.include_router(dashboard.router, prefix=f"{prefix}/dashboard", tags=["dashboard"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
