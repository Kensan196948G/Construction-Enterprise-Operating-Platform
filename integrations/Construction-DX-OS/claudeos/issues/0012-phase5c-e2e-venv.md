# Issue 0012 — Phase 5c: E2E 統合テスト + venv 整備

**Priority:** P2  
**Status:** closed ✅
**Closed:** 2026-04-22 (Loop 25)  
**Owner:** QA → Developer  
**Created:** 2026-04-22  
**Depends on:** Issue 0011 (done)

---

## Summary

Phase 5a+5b 完了により SDK 自動生成と OIDC 認証が動作する。
次のステップとして以下2件を実装する。

### 5c-1 — 開発環境 venv 整備

現在グローバル Python 環境に `pip install --break-system-packages` で
`fakeredis` + `lupa` をインストールしている状態。
本来は `server/api/` 内の venv で `pip install -e ".[dev]"` を使う。

- `server/api/setup_dev.sh` (または Makefile target `make dev-install`) を追加
- CI は既に `pip install -e ".[dev]"` を使用しているため問題なし
- ローカル開発者向けの CONTRIBUTING.md または README に手順を明記

### 5c-2 — 生成 SDK の E2E スモークテスト

生成された Python SDK (`cdx_client`) を使って cdx-server に実際にリクエストを投げる
E2E テストを追加する。

- `tests/test_sdk_smoke.py` を追加
- TestClient + cdx_client の API クラスを直接呼び出す
- 対象エンドポイント: `/health`, `/api/v1/devices/register`, `/api/v1/heartbeat/{id}`

---

## Reason

- venv 未整備は新規コントリビューターのオンボーディング障壁になる
- SDK が生成されても使われなければ品質保証できない
- E2E テストは SDK drift 検知の補完として機能する

---

## Acceptance Criteria

### 5c-1 (venv)
- [x] `make dev-install` で venv + dev deps がセットアップされる
- [ ] README に venv セットアップ手順が追記される (次ループ)
- [x] 248 テスト (134 server + 114 agent) 全通過

### 5c-2 (E2E SDK)
- [x] `tests/test_sdk_smoke.py` が追加される（3 テストケース）
- [x] cdx_client の `HealthApi`, `DevicesApi`, 6 API classes を実サーバー越しに呼ぶ
- [x] 既存の 245 テストが引き続き通過（計 248 テスト green）

---

## Project Sync

- Project: Construction-DX-OS (ローカル管理)  
- Status: open  
- Priority: P2  
- Phase: Phase 5c
