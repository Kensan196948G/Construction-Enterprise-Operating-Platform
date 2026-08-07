---
id: "0005"
title: "Phase 1 vertical slice: cdx-server FastAPI + contract test"
status: done
priority: P1
phase: "Phase 1"
labels: [server, integration, contract]
created: "2026-04-15"
closed: "2026-04-15"
related: ["0002"]
---

## Summary

cdx-server を FastAPI で最小実装し、cdx-agent ↔ cdx-server の署名疎通を
contract test で固定する。Phase 2 で PostgreSQL を足しても既存契約が
崩れないよう「今のうちに境界を固める」。

## Scope

- `server/api/cdx_server/` パッケージ:
  - routers/: health, devices/register, heartbeat, inventory
  - auth.py: HMAC-SHA256 検証 (agent.sign と canonical を完全一致)
  - schemas.py: Pydantic v2 request/response
  - storage.py: 冪等性キー付き in-memory dict (thread-safe)
- `pyproject.toml`: fastapi + pydantic v2 + uvicorn 依存
- `tests/`: 9 unit test (health/devices/auth/heartbeat/inventory/storage)
- `tests/contract/`: 4 contract test (heartbeat/inventory roundtrip, sync drain, unregistered device)
- CI: cdx-server job に cdx-agent を editable インストール

## Acceptance Criteria

- [x] `GET /health` が `{"status": "ok", ...}` を返す
- [x] `POST /api/v1/devices/register` が冪等 (2回目は already_registered=true)
- [x] `POST /api/v1/heartbeat` が署名不一致で 401
- [x] `POST /api/v1/inventory` が同一 bucket で duplicate=true
- [x] agent の ApiClient を FastAPI TestClient 経由で POST して疎通
- [x] unregistered device が 401 で拒否
- [x] 25 unit test + contract test green

## Phase 2 持ち越し

- PostgreSQL への swap (storage Protocol を守って実装差し替え)
- migration 基盤 (Alembic)
- 認証を HMAC 共有鍵から端末証明書へ置換
- observability (structured logging + metrics)
- rate limiting
- update-status / policy / alerts エンドポイント

## Lesson learned

- FastAPI の `Depends(_get_storage)` パターンで `app.dependency_overrides` を使うと test isolation が自然にできる
- HMAC 検証は「body を parse する前」が鉄則 → pydantic による早期 validation より先に署名を検証
- TestClient は httpx.Client 互換なので ApiClient の session として直接差し込める (socket 不要)
