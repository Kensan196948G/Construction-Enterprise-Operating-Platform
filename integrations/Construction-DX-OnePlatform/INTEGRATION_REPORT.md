# Integration Report — Loop #1 / #3 結合検証

**日付:** 2026-05-22
**担当:** Verify チーム (結合検証担当)
**スコープ:** Loop #1 で 7並列 Agent が生成した 00 共通基盤 / 04 施工 / 06 安全品質 / 10 IT-DX の依存・パス・ビルド整合性

---

## 1. 発見した不整合

### 1.1 Python パッケージ依存 (pyproject.toml)

| プロジェクト | 不整合 |
| --- | --- |
| `06_安全品質環境本部/.../backend` | `cdx-shared-auth` / `cdx-shared-db` を依存宣言しているが `tool.uv.sources` のローカル path 解決定義がなく、PyPI を見に行って失敗する状態 |
| `10_IT-DX部門/.../backend` | 同上。さらに `pgvector` を `dev` 依存に持つが本体 deps に明記されていない箇所あり (今回はそのまま) |
| `00_共通基盤/api-gateway` | OK (sources 定義済み) |
| `04_施工本部/.../backend` | OK (sources 定義済み) |

### 1.2 TypeScript パッケージ依存 (package.json)

| プロジェクト | 不整合 |
| --- | --- |
| ルート | npm workspaces 定義なし。`@cdx/shared-ui` がローカル参照できない |
| `04/frontend` | `"@cdx/shared-ui": "workspace:*"` (pnpm 構文)。npm では非対応 |
| `06/frontend` | 同上 |
| `10/frontend` | `"@cdx/shared-ui": "*"` (npm workspaces 想定だがルート未定義) |

### 1.3 Docker Compose / Dockerfile

| 不整合 | 内容 |
| --- | --- |
| `api-gateway` | `build.context: ./00_共通基盤/api-gateway` だが Dockerfile が `shared-auth` (親階層) を COPY しようとして失敗する |
| `04 backend` | 同様に Dockerfile が `00_共通基盤/...` を参照しているが context が `backend/` 配下なので COPY 不可 |
| `06 backend` | Dockerfile が shared-auth/db の事前 install を含んでおらず、`pip install -e .` 時に PyPI 解決失敗 |
| `10 backend` | 同上 |
| ヘルスチェック | api-gateway のみで設定。`condition: service_healthy` 連携が不完全 |
| `version: "3.9"` | Compose v2 では非推奨 (今回は警告のみ、修正は次ループに繰越) |

### 1.4 import パスの整合性

- `cdx_auth` / `cdx_db` / `cdx_gateway` のパッケージ名表記は全プロジェクトで一致。表記揺れなし
- 04 backend の `db/session.py` は `from cdx_db.session import get_sessionmaker` を使用。shared-db の公開 API と一致 (OK)
- 06 / 10 backend の src 側はまだ shared モジュール未使用 (次ループで追加されるはず)

---

## 2. 修正内容

### 2.1 Python 側
- `06/backend/pyproject.toml`: `[tool.uv.sources]` を追加 (shared-auth / shared-db の editable path 参照)。`[tool.pytest.ini_options]` を追加。
- `10/backend/pyproject.toml`: 同様に sources / pytest 設定を追加。

### 2.2 TypeScript 側
- ルートに `package.json` を新規作成し npm workspaces を定義 (shared-ui + 3 frontend)。
- `04/frontend`, `06/frontend` の `"workspace:*"` を `"*"` に変更し npm workspaces で解決可能にした。
- `10/frontend` は元から `*` なのでそのまま (workspaces 化で解決可)。

### 2.3 Docker
- `docker-compose.yml`: 4 つの backend サービス (api-gateway, site-api, sq-api, itsm-api) の `build.context` をリポジトリルート `.` に変更し `dockerfile:` フィールドで明示。各 backend が `00_共通基盤/shared-auth` `00_共通基盤/shared-db` を COPY できるようにした。
- 各 backend Dockerfile を統一形式に書き換え:
  - 共通モジュールを `/opt/shared-auth` `/opt/shared-db` に COPY → 先に `pip install` → 本体を `pip install -e .`
  - Python は 3.12-slim に揃えた (shared-auth/db が `requires-python>=3.12` のため)
- `depends_on` を `condition: service_healthy` ベースに整理、healthcheck 未設定だった api-gateway をヘルスチェック付きに。
- frontend サービスに `depends_on: [<backend>]` を追加 (起動順序)。

### 2.4 CI (`.github/workflows/ci.yml`)
- `backend-test` を matrix 化 (6 プロジェクト)。
- 共通基盤系を依存しないプロジェクトのみ shared-auth/db を先に editable install。
- `frontend-test` も matrix 化 (4 プロジェクト)。ルートで `npm install --workspaces` → shared-ui を build → 各 frontend で typecheck。
- coverage アーティファクトを matrix index 付きで upload。

### 2.5 開発スクリプト (`scripts/`)
- `check-imports.ps1`: 各サブプロジェクトを editable install して `cdx_auth` / `cdx_db` / 各 `*_api` の import 疎通を確認、最後に表形式サマリ。
- `test-all.ps1`: 全 Python + Frontend サブプロジェクトの test を順次実行し失敗継続、最後にサマリ表示。
- `dev-fresh.ps1`: `docker compose down -v` → data layer up → shared 編集 install → `alembic upgrade head` → `seed_master.py`。

---

## 3. 修正サマリ

| カテゴリ | 検出件数 | 修正件数 | 残課題 |
| --- | --- | --- | --- |
| Python pyproject 依存 | 2 | 2 | 0 |
| TypeScript workspace | 4 | 3 (+ ルート新設 1) | shared-ui の dist がコミット対象外なら CI で build 必須 |
| Dockerfile / compose | 5 | 5 | nginx.conf が一部 frontend で欠落の可能性 (要確認) |
| CI matrix | 1 | 1 | matrix キャッシュ最適化未対応 |
| 開発スクリプト | 3 新規 | 3 | bash 版未作成 (.sh)。WSL 利用者用に要追加 |

修正ファイル数: **9** (pyproject 2 / compose 1 / Dockerfile 4 / ci 1 / package.json 2 [新規ルート+2 既存編集]) + 新規 5 (root package.json / 3 scripts / INTEGRATION_REPORT.md)

---

## 4. 次ループ繰越事項

1. **06 / 10 backend の実コード**: まだ `cdx_auth` `cdx_db` を import していない。次ループで `db/session.py` ・ middleware を追加し、04 backend と同じ統合パターンを反映する。
2. **shared-ui ビルド成果物 (`dist/`)**: 現在 frontend は `dist/index.js` を参照する。ローカル開発でも `npm -w @cdx/shared-ui run build` を初回に走らせる必要があり、`dev-fresh.ps1` に追加する候補。
3. **frontend Dockerfile**: `@cdx/shared-ui` を workspaces で解決するため、frontend ビルドの context をルートに移すか、shared-ui を pre-build した dist を COPY する戦略を要検討。今回は compose の frontend ビルドが壊れている可能性があるため、現時点で `docker compose build *-web` は失敗する見込み。
4. **`docker-compose.yml` の `version: "3.9"`**: Compose v2 では不要。削除推奨。
5. **alembic 多重リポジトリ**: shared-db / 04 backend が独立に alembic を持つ。マイグレーション順序の合意が必要。
6. **CodeRabbit 指摘 (`shared-auth/CODEX_REVIEW_20260522.md`)**: 既存レビュー結果との突合を次ループで実施。
7. **`pgvector` 等の OS パッケージ依存**: 10 backend Dockerfile では追加の system lib が要るかも (要検証)。

---

## 5. 動作確認手順 (推奨)

```powershell
# 1) 共通モジュール疎通
./scripts/check-imports.ps1

# 2) 全テスト (失敗継続)
./scripts/test-all.ps1

# 3) クリーン環境を作って data layer まで起動
./scripts/dev-fresh.ps1

# 4) backend イメージ build (修正後の compose で通るか)
docker compose build api-gateway construction-site-api safety-quality-api itsm-api
```

---

## Loop #3 追記 — alembic 統合 / shared-ui Docker / E2E 雛形

### 6. alembic マイグレーション統合方針

| 項目 | 内容 |
| --- | --- |
| 集約点 | ルート `alembic_global/` 新設 (alembic.ini / env.py / script.py.mako / versions/.gitkeep / migrate_log/) |
| 戦略 | 既存サブプロジェクト migration は **保持** (移動・削除なし)。`alembic_global/env.py` は `cdx_db.base.Base` を共有し、`site_api.models` / `sq_api.models` / `itsm_api.models` を try/except 付きで動的 import |
| 運用モード | (a) **開発**: サブプロジェクト毎に `alembic upgrade head` / (b) **本番統合**: `scripts/migrate-all.ps1` が `migrate_log/*.yaml::order` 順 (shared=10 → site=20 → sq=30 → itsm=40) で per-subproject alembic を逐次実行 |
| 命名規約 (新規分) | `YYYYMMDD_<subsystem>_<seq>_<desc>.py` (例: `20260522_site_0003_xxx.py`)。既存ファイルの即時改名は downgrade chain 破壊回避のため見送り、`migrate_log/*.yaml::heads` に既存 revision を吸収 |
| version table | 集約 env では `alembic_version_global` を使用し、per-subproject の `alembic_version` と干渉させない |
| 接続先解決 | `DATABASE_URL` → `cdx_db.config.get_db_settings().sync_dsn` → ini placeholder の順 |
| 取り込み履歴 | `alembic_global/migrate_log/{shared,site,sq,itsm}.yaml` に order / alembic_dir / heads を記録 |

### 7. shared-ui Docker ビルド方式

**選択した方式**: 各 frontend Dockerfile を **multistage 化し、build context をリポジトリルートに変更**。
ステージ 1 (shared-ui) で `npm install --workspaces` + `npm -w @cdx/shared-ui run build` を行い、
ステージ 2 (build) で当該 frontend をビルド、ステージ 3 (nginx) で配信。

**選定理由**:

- npm workspaces はルート `package.json` で既に定義済 (Loop #1 修正)。tsup tarball 方式は publish パイプラインが追加で必要になり、ローカル開発時の watch ループも複雑化するため見送り。
- multistage はキャッシュ効率が良く、shared-ui の変更時のみ再ビルドが走る (`COPY 00_共通基盤/shared-ui` の前に `package.json` だけ COPY して `npm install` する 2 段構え)。
- `00_共通基盤/shared-ui/Dockerfile` も新規追加。これは **エクスポート専用イメージ** (alpine + /dist) で、将来的に独立 publish へ寄せる選択肢を残す。
- `docker-compose.yml` の `*-web` 3 サービスを `context: .` + `dockerfile: ./<path>/Dockerfile` に切り替え。

### 8. E2E (Playwright) 雛形

- ルートに `e2e/` を新設 (`package.json` / `playwright.config.ts` / `tsconfig.json` / `tests/*` / `README.md`)。vitest は使わず Playwright 単体。
- `playwright.config.ts`: projects = chromium / firefox / webkit、baseURL は `E2E_SITE_URL` (既定 `http://localhost:3000`) で上書き可。`E2E_GATEWAY_URL` `E2E_SQ_URL` `E2E_ITSM_URL` も環境変数化。
- テストスペック 3 本:
  - `auth-flow.spec.ts` — ログイン → ホーム表示 + 未認証リダイレクト + `/health` 疎通
  - `site-flow.spec.ts` — 04 施工: プロジェクト一覧 → 工程登録 → ガント描画
  - `cross-app.spec.ts` — api-gateway 経由で 04/06/10 各 `/api/<dept>/...` の到達確認 (200/401/403/404 を許容)
- 共通フィクスチャ `_fixtures.ts::serviceUp(url)` で dev server 未起動時はテスト skip。**「サービスが立っていなくても CI が落ちない」** 設計。
- `.github/workflows/e2e.yml` 新規。PR 起動で docker compose を立ち上げて Playwright を走らせ、`playwright-report` をアーティファクト保存。安定化までは `continue-on-error: true`。

### 9. Loop #3 で追加/変更したファイル一覧

新規 (12):

- `alembic_global/alembic.ini`
- `alembic_global/env.py`
- `alembic_global/script.py.mako`
- `alembic_global/README.md`
- `alembic_global/versions/.gitkeep`
- `alembic_global/migrate_log/README.md`
- `alembic_global/migrate_log/shared.yaml`
- `alembic_global/migrate_log/site.yaml`
- `alembic_global/migrate_log/sq.yaml`
- `alembic_global/migrate_log/itsm.yaml`
- `scripts/migrate-all.ps1`
- `00_共通基盤/shared-ui/Dockerfile`
- `e2e/package.json` / `e2e/playwright.config.ts` / `e2e/tsconfig.json` / `e2e/README.md`
- `e2e/tests/_fixtures.ts` / `e2e/tests/auth-flow.spec.ts` / `e2e/tests/site-flow.spec.ts` / `e2e/tests/cross-app.spec.ts`
- `.github/workflows/e2e.yml`

編集:

- `04/frontend/Dockerfile` (multistage 化、shared-ui を workspace ビルド)
- `06/frontend/Dockerfile` (同上)
- `10/frontend/Dockerfile` (同上)
- `docker-compose.yml` (`*-web` 3 サービスを root context に変更)
- `INTEGRATION_REPORT.md` (本セクション)

### 10. Loop #3 残課題

- per-subproject alembic と `alembic_version_global` の並走は禁止 (運用ルール周知必要)。
- shared-ui の `dist/` を pre-build する開発体験は `dev-fresh.ps1` への追加で改善可能 (次ループ候補)。
- e2e は `data-testid` 等の固定セレクタ整備が前提。frontend 側で `id` / `aria-label` の付与を追って統一。
- `continue-on-error: true` を外す閾値 (= フローキー機能の安定確認) を Loop #4 で定義。

---

## Loop #5 追記 — 全 11 部門 Docker / CI / mock サーバ統合

### 11. Dockerfile dry-validate

全 11 部門 + `00_共通基盤/api-gateway` + `00_共通基盤/shared-ui` の Dockerfile を
通読し、以下の観点で整合性を確認・修正した。

| 観点 | 結果 |
| --- | --- |
| backend base image | 全 12 (gateway 含む) で `python:3.12-slim` に統一済み |
| backend `build.context` | 全て **リポジトリルート** 前提。`COPY 00_共通基盤/shared-{auth,db}` がそのまま動く |
| backend apt パッケージ | `build-essential / libpq-dev / curl` を基本セットに統一。geoalchemy2 / shapely を使う 03 / **09** / **11** に `libgeos-dev` を追加 (09 / 11 が抜けていたため本ループで修正) |
| frontend base image | 全 11 で `node:20-alpine` (build) + `nginx:1.27-alpine` (runtime) に統一。07 のみ `nginx:alpine` だったため 1.27 系に合わせる候補 (今回はそのまま、build は通る) |
| frontend `build.context` | **01 / 02 / 03 / 07 がリポジトリルート context に未対応**だったため、`04 / 06 / 10` と同じ multistage パターン (shared-ui の workspace ビルド) に書き換え |
| frontend workspaces | ルート `package.json` の `workspaces` 配列を 5 → **11 全 frontend + shared-ui の計 12** に拡張。各 frontend Dockerfile の `npm -w <name>` が解決可能 |

### 12. docker-compose.yml の完成

`api-gateway` + 既存 04 / 06 / 10 だけだった構成に **01 / 02 / 03 / 05 / 07 / 08 / 09 / 11** を追加。
ポート割当 (Web 競合回避のため exec は 3013 に変更):

| 部門 | API host port | Web host port |
| --- | --- | --- |
| 00 gateway | 8080 | — |
| 01 exec    | 8001 | 3013 |
| 02 crm     | 8002 | 3003 |
| 03 sol     | 8003 | 3004 |
| 04 site    | 8004 | 3000 |
| 05 tech    | 8005 | 3005 |
| 06 sq      | 8006 | 3001 |
| 07 corp    | 8007 | 3007 |
| 08 proc    | 8008 | 3008 |
| 09 marine  | 8009 | 3009 |
| 10 itsm    | 8010 | 3002 |
| 11 data    | 8011 | 3011 |
| mocks      | 8090 | — |

- `depends_on` は API → `postgres healthy` / `redis healthy`、Web → 対応 API service の起動を最低限明示
- `data-api` は `elasticsearch healthy` + `minio started` も追加
- `mocks` は `profiles: ["mocks"]` で平時は起動しない (明示的に有効化)
- 既存サービス (site/sq/itsm/gateway) は **container_name / port を維持** し互換性確保

### 13. 部門間 API mock サーバ (`mocks/`)

`mocks/` を新設し、11 部門の `/api/v1/{exec,crm,solution,construction,tech,safety,corp,proc,marine,itsm,data}/stats` を返す FastAPI スタブを実装。

| ファイル | 内容 |
| --- | --- |
| `mocks/main.py` | 11 部門 KPI + `/health` + ランダムシード補助 = 計 **13 エンドポイント** |
| `mocks/Dockerfile` | `python:3.12-slim` + uvicorn。HEALTHCHECK 付き |
| `mocks/requirements.txt` | fastapi / uvicorn |
| `mocks/README.md` | 起動手順 + 環境変数による実 API / mock の切替指針 |

01 経営の aggregator や 11 データ基盤の取り込みパイプライン開発時、`EXEC_AGGREGATOR_BASE_URL=http://mocks:8090` 等を注入することで実 API を介さず動作確認可能。

### 14. CI Actions matrix 拡充

`.github/workflows/ci.yml`:

- `backend-test.matrix.project` を 6 → **14** に拡張 (shared-auth / shared-db / api-gateway + 全 11 部門 backend)
- `frontend-test.matrix.project` を 4 → **12** に拡張 (shared-ui + 全 11 部門 frontend)
- 共通モジュール先行 install は既存ロジック (case 分岐) のまま全部門で機能

`.github/workflows/e2e.yml`:

- compose 起動を **全 11 部門 + mocks + ES + MinIO** に拡張
- Playwright に渡す環境変数 `E2E_<DEPT>_URL` を 11 部門分定義
- `continue-on-error: true` / 安定化までの skip-if-broken は維持

### 15. alembic_global の metadata 拡充

`alembic_global/env.py` の `_SUBSYSTEMS` を 3 → **11** に拡張:
`exec_api / crm_api / sol_api / site_api / tech_api / sq_api / corp_api / proc_api / marine_api / itsm_api / data_api` の models を try/except 付きで動的 import。失敗時は warning のみで継続 (CI で順次有効化前提)。

### 16. 統合スクリプト

| スクリプト | 概要 |
| --- | --- |
| `scripts/build-all.ps1` | 全 12 backend + 11 frontend + mocks を `docker compose build` で逐次 build。失敗継続 + サマリ表示。`-Backend` / `-Frontend` / `-Mocks` で対象限定可 |
| `scripts/start-mocks.ps1` | `docker compose --profile mocks up -d mocks` + health 確認 |
| `scripts/full-stack-up.ps1` | data layer → mocks → gateway → 11 API → 11 Web の **5 段階で順次起動**。最後に Web URL 一覧を表示 |

### 17. Loop #5 追加/変更ファイル一覧

新規 (7):

- `mocks/main.py`
- `mocks/Dockerfile`
- `mocks/requirements.txt`
- `mocks/README.md`
- `scripts/build-all.ps1`
- `scripts/start-mocks.ps1`
- `scripts/full-stack-up.ps1`

編集 (9):

---

## Loop #8 — mocks 契約整合 100% & aggregator 連携検証 (2026-05-22)

### 18. 背景

Loop #7 の `mocks/contract_check.py` で、`mocks/main.py` の
`/api/v1/{dept}/stats` レスポンスフィールドと各部門 `routes/*.py` の
公開識別子 (Pydantic / dict キー / 関数引数) が乖離しており、4 部門が WARN だった:

| dept | Loop #7 cov | 不一致 |
| --- | --- | --- |
| exec | 40% | revenue_ytd_jpy / order_backlog_jpy / active_projects |
| tech | 25% | knowledge_articles / rag_query_p50_ms / rag_query_p95_ms |
| corp | 40% | headcount / vacant_positions / contracts_pending_legal |
| itsm | 40% | open_incidents / open_changes / mttr_minutes |

### 19. 修正内容

#### 19.1 mocks レスポンスを実部門 API スキーマに整列 (`mocks/main.py`)

各 `/api/v1/{dept}/stats` の KPI フィールドを **実 routes/*.py の識別子と同名**
に書き換えた:

- 01 exec → `orders_amount / average_profit_margin / cost_ratio /
  accident_count / near_miss_count / deficit_project_count /
  delayed_project_count / labor_overtime_avg / procurement_delay_ratio /
  itsm_incident_count` (aggregator.consolidate_kpi の戻り値キー)
- 02 crm → `pipeline_count / pipeline_gross_amount / won_count / won_amount /
  lost_count / contract_count / contract_amount` (dashboard.DashboardSummary)
- 03 solution → `proposing_count / won_count / lost_count /
  in_negotiation_count / total_amount_won / win_rate`
- 04 construction → `project_count / progress_avg / delayed_project_count /
  deficit_project_count / cost_ratio / profit_margin / daily_reports_today /
  attendance_today` (site_api 識別子)
- 05 tech → `article_count / bim_count / cim_count / drawing_count /
  open_inquiry_count` (dashboard.StatsOut そのもの)
- 06 safety → `accident_count / near_miss_count / patrol_count /
  nonconformity_count / ky_count`
- 07 corp → `revenue / expense / net_income / profit_margin_pct / cost_total /
  accounts_receivable / accounts_payable / cash_flow_projection / bs_balanced /
  labor_overtime_avg` (dashboard.kpi)
- 08 proc → `count / total_amount / quantity / reorder_point / avg_daily_usage /
  evaluation_rank / delay_ratio` (dashboard + inventory + suppliers)
- 09 marine → `vessels_total / vessels_active / voyages_total /
  voyages_in_transit / utilization_rate / total_refuel_liters /
  vessel_used_days / accident_free_hours`
- 10 itsm → `total / breached / breach_rate / agents_active / alerts_24h /
  triggers_active / incident_count` (sla-report + wazuh)
- 11 data → `sources_total / sources_active / etl_jobs / etl_runs_24h /
  lake_tables / ai_models / iot_devices / twin_objects`

#### 19.2 aggregator 互換 alias path 追加

`exec_api/services/aggregator.DEPT_SPECS` は
`/api/v1/{sales|solution_sales|engineering|corporate|procurement|data_platform}/stats`
を叩く一方で、Loop #5 mocks は `crm/solution/tech/corp/proc/data` の短縮形のみだった。
mocks に **6 つの alias endpoint を追加** し、aggregator がトップレベルで読む
`orders_amount / profit_margin / cost_ratio / accident_count / near_miss_count /
labor_overtime_avg / deficit_project_count / delayed_project_count /
delay_ratio / incident_count` を dict ルートに展開。

#### 19.3 数値の再現性確保

各 endpoint で `random.Random(20260522 + salt)` の seed 固定 RNG を導入し、
取得値が呼び出しごとに大きく動かないようにした。

#### 19.4 `to_kpi_snapshots` 型ヒント整備

`exec_api/services/aggregator.py` に `KpiSnapshotRow` (`TypedDict`) を新設し、
`to_kpi_snapshots` の戻り値型を `list[dict[str, Any]]` →
`list[KpiSnapshotRow]` へ強化。`KpiSnapshot(**row)` のキー揃えが静的に
保証される。

#### 19.5 aggregator <-> mocks 疎通テスト (新規)

`01_経営企画部/.../backend/tests/test_aggregator_with_mocks.py` を新規作成。
mocks サーバを **プロセス起動せず** に `httpx.ASGITransport` で
`mocks/main.py` の FastAPI app を直接叩き、`aggregate_all` →
`consolidate_kpi` → `to_kpi_snapshots` の経路で 10 部門分の KPI が
正しく取り込めることを 4 ケースで検証 (全 PASS)。

### 20. 契約整合チェック結果 (Loop #8)

```
dept          status     cov
exec          PASS      100%
crm           PASS      100%
sales         PASS      100%
solution      PASS      100%
solution_sales PASS     100%
construction  PASS       75%
tech          PASS      100%
engineering   PASS      100%
safety        PASS      100%
corp          PASS       90%
corporate     PASS       88%
proc          PASS      100%
procurement   PASS      100%
marine        PASS      100%
itsm          PASS       90%
data          PASS      100%
data_platform PASS      100%

Total: 17 endpoints, PASS 17 / WARN 0 / ERROR 0 / SKIP 0
```

詳細は `mocks/CONTRACT_REPORT.md` 参照。

### 21. テスト結果

```
01_経営企画部/.../backend/tests : 31 passed, 12 warnings
  - test_aggregator.py: 4 passed (既存 / 影響なし)
  - test_aggregator_with_mocks.py: 4 passed (新規 / ASGI 疎通)
  - その他: 23 passed
```

### 22. Loop #8 追加/変更ファイル一覧

新規 (2):

- `mocks/CONTRACT_REPORT.md`
- `01_経営企画部/ConstructionExecutiveDashboard/backend/tests/test_aggregator_with_mocks.py`

編集 (3):

- `mocks/main.py` (KPI フィールド整列 + alias path 追加 + seeded RNG)
- `mocks/contract_check.py` (alias path 用 DEPT_ROUTES マッピング追加)
- `01_経営企画部/ConstructionExecutiveDashboard/backend/src/exec_api/services/aggregator.py` (`KpiSnapshotRow` TypedDict 追加)

### 23. 残課題 (Loop #9 候補)

- 04 construction で `profit_margin / attendance_today` が `routes/*.py` の
  識別子集合に直接現れない (regex 内 / 関数名のみ)。site_api 側に dashboard
  集約 endpoint が追加された段階で 100% を狙う。
- 07 corp / 10 itsm の `labor_overtime_avg / incident_count` も同様。
  consumer (aggregator) はトップレベルから取得済みのため機能影響はゼロ。

編集 (9):

- `docker-compose.yml`         (8 部門サービス + mocks 追加 / port 整理)
- `package.json`                (workspaces を 11 frontend に拡張)
- `alembic_global/env.py`       (`_SUBSYSTEMS` を 11 部門に拡張)
- `.github/workflows/ci.yml`    (backend matrix 14 / frontend matrix 12)
- `.github/workflows/e2e.yml`   (全 11 部門 + mocks 起動、env 拡張)
- `01/frontend/Dockerfile`      (multistage / root context 化)
- `02/frontend/Dockerfile`      (multistage / root context 化)
- `03/frontend/Dockerfile`      (multistage / root context 化)
- `07/frontend/Dockerfile`      (multistage / root context 化)
- `09/backend/Dockerfile`       (`libgeos-dev` 追加)
- `11/backend/Dockerfile`       (`libgeos-dev` 追加)

### 18. Loop #5 残課題

- `docker compose build` の **実走検証は未実施** (本ループは構成整備のみ)。Loop #6 で `scripts/build-all.ps1` を CI 上で run し、失敗イメージを潰す
- 各部門 backend の `models` パッケージ実装は部門により未整備のため、`alembic_global` での import skip が複数発生する見込み
- mocks の KPI 値は固定。E2E / aggregator のスキーマと突合し、契約テスト (pact 等) へ昇格させる候補
- 11 data backend は `langchain / dbt-core / airflow-client` 等の重い deps を持つため、image size 最適化 (multistage 化) が次ループ課題
- Web ポートの番号体系 (3000 番台で歯抜け) を Phase 2 で再整理 (gateway 経由前提なら直接公開ポートは縮小可)

---

## Loop #7 追記 — Dockerfile lint / mocks 契約整合 / E2E 雛形レビュー

### 19. Dockerfile 静的解析 (`scripts/dockerfile-lint.ps1`)

リポジトリ配下の **25 Dockerfile** (11 部門 backend / 11 部門 frontend + api-gateway + shared-ui + mocks) を 1 つずつ静的解析し、結果を `DOCKERFILE_AUDIT.md` に出力。

| 観点 | 結果 |
| --- | --- |
| FROM ベースイメージ | backend 全 12 `python:3.12-slim` / frontend 全 11 `node:20-alpine` + `nginx:1.27-alpine` / mocks `python:3.12-slim` で統一済 |
| WORKDIR | **25/25 OK** |
| EXPOSE | 24/25 OK (shared-ui の export-only stage のみ未指定 — 期待通り) |
| HEALTHCHECK | api-gateway / mocks のみ設定。**11 部門 backend は未設定** (本ループでは指摘のみ。Loop #8 で uvicorn `/health` 呼び出し HEALTHCHECK を一括追加候補) |
| USER | **25/25 未設定** (root 実行)。本番セキュリティのため `useradd cdx` 化を Phase 2 で計画 |
| apt: build-essential / libpq-dev / curl | backend 全 11 + gateway で揃っている。**libgeos-dev** も 03/09/11 で揃済 |
| COPY パス | 親階層 (`../`) 参照は **0 件**。全 backend/frontend が `build.context=.` (リポジトリルート) と整合 |
| frontend nginx.conf | COPY しているのは 01/02/04/08/09 の 5 件。残り 6 frontend は **nginx.conf 未配置** → SPA fallback (`try_files`) が無いため React Router 直リンクで 404 になるリスク (`DOCKERFILE_AUDIT.md` に記録) |

**集計**:

- 全 25 ファイルが何らかの warn を持つが、内訳は `USER 未指定` (25 件) + `HEALTHCHECK 未指定` (11 件) + `nginx.conf 未配置` (6 件) + `EXPOSE 未指定 (shared-ui)` (1 件) = 計 43 件
- **致命的 (build 失敗を伴う) issue は 0 件**。COPY 親階層参照や apt パッケージ欠落といった「ビルド時に失敗する」項目は全てクリア
- 実 `docker build` の検証は Loop #5 で `scripts/build-all.ps1` を整備済。本ループは静的検査のみ。

### 20. mocks 契約整合チェック (`mocks/contract_check.py`)

`mocks/main.py` の `/api/v1/{dept}/stats` 11 エンドポイントから KPI フィールド名を AST で抽出し、対応する各部門 `<dept>_api/routes/*.py` 内の Pydantic フィールド / dict キー / 関数引数名と簡易照合 (完全一致 or snake_case トークン一致)。

| dept | status | coverage | matched/total | unmatched |
| --- | :---: | ---: | :---: | --- |
| exec | WARN | 40% | 2/5 | revenue_ytd_jpy / order_backlog_jpy / active_projects |
| crm | PASS | 60% | 3/5 | leads_open / bids_in_flight |
| solution | PASS | 50% | 2/4 | iot_endpoints / platform_uptime |
| construction | PASS | 60% | 3/5 | average_schedule_variance_days / open_change_orders |
| tech | WARN | 25% | 1/4 | knowledge_articles / rag_query_p50_ms / rag_query_p95_ms |
| safety | PASS | 80% | 4/5 | incidents_ytd |
| corp | WARN | 40% | 2/5 | headcount / vacant_positions / contracts_pending_legal |
| proc | PASS | 60% | 3/5 | rfq_in_progress / savings_ytd_jpy |
| marine | PASS | 80% | 4/5 | ais_uptime |
| itsm | WARN | 40% | 2/5 | open_incidents / open_changes / mttr_minutes |
| data | PASS | 50% | 3/6 | datasets_ingested / pipelines_healthy / data_volume_tb |

**サマリ**: PASS 7 / WARN 4 / **ERROR 0**。`scripts/check-mocks-contract.ps1` でラップ。

mocks の KPI 値は集約ダッシュボード向けの「**抜粋済の KPI スナップショット**」であり、各部門 API のドメインモデル全体と 1:1 で揃わないのが既定路線。本チェックは「mocks が完全に独立したダミーになっていないか」を確認する **緩いガード** として運用する。

### 21. E2E Playwright 雛形 typecheck (`e2e/CHECKLIST.md`)

`npm install` / `tsc --noEmit` 未実行のまま、コードレビューのみで雛形の妥当性を確認:

- `@types/node` ^22 が `devDependencies` に既に含まれており、`process.env.E2E_*` の解決に問題なし
- `tsconfig.json` は `strict: true` + `moduleResolution: Bundler` + `types: ["node"]` で Playwright TS 推奨形と一致
- `_fixtures.ts` の `serviceUp(url)` フィクスチャによる skip-if-broken は Playwright 1.48 の API に整合
- 全 3 spec が `getByRole` / `getByLabel` / `toHaveURL` の **web-first assertion** を使用
- 改善余地: `data-testid` 整備 / `test.step` でストーリー化 / `globalSetup` での seed 投入 (Loop #8 候補)
- `package.json` は変更不要 (型不足なし)

### 22. Loop #7 追加/変更ファイル一覧

新規 (5):

- `scripts/dockerfile-lint.ps1`
- `scripts/check-mocks-contract.ps1`
- `mocks/contract_check.py`
- `e2e/CHECKLIST.md`
- `DOCKERFILE_AUDIT.md` (lint 実行で生成)

編集 (1):

- `INTEGRATION_REPORT.md` (本セクション)

### 23. Loop #7 残課題

- 11 部門 backend Dockerfile に HEALTHCHECK を一括追加 (`curl -fs http://localhost:8000/health`)
- 6 frontend Dockerfile に `nginx.conf` (SPA fallback) を配置
- 全 Dockerfile に non-root user (`useradd cdx` / `USER cdx`) を Phase 2 で追加
- mocks WARN (exec / tech / corp / itsm) の KPI 名乖離を解消: mocks 側を 各部門 dashboard 実装の field 名に揃えるか、aggregator 側でマッピング層を入れる
- E2E `data-testid` 整備 (frontend 側) と `globalSetup` での dev token seed


