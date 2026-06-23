---
id: "0009"
title: "Phase 3: 中央管理 WebUI 最小版"
status: done
priority: P2
phase: "Phase 3"
labels: [webui, frontend, server]
created: "2026-04-16"
---

## Summary

cdx-server に管理用 WebUI を追加する。デバイス一覧・ハートビート状態・
インベントリ閲覧が最低限の機能。Phase 2 PostgreSQL が前提。

## Scope

Phase 3 最小 MVP として以下を対象とする:

- デバイス一覧画面 (device_id / profile / registered_at)
- ハートビート履歴 (デバイス別、直近 N 件)
- インベントリ詳細 (JSON viewer)
- ポリシー一覧・編集 (heartbeat_interval / inventory_interval)

Phase 4 以降に繰り延べ:
- 認証付き管理者ログイン
- デバイスへのコマンド送信
- アラート/通知

## Design Options

| 方式 | 利点 | 欠点 |
|---|---|---|
| FastAPI + Jinja2 SSR | 依存追加なし | リアルタイム更新なし |
| React SPA (Vite) | リッチ UI | ビルド追加 |
| HTMX + Jinja2 | 軽量・サーバーサイド | マイナーエコシステム |

**推奨: FastAPI + Jinja2 SSR (MVP)** — 依存最小、既存 endpoint を再利用。

## Acceptance Criteria

- [x] `/admin` に認証なし管理 UI (dev モード限定で Bearer 不要)
- [x] デバイス一覧テーブル (device_id / profile / hostname / registered_at)
- [x] ハートビート一覧 (device 別フィルタ、直近 20 件)
- [x] `/health` バッジ表示 (storage: ok/error)
- [x] レスポンシブ対応 (モバイルで見られる程度)
- [x] テスト追加 (TestClient で HTML レスポンス確認)

## Dependencies

- Issue 0007 (PostgreSQL) — 完了 ✅
- Jinja2 を `pyproject.toml` dependencies に追加
- `server/api/cdx_server/routers/admin.py` 新設
- `server/api/templates/` ディレクトリ追加

## Notes

- 初期は admin エンドポイントへの認証なし (ローカル/VPN 限定運用想定)
- Phase 4 で OIDC/ldap 認証を追加予定
- Construction Hub ランチャーからリンクを貼る
