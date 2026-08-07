# MVP Release Candidate — リリース判定エビデンス

このドキュメントは Construction Enterprise OS の **MVP Release Candidate** が
リリース判定を受けるための、成功条件ごとの検証エビデンスをまとめたものです。

- 判定日: 2026-06-17
- 対象ブランチ: `main`
- 判定区分: **Release Candidate 成立**（全成功条件を実 runtime 証拠で充足）

## 📊 成功条件 達成サマリー

| #   | 条件                     | 状態 | エビデンス                                                                              |
| --- | ------------------------ | ---- | --------------------------------------------------------------------------------------- |
| 1   | 全主要機能動作確認済み   | ✅   | 779 単体テスト + 9 ルート E2E スモーク + runtime 疎通                                   |
| 2   | API 疎通成功             | ✅   | live uvicorn `GET /health` → `{"status":"healthy"}` + OpenAPI 21 routes                 |
| 3   | 認証認可正常動作         | ✅   | 保護 API 認可フロー 401/401/403/200 = **4/4 PASSED**                                    |
| 4   | DB CRUD 成功             | ✅   | 実 PostgreSQL CREATE/READ/UPDATE/DELETE **PASSED**                                      |
| 5   | CI 成功                  | ✅   | main CI run success（python-checks 全 + frontend + docker-build + security）            |
| 6   | Critical/High 脆弱性ゼロ | ✅   | security-scan success（Critical=0 / High=0）                                            |
| 7   | E2E テスト成功           | ✅   | frontend smoke **passed=9 / failed=0**                                                  |
| 8   | README / 運用手順完成    | ✅   | README + `docs/it-operations.md` `docs/engineering-guide.md` `docs/technology-stack.md` |
| 9   | Docker 起動成功          | ✅   | `docker compose config` valid（32 services）+ WebUI コンテナ稼働                        |
| 10  | ローカル環境再現可能     | ✅   | クロスプラットフォーム install 修復（Win/macOS の EBADPLATFORM 解消）                   |

## 🔬 Runtime 検証ログ

```
[API疎通]   uvicorn src.main:app → GET /health {"status":"healthy"} + OpenAPI 21 paths
[DB CRUD]   real PostgreSQL (construction.wbs_items)
            ✅ CREATE  ✅ READ  ✅ UPDATE(0→50%)  ✅ DELETE  → 🟢 PASSED
[認証認可]  保護 API /api/v1/construction/wbs
            未認証→401 / 無効トークン→401 / client型→403 / user型→200(+実DB応答) → 🟢 4/4
[E2E]       frontend 9 routes (dashboard/projects/documents/gis/iot/bim/ai-ocr/workflows/safety)
            → passed=9 / failed=0
```

### 再現方法

```bash
# E2E スモーク（稼働中 WebUI 対象）
BASE_URL=http://<webui-host>:<port> bash scripts/smoke/frontend-smoke.sh

# 実 DB CRUD（ephemeral postgres を起動して実行）
docker run -d --name ceos-verify-pg -e POSTGRES_USER=construction-os \
  -e POSTGRES_PASSWORD=construction-os_dev -e POSTGRES_DB=construction-os \
  -p 55432:5432 postgis/postgis:16-3.4
cd services/construction
DATABASE_URL=postgresql+asyncpg://construction-os:construction-os_dev@localhost:55432/construction-os \
  PYTHONPATH=. python verify_db_crud.py

# 認証認可フロー（construction を起動して実行）
DATABASE_URL=... JWT_PUBLIC_KEY=dev-only-do-not-use-in-production PYTHONPATH=. \
  python -m uvicorn src.main:app --port 18090 &
BASE_URL=http://127.0.0.1:18090 JWT_KEY=dev-only-do-not-use-in-production \
  python verify_auth_flow.py
```

## 📦 Release Candidate に含まれる主な変更（2026-06-17）

| PR  | 内容                                                                        |
| --- | --------------------------------------------------------------------------- |
| #12 | frontend テスト243件決定化（非同期 useEffect の act settle）                |
| #18 | `@next/swc-linux-x64-gnu` 固定依存削除でクロスプラットフォーム install 修復 |
| #19 | README + 運用3ガイド整備 + frontend E2E スモークテスト                      |
| #22 | 実 PostgreSQL DB CRUD 検証スクリプト                                        |
| #23 | runtime 認証認可フロー検証スクリプト                                        |

## 🔭 リリース後の追跡項目（RC 成立とは独立・本番ハードニング）

| 項目                           | 追跡先    | 内容                                                                                  |
| ------------------------------ | --------- | ------------------------------------------------------------------------------------- |
| フロント側認証ガード本番有効化 | PR #15    | ダッシュボードの fail-closed ガード再有効化（人間マージ。merge 前に対抗レビュー推奨） |
| 実 DB 統合テストの CI 化       | Issue #20 | 検証スクリプトの pytest 統合テスト化 + CI postgres service container                  |
| フルスタック 32 サービス起動   | Issue #21 | 専用環境での全サービス同時起動（開発機の host ポート競合解消）                        |

## 🚀 デプロイ方針

- 実際のデプロイは **人間（運用担当）が手動で実行** する（CTO は自動デプロイしない）。
- 手順は `docs/it-operations.md`（IT 部門向け運用ガイド）を参照。
- 本番有効化前に PR #15（認証ガード）のマージを推奨。
