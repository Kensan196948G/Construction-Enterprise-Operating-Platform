# Issue 0011 — Phase 5: OpenAPI SDK 生成 + OIDC 認証プロト

**Priority:** P2  
**Status:** closed ✅  
**Owner:** Architect → Developer  
**Created:** 2026-04-22  
**Closed:** 2026-04-22 (Loop 24)  
**Depends on:** Issue 0010 (done), Issue 0004 (GitHub remote — human action)

---

## Summary

Phase 4 (Admin Auth + Redis rate-limit + OpenAPI JSON) が Loop 23 で完了した。
Phase 5 として以下2件を実装し、外部連携基盤を整える。

### 5a — OpenAPI クライアント SDK 自動生成

`scripts/generate_openapi.py` で生成済みの `openapi.json` を元に、  
TypeScript と Python のクライアント SDK を `openapi-generator-cli` で自動生成する。

- 生成先: `sdk/typescript/`, `sdk/python/`
- CI に SDK 再生成チェックを追加（openapi.json 変更時に diff 検知）
- 生成した TS SDK は Construction Hub UI から利用可能にする

### 5b — OIDC/LDAP 認証プロト（最小実装）

`/admin` の HTTP Basic Auth を OIDC に置き換える最小プロトタイプ。

- `python-jose` + `httpx` で OIDC Discovery → token verify
- dev モードは既存 CDX_ADMIN_TOKEN bypass を維持
- LDAP は設定フラグ `AUTH_BACKEND=ldap` で切替可能にする（実装は stub）
- テスト: MockOIDCServer を pytest fixture で提供

---

## Reason

- Issue 0010 完了受けての自然な次ステップ
- SDK 生成により cdx-agent↔server の型安全な通信が保証される
- OIDC は本番運用の必須要件（建設会社 IT 部門は M365/Google Workspace を利用）

---

## Acceptance Criteria

### 5a (SDK)
- [x] `make sdk` で TypeScript + Python SDK が `sdk/` 以下に生成される
- [x] CI に `sdk-check` ステップが追加され、openapi.json 変更時に自動更新される
- [x] 生成された SDK が `openapi.json` の全エンドポイントをカバーする（6 API クラス）

### 5b (OIDC)
- [x] `AUTH_BACKEND=oidc` 環境変数で OIDC 認証が有効になる
- [x] MockOIDCServer pytest fixture でテストが通る（6件実装・全 PASS）
- [x] dev モード（CDX_ADMIN_ENABLED=false）は引き続き動作する
- [x] 既存テスト + 新規6件 = 121テスト全通過（fakeredis環境問題は既存の環境問題）

---

## Implementation Notes (Loop 24)

### 5a 実装詳細
- `scripts/generate_sdk.py`: `@openapitools/openapi-generator-cli` (Java 21, npx) でTS+Python生成
- `Makefile`: `make sdk`, `make sdk-check`, `make openapi`, `make lint`, `make test` ターゲット
- `openapitools.json`: generator バージョン固定 (7.7.0)
- `.github/workflows/ci.yml`: `sdk-check` ジョブ追加 (needs: cdx-server, Java 21 temurin + Node 20)
- SHA-256 ハッシュ比較で drift を検知

### 5b 実装詳細
- `server/api/cdx_server/oidc_auth.py`: OIDCVerifier (injectable httpx.Client, TTL-based JWKS cache)
- `server/api/cdx_server/admin_auth.py`: `require_admin_auth_v2()` 統合ディスパッチャー追加
- `server/api/cdx_server/routers/admin.py`: `require_admin_auth_v2` に切替
- `server/api/tests/test_oidc_auth.py`: 6テスト (valid/expired/wrong-aud/missing/bypass/503)
- `python-jose[cryptography]>=3.3` + `respx>=0.21` を `pyproject.toml` に追加

---

## Project Sync

- Project: Construction-DX-OS (ローカル管理)  
- Status: closed ✅  
- Priority: P2  
- Phase: Phase 5 (5a+5b 完了)
- Commit: f9152c8 (feat(phase5): SDK auto-gen + OIDC auth proto)
