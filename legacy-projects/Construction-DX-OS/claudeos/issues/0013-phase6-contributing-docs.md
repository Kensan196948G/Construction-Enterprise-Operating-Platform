# Issue 0013 — Phase 6: 開発者オンボーディング + docs 整備

**Priority:** P3  
**Status:** closed ✅  
**Closed:** 2026-04-22 (Loop 26)  
**Owner:** Developer  
**Created:** 2026-04-22  
**Depends on:** Issue 0012 (done)

---

## Summary

Phase 5 全完了後、GitHub remote (Issue 0004) を待つ間に開発者体験 (DX) を改善する。
具体的には以下を実装する。

### 6-1 — CONTRIBUTING.md 作成

- 前提条件、venv 詳細手順（`make dev-install` 解説）
- テスト実行方法（個別 / 全体 / カバレッジ）
- コードスタイル・Lint 手順
- ブランチ・PR 戦略
- Issue 作成ガイド
- ディレクトリ構成早見表
- SDK 再生成手順

### 6-2 — Makefile バグ修正

`make dev-install` と `make lint` / `make test` が誤ったパスを指していたバグを修正する。

| 修正前 | 修正後 |
|---|---|
| `agent/[dev]` | `agent/cdx_agent[dev]` |
| `cd agent && ruff check cdx_agent tests` | `cd agent/cdx_agent && ruff check cdx_agent tests` |
| `cd agent && pytest tests/ -q` | `cd agent/cdx_agent && pytest tests/ -q` |

---

## Reason

- `make dev-install` が `agent/` 直下に `pyproject.toml` がないためインストール失敗していた
- `make lint` / `make test` が `agent/tests/` 不存在のため常にエラーになっていた
- CONTRIBUTING.md がないと新規コントリビューターのオンボーディング障壁になる

---

## Acceptance Criteria

### 6-1 (CONTRIBUTING.md)
- [x] `CONTRIBUTING.md` が作成される（前提条件 / venv / test / lint / PR戦略 / 構成）
- [x] 248 テスト全通過

### 6-2 (Makefile 修正)
- [x] `make dev-install` がエラーなく実行できる（`agent/cdx_agent[dev]` に修正）
- [x] `make lint` が両パッケージで `All checks passed!` を返す
- [x] `make test` が `114 passed` (agent) + `134 passed` (server) を返す

---

## Project Sync

- Project: Construction-DX-OS (ローカル管理)  
- Status: closed ✅  
- Priority: P3  
- Phase: Phase 6
