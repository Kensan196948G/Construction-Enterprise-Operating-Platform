"""Synapse-OS Lightweight WebUI Server.

.. deprecated::
    This single-file FastAPI + HTML WebUI is DEPRECATED and superseded by the
    canonical frontend in ``web/`` (Next.js 14, JWT auth + httpOnly session,
    served on :3000 / docker-compose service ``web``).

    It is retained only as a no-auth local dev/demo dashboard (:3002) and MUST
    NOT receive new features. Add UI work to ``web/`` instead. See
    ``docs/DOCUMENTATION_MAP.md`` ("Canonical Sources") for the source-of-truth
    policy. Removal is planned once ``web/`` covers the demo use case; do not
    delete the running systemd service (``synapse-webui.service``) without
    operator approval.

.. warning::
    KNOWN SECURITY ISSUES (accepted only because this is deprecated dev-only
    code scheduled for removal — do NOT expose on a network):
      * Reflected/Stored XSS — backend JSON is interpolated into HTML via
        f-strings without escaping (``item.get(...)``, ``oid``, ``badge_status``).
      * SSRF / query injection — ``tenant_id`` from the request is concatenated
        into the upstream service URL without validation.
    Mitigation: bind to 127.0.0.1 (see ``synapse-webui.service``) so these are
    not remotely reachable, and migrate to ``web/`` which renders via React
    (auto-escaping) and proxies APIs server-side. Do not add features here.

Single-file FastAPI + HTML WebUI for local dev / demo.
No authentication required (dev mode — disable before production).
Accessible at http://127.0.0.1:3002 (loopback only — see synapse-webui.service).
"""

import os
import asyncio
from typing import Any

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse

app = FastAPI(title="Synapse-OS WebUI", docs_url=None, redoc_url=None)

# Backend service URLs
SERVICES = {
    "object": os.getenv("OBJECT_API", "http://localhost:8004"),
    "workflow": os.getenv("WORKFLOW_API", "http://localhost:8005"),
    "policy": os.getenv("POLICY_API", "http://localhost:8002"),
    "audit": os.getenv("AUDIT_API", "http://localhost:8003"),
    "ai_gateway": os.getenv("AI_GATEWAY_API", "http://localhost:8006"),
    "federation": os.getenv("FEDERATION_API", "http://localhost:8007"),
    "knowledge": os.getenv("KNOWLEDGE_API", "http://localhost:8008"),
    "dashboard": os.getenv("DASHBOARD_API", "http://localhost:8009"),
    "auth": os.getenv("AUTH_API", "http://localhost:8001"),
}
DEFAULT_TENANT = os.getenv("DEFAULT_TENANT", "demo")

NAV_ITEMS = [
    ("ダッシュボード", "/", "📊"),
    ("課題管理", "/issues", "📋"),
    ("承認管理", "/approvals", "✅"),
    ("AIガバナンス", "/ai-governance", "🤖"),
    ("フェデレーション", "/federation", "🌐"),
    ("監査ログ", "/audit", "🔐"),
    ("ナレッジベース", "/knowledge", "📚"),
]

# Service display names in Japanese
SERVICE_LABELS = {
    "identity": "認証基盤",
    "policy": "ポリシー",
    "audit": "監査",
    "object": "オブジェクト",
    "workflow": "ワークフロー",
    "ai-gw": "AIゲートウェイ",
    "federation": "フェデレーション",
    "knowledge": "ナレッジ",
    "dashboard": "ダッシュボード",
}

HTML_BASE = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Synapse-OS — {title}</title>
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans JP',sans-serif;background:#f8fafc;color:#1e293b;display:flex;min-height:100vh}}
    .sidebar{{width:220px;background:#0f172a;color:#cbd5e1;padding:20px 0;flex-shrink:0;position:fixed;height:100vh;overflow-y:auto}}
    .sidebar-logo{{padding:0 20px 20px;border-bottom:1px solid #1e293b;margin-bottom:8px}}
    .sidebar-logo h1{{font-size:15px;font-weight:700;color:#f1f5f9;line-height:1.2}}
    .sidebar-logo p{{font-size:10px;color:#64748b;margin-top:2px}}
    .nav-item{{display:block;padding:10px 20px;color:#94a3b8;text-decoration:none;font-size:13px;border-left:3px solid transparent;transition:all .15s}}
    .nav-item:hover{{background:#1e293b;color:#e2e8f0;border-left-color:#475569}}
    .nav-item.active{{background:#1e293b;color:#f1f5f9;border-left-color:#3b82f6}}
    .nav-icon{{margin-right:8px}}
    main{{margin-left:220px;padding:28px 32px;flex:1;max-width:1200px}}
    h2{{font-size:20px;font-weight:600;color:#0f172a;margin-bottom:20px}}
    .badge{{font-size:11px;padding:2px 8px;border-radius:9999px;font-weight:500}}
    .badge-blue{{background:#dbeafe;color:#1d4ed8}}
    .badge-green{{background:#dcfce7;color:#166534}}
    .badge-amber{{background:#fef9c3;color:#854d0e}}
    .badge-red{{background:#fee2e2;color:#991b1b}}
    .card{{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:16px}}
    .stat-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:24px}}
    .stat-card{{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:20px}}
    .stat-card.warn{{background:#fffbeb;border-color:#fde68a}}
    .stat-card.danger{{background:#fff1f2;border-color:#fecdd3}}
    .stat-value{{font-size:28px;font-weight:700;color:#0f172a;line-height:1}}
    .stat-label{{font-size:12px;color:#64748b;margin-top:6px}}
    table{{width:100%;border-collapse:collapse;font-size:13px}}
    th{{text-align:left;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;font-size:11px;letter-spacing:.04em}}
    td{{padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#334155}}
    tr:last-child td{{border-bottom:none}}
    tr:hover td{{background:#f8fafc}}
    .empty{{text-align:center;padding:40px;color:#94a3b8;font-size:14px}}
    .error-banner{{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;color:#dc2626;font-size:13px;margin-bottom:16px}}
    .status-bar{{font-size:11px;color:#64748b;margin-bottom:24px;padding:10px 14px;background:#f1f5f9;border-radius:8px;display:flex;gap:16px;flex-wrap:wrap;align-items:center}}
    .status-bar-label{{font-weight:600;color:#475569;margin-right:4px}}
    .status-dot{{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:4px}}
    .dot-green{{background:#22c55e}}
    .dot-red{{background:#ef4444}}
    a{{color:#3b82f6;text-decoration:none}}
    a:hover{{text-decoration:underline}}
    .section-title{{font-size:11px;font-weight:600;color:#64748b;letter-spacing:.06em;margin-bottom:12px;margin-top:24px;padding-bottom:4px;border-bottom:1px solid #f1f5f9}}
  </style>
</head>
<body>
<nav class="sidebar">
  <div class="sidebar-logo">
    <h1>🧠 Synapse-OS</h1>
    <p>AI ガバナンス基盤</p>
  </div>
  {nav_html}
</nav>
<main>
  {content}
</main>
</body>
</html>"""


def render(title: str, content: str, active_path: str = "/") -> HTMLResponse:
    nav_parts = []
    for label, path, icon in NAV_ITEMS:
        cls = "nav-item active" if path == active_path else "nav-item"
        nav_parts.append(
            f'<a class="{cls}" href="{path}"><span class="nav-icon">{icon}</span>{label}</a>'
        )
    nav_html = "\n".join(nav_parts)
    html = HTML_BASE.format(title=title, nav_html=nav_html, content=content)
    return HTMLResponse(html)


async def fetch_json(url: str, default: Any = None) -> Any:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(url)
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass
    return default


async def service_status() -> str:
    checks = [
        ("identity", f"{SERVICES['auth']}/healthz"),
        ("policy", f"{SERVICES['policy']}/healthz"),
        ("audit", f"{SERVICES['audit']}/healthz"),
        ("object", f"{SERVICES['object']}/healthz"),
        ("workflow", f"{SERVICES['workflow']}/healthz"),
        ("ai-gw", f"{SERVICES['ai_gateway']}/healthz"),
        ("federation", f"{SERVICES['federation']}/healthz"),
        ("knowledge", f"{SERVICES['knowledge']}/healthz"),
        ("dashboard", f"{SERVICES['dashboard']}/healthz"),
    ]
    parts = ['<span class="status-bar-label">🔧 サービス状態:</span>']
    async with httpx.AsyncClient(timeout=1.5) as client:
        tasks = [client.get(url) for _, url in checks]
        results = await asyncio.gather(*tasks, return_exceptions=True)
    for (name, _), r in zip(checks, results):
        ok = isinstance(r, httpx.Response) and r.status_code < 500
        dot = "dot-green" if ok else "dot-red"
        label = SERVICE_LABELS.get(name, name)
        parts.append(f'<span><span class="status-dot {dot}"></span>{label}</span>')
    return '<div class="status-bar">' + "".join(parts) + "</div>"


STATUS_JA = {
    "open": "未対応",
    "pending": "承認待ち",
    "in_progress": "対応中",
    "approved": "承認済",
    "done": "完了",
    "closed": "クローズ",
    "active": "有効",
    "rejected": "却下",
    "failed": "失敗",
    "error": "エラー",
    "allow": "許可",
    "deny": "拒否",
    "high": "高",
    "medium": "中",
    "low": "低",
    "yes": "あり",
    "no": "なし",
}

PRIORITY_JA = {"high": "高", "medium": "中", "low": "低", "critical": "緊急"}


def badge_status(s: str) -> str:
    key = s.lower()
    label = STATUS_JA.get(key, s)
    if key in ("open", "pending", "in_progress"):
        return f'<span class="badge badge-amber">{label}</span>'
    if key in ("approved", "done", "closed", "active", "allow"):
        return f'<span class="badge badge-green">{label}</span>'
    if key in ("rejected", "failed", "error", "deny"):
        return f'<span class="badge badge-red">{label}</span>'
    return f'<span class="badge badge-blue">{label}</span>'


def jp(key: str, val: str) -> str:
    """Return Japanese label for known enum values."""
    return STATUS_JA.get(val.lower(), val)


# ───────── Routes ─────────


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    data = await fetch_json(
        f"{SERVICES['dashboard']}/dashboard/overview?tenant_id={DEFAULT_TENANT}", {}
    )
    eh = data.get("enterprise_health", {})
    ai = data.get("ai_activity", {})
    dlp = data.get("dlp_alerts", {})
    fed = data.get("federation_stats", {})

    err = (
        ""
        if data
        else '<div class="error-banner">⚠️ ダッシュボード API に接続できません — 値は空表示</div>'
    )
    svc_bar = await service_status()

    def sc(label: str, value: Any, variant: str = "") -> str:
        return f'<div class="stat-card {variant}"><div class="stat-value">{value}</div><div class="stat-label">{label}</div></div>'

    content = f"""
{err}
{svc_bar}
<h2>📊 エンタープライズ ヘルス ダッシュボード</h2>
<div class="section-title">📋 ガバナンス指標</div>
<div class="stat-grid">
  {sc("未対応課題", eh.get("open_issue_count", 0), "warn" if eh.get("open_issue_count", 0) > 10 else "")}
  {sc("承認待ち", eh.get("pending_approval_count", 0), "warn" if eh.get("pending_approval_count", 0) > 0 else "")}
  {sc("重大監査イベント", eh.get("critical_audit_count", 0), "danger" if eh.get("critical_audit_count", 0) > 0 else "")}
</div>
<div class="section-title">🤖 AI アクティビティ</div>
<div class="stat-grid">
  {sc("AI アクション数", ai.get("ai_action_count", 0))}
  {sc("高リスク AI アクション", ai.get("high_ai_risk_count", 0), "danger" if ai.get("high_ai_risk_count", 0) > 0 else "")}
  {sc("外部 AI ブロック", ai.get("external_ai_block_count", 0), "warn" if ai.get("external_ai_block_count", 0) > 0 else "")}
</div>
<div class="section-title">🌐 DLP & フェデレーション</div>
<div class="stat-grid">
  {sc("DLP 違反", dlp.get("dlp_violation_count", 0), "danger" if dlp.get("dlp_violation_count", 0) > 0 else "")}
  {sc("フェデレーション申請", fed.get("pending_federation_request_count", 0))}
  {sc("トラスト警告", fed.get("trust_warning_count", 0), "warn" if fed.get("trust_warning_count", 0) > 0 else "")}
</div>"""
    return render("ダッシュボード", content, "/")


@app.get("/issues", response_class=HTMLResponse)
async def issues_page(request: Request):
    tenant = request.query_params.get("tenant_id", DEFAULT_TENANT)
    data = await fetch_json(f"{SERVICES['object']}/issues?tenant_id={tenant}", [])
    rows = ""
    if data:
        for item in data:
            oid = item.get("object_id", "—")
            pri = item.get("priority", "—")
            pri_label = PRIORITY_JA.get(pri.lower(), pri) if pri != "—" else "—"
            rows += f"""<tr>
              <td><a href="#">{oid[:16]}…</a></td>
              <td>{item.get("title", "—")}</td>
              <td>{badge_status(item.get("status", "—"))}</td>
              <td>{pri_label}</td>
              <td>{item.get("classification", "—")}</td>
              <td>{item.get("created_at", "—")[:10]}</td>
            </tr>"""
    else:
        rows = '<tr><td colspan="6" class="empty">📭 課題データがありません</td></tr>'

    content = f"""
<h2>📋 課題管理</h2>
<div class="card">
<table>
  <thead><tr><th>ID</th><th>タイトル</th><th>ステータス</th><th>優先度</th><th>分類</th><th>登録日</th></tr></thead>
  <tbody>{rows}</tbody>
</table>
</div>"""
    return render("課題管理", content, "/issues")


@app.get("/approvals", response_class=HTMLResponse)
async def approvals_page(request: Request):
    tenant = request.query_params.get("tenant_id", DEFAULT_TENANT)
    data = await fetch_json(f"{SERVICES['workflow']}/approvals?tenant_id={tenant}", [])
    rows = ""
    if data:
        for item in data:
            oid = item.get("object_id", "—")
            decision = item.get("final_decision", "—")
            decision_label = (
                STATUS_JA.get(decision.lower(), decision) if decision != "—" else "—"
            )
            rows += f"""<tr>
              <td><a href="#">{oid[:16]}…</a></td>
              <td>{item.get("title", "—")}</td>
              <td>{badge_status(item.get("status", "—"))}</td>
              <td>{decision_label}</td>
              <td>{item.get("actor_id", "—")}</td>
              <td>{item.get("created_at", "—")[:10]}</td>
            </tr>"""
    else:
        rows = '<tr><td colspan="6" class="empty">📭 承認データがありません</td></tr>'

    content = f"""
<h2>✅ 承認管理</h2>
<div class="card">
<table>
  <thead><tr><th>ID</th><th>タイトル</th><th>ステータス</th><th>最終決裁</th><th>担当者</th><th>申請日</th></tr></thead>
  <tbody>{rows}</tbody>
</table>
</div>"""
    return render("承認管理", content, "/approvals")


@app.get("/ai-governance", response_class=HTMLResponse)
async def ai_governance_page(request: Request):
    tenant = request.query_params.get("tenant_id", DEFAULT_TENANT)
    data = await fetch_json(
        f"{SERVICES['ai_gateway']}/ai-actions?tenant_id={tenant}", []
    )
    rows = ""
    if data:
        for item in data:
            risk = item.get("risk_score", 0)
            conf = item.get("confidence_score", 0)
            risk_badge_cls = (
                "badge-red"
                if risk > 0.7
                else ("badge-amber" if risk > 0.3 else "badge-green")
            )
            risk_label = "高" if risk > 0.7 else ("中" if risk > 0.3 else "低")
            rows += f"""<tr>
              <td>{item.get("object_id", "—")[:16]}…</td>
              <td>{item.get("actor_id", "—")}</td>
              <td>{item.get("reasoning_summary", "—")[:60]}</td>
              <td><span class="badge {risk_badge_cls}">{risk_label} ({risk:.2f})</span></td>
              <td>{conf:.2f}</td>
              <td>{item.get("created_at", "—")[:10]}</td>
            </tr>"""
    else:
        rows = '<tr><td colspan="6" class="empty">📭 AI アクションデータがありません</td></tr>'

    content = f"""
<h2>🤖 AI ガバナンス</h2>
<div class="card">
<table>
  <thead><tr><th>ID</th><th>実行者</th><th>推論サマリ</th><th>リスクスコア</th><th>信頼度</th><th>実行日</th></tr></thead>
  <tbody>{rows}</tbody>
</table>
</div>"""
    return render("AI ガバナンス", content, "/ai-governance")


@app.get("/federation", response_class=HTMLResponse)
async def federation_page(request: Request):
    tenant = request.query_params.get("tenant_id", DEFAULT_TENANT)
    data = await fetch_json(
        f"{SERVICES['federation']}/federation-events?tenant_id={tenant}", []
    )
    rows = ""
    if data:
        for item in data:
            dlp_triggered = item.get("dlp_triggered", False)
            dlp_label = "あり" if dlp_triggered else "なし"
            dlp_cls = "badge-red" if dlp_triggered else "badge-green"
            rows += f"""<tr>
              <td>{item.get("object_id", "—")[:16]}…</td>
              <td>{item.get("source_tenant_id", "—")}</td>
              <td>{item.get("target_tenant_id", "—")}</td>
              <td>{item.get("trust_level", "—")}</td>
              <td><span class="badge {dlp_cls}">{dlp_label}</span></td>
              <td>{badge_status(item.get("status", "—"))}</td>
              <td>{item.get("created_at", "—")[:10]}</td>
            </tr>"""
    else:
        rows = '<tr><td colspan="7" class="empty">📭 フェデレーションイベントがありません</td></tr>'

    content = f"""
<h2>🌐 フェデレーション</h2>
<div class="card">
<table>
  <thead><tr><th>ID</th><th>送信元テナント</th><th>送信先テナント</th><th>信頼レベル</th><th>DLP 検知</th><th>ステータス</th><th>発生日</th></tr></thead>
  <tbody>{rows}</tbody>
</table>
</div>"""
    return render("フェデレーション", content, "/federation")


@app.get("/audit", response_class=HTMLResponse)
async def audit_page(request: Request):
    tenant = request.query_params.get("tenant_id", DEFAULT_TENANT)
    data = await fetch_json(f"{SERVICES['audit']}/audit-events?tenant_id={tenant}", [])
    rows = ""
    if data:
        for item in data:
            rows += f"""<tr>
              <td>{item.get("audit_event_id", "—")[:16]}…</td>
              <td>{item.get("event_type", "—")}</td>
              <td>{item.get("actor_id", "—")}</td>
              <td>{badge_status(item.get("policy_result", "—"))}</td>
              <td>{item.get("occurred_at", "—")[:10]}</td>
            </tr>"""
    else:
        rows = '<tr><td colspan="5" class="empty">📭 監査ログがありません</td></tr>'

    content = f"""
<h2>🔐 監査ログ</h2>
<div class="card">
<table>
  <thead><tr><th>監査ID</th><th>イベント種別</th><th>実行者</th><th>ポリシー結果</th><th>発生日</th></tr></thead>
  <tbody>{rows}</tbody>
</table>
</div>"""
    return render("監査ログ", content, "/audit")


@app.get("/knowledge", response_class=HTMLResponse)
async def knowledge_page(request: Request):
    data = await fetch_json(f"{SERVICES['knowledge']}/knowledge-items", [])
    rows = ""
    if data:
        for item in data:
            rows += f"""<tr>
              <td>{item.get("object_id", "—")[:16]}…</td>
              <td>{item.get("title", "—")}</td>
              <td>{item.get("knowledge_type", "—")}</td>
              <td>{item.get("tenant_id", "—")}</td>
              <td>{item.get("created_at", "—")[:10]}</td>
            </tr>"""
    else:
        rows = '<tr><td colspan="5" class="empty">📭 ナレッジアイテムがありません</td></tr>'

    content = f"""
<h2>📚 ナレッジベース</h2>
<div class="card">
<table>
  <thead><tr><th>ID</th><th>タイトル</th><th>種別</th><th>テナント</th><th>登録日</th></tr></thead>
  <tbody>{rows}</tbody>
</table>
</div>"""
    return render("ナレッジベース", content, "/knowledge")


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "3002"))
    uvicorn.run(app, host=host, port=port, log_level="warning")
