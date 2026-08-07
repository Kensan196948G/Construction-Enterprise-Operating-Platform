# CHANGELOG

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Security

#### project-level IDOR 防止 (PR #236 / Issue #233)

- **`backend/app/core/access_control.py`**（新規）— `assert_project_access(current_user, project_id, db)`
  - IDOR (Insecure Direct Object Reference) 対策: UUID を知るだけで他プロジェクトのデータにアクセス／書き込みできる問題を解消
  - ADMIN はバイパス / 他ロールは `Project.manager_id == user.id` を要求 / 非存在=`NotFoundError`・非オーナー=`ForbiddenError`
- **適用範囲**
  - `legal/evidence.py` `legal/compliance.py`: 全エンドポイント（read 含む厳格モデル）
  - `legal/contracts.py`: **create は `payload.project_id`（write-side IDOR＝管理外プロジェクトへの契約注入防止）**、get/update/analyze は `contract.project_id`、list は非 ADMIN を管理プロジェクトにスコープ（未指定経路バイパス防止）
  - `costs.py`: `legal-check` に project_id 検証
  - `daily_reports.py` `safety.py`: write (create/update/delete) に検証（read/list は VIEWER 横断閲覧を維持）
- **`backend/app/services/project_service.py`** — 案件作成時に `manager_id` 未指定なら作成者を既定 manager に設定（孤児プロジェクト防止）
- **`backend/app/repositories/`** — `ProjectRepository.list_manager_project_ids()` + Contract 一覧の `project_ids` スコープフィルタ
- テスト: `tests/unit/test_access_control.py`（6）+ costs/daily_reports/safety/contracts-list/contracts-create/projects の IDOR 正例否例

#### projects.py 経由の read-side IDOR を修正 (Issue #239)

- **`backend/app/api/v1/routers/projects.py`** — Legal 連携 2 エンドポイントに `assert_project_access` 追加
  - `GET /{project_id}/contracts` — 管理外プロジェクトの契約一覧（AI リスクスコア・金額）の読み取りを防止
  - `GET /{project_id}/legal-risks` — 管理外プロジェクトの法的リスク評価の読み取りを防止
  - `legal/contracts.py` との制御統一: 同一情報への全アクセスパスで `assert_project_access` を適用（OWASP IDOR 完全網羅）
- テスト: `test_project_contracts_blocks_cross_project_read` / `test_project_legal_risks_blocks_cross_project_read` 追加（16/16 PASS）

### Added

#### Phase 7: 統合テスト・E2E テスト強化 (PR #243〜#248)

**背景**: IDOR 完全防止（PR #236/#242）の品質保証を単体テストから統合・E2E に拡張。

- **統合テスト新設 (+8件)**
  - `tests/integration/test_projects_integration.py` +3: projects IDOR 保護（ADMIN 所有プロジェクトへの PM アクセス 403）
  - `tests/integration/test_legal_integration.py`（新規）+5: contracts CRUD/IDOR（read/write）+ evidence タイムライン/IDOR
- **E2E テスト新設 (+3件)**
  - `frontend/e2e/legal.spec.ts`（新規）: Legal Tech ページ 3 タブ（証跡・コンプライアンス・契約書解析）の描画確認
- **テスト統計更新（2026-05-31 時点）**
  - 統合テスト: 53件 → **61件**（+8）
  - E2E テスト: 206件 → **225件**（+19）
  - 総テスト数: 865件 → **879件**（+14）

#### ISO マッピング整備 (PR #237〜#241)

- **`docs/03_設計（Design）/08_三層モデル×ISO対応マッピング（Three-Layer ISO Mapping）.md`**（新規）— 三層モデル × ISO 要求の俯瞰マッピング表・充足度自己評価
- **`docs/requirements/`**（新規）— ISO 要件詳細化（案件管理/日報/安全・品質/法的証跡台帳 の4モジュール）

#### Legal Tech Phase 3: 既存モジュール法的統合 (PR #235 / Issue #234)

- **`backend/app/api/v1/routers/costs.py`** — `GET /projects/{project_id}/cost-records/legal-check`
  - 下請代金支払遅延等防止法 第2条の2 準拠 — SUBCONTRACT 原価記録の60日支払期限チェック
  - severity 分類: CRITICAL（91日超）/ HIGH（61〜90日）/ MEDIUM（45〜60日）
- **`backend/app/api/v1/routers/daily_reports.py`** — 日報作成時に `legal_evidence` 自動記録（BackgroundTask）
  - 建設業法 第26条の4 工事記録保存義務への対応
  - `AsyncSessionLocal` で独立セッション — fail-safe（証跡登録失敗でも日報本体に影響なし）
- **`backend/app/api/v1/routers/safety.py`** — 安全チェック `overall_result=NG` 時にコンプライアンスチェック自動実行（BackgroundTask）
  - 労働安全衛生法 第3条 事業者の安全衛生義務への対応
  - `ComplianceCheckRequest(check_type="labor_safety")` で Phase 2 ComplianceService と連携
- **`backend/app/schemas/legal.py`** — `PaymentOverdueRecord` / `CostPaymentLegalCheckResult` スキーマ追加
- `backend/tests/test_legal_phase3.py` — 16 テスト 全通過（スキーマ・API認証・severity分類・BackgroundTask）

#### Legal Tech Phase 2: 証跡タイムライン + コンプライアンスチェック (PR #232 / セキュリティ修正)

- **`backend/app/services/legal/evidence_service.py`** — SHA-256 自動計算 + タイムライン取得 + Fail-Closed 改ざん検知
  - `_compute_evidence_hash()` — `project_id:source_type:title:event_date:description` の正規化ハッシュ
  - `verify_integrity()` — Fail-Closed 設計: ハッシュ不一致・未設定・形式エラー → 改ざん判定
  - セキュリティ修正: Fail-Open ブランチ削除（外部ハッシュを無条件信頼しない）
- **`backend/app/services/legal/compliance_service.py`** — Claude AI + ルールベースエンジン
  - 建設業法第22条（一括下請禁止）・下請法第2条の2（支払期限60日）・労働安全衛生法第28条の2
  - スコアリング: PASS≥85 / WARNING≥50 / FAIL<50 + CRITICAL 違反は強制 FAIL
  - ANTHROPIC_API_KEY 未設定時はルールベースフォールバック（`ai_used=False`）
- **`backend/app/api/v1/routers/legal/evidence.py`** — 4 エンドポイント
  - `GET /{project_id}/timeline` / `POST /{project_id}` / `GET /{project_id}/verify` / `GET /entry/{evidence_id}`
  - セキュリティ修正: `/entry/{evidence_id}` から VIEWER ロール除外（IDOR 対策）
- **`backend/app/api/v1/routers/legal/compliance.py`** — 3 エンドポイント
  - `POST /{project_id}/check` / `GET /{project_id}/status` / `GET /{project_id}/history`
- **`backend/alembic/versions/0012_legal_evidence_compliance.py`** — `legal_evidence` + `compliance_checks` テーブル（JSONB）
- **`frontend/src/api/legal.ts`** — TypeScript API クライアント Phase 1+2 全 10 メソッド
- **`frontend/src/pages/legal/LegalPage.tsx`** — 証跡タイムライン + コンプライアンスチェック UI（3 タブ）
- `backend/tests/test_legal_phase2.py` — 24 テスト 全通過（認証・スキーマ・ルールエンジン・サービスユニット）

#### Legal Tech Phase 1: 建設業法/下請法 契約 AI 解析 (PR #230 / Issue #226/#227/#228)

- **`backend/app/api/v1/routers/legal/contracts.py`** — 契約台帳 CRUD API (GET/POST/PUT/analyze)
  - `POST /api/v1/legal/contracts/{id}/analyze` — Claude claude-opus-4-7 による建設業法・下請法リスク評価
  - CRITICAL / HIGH / MEDIUM / LOW リスクスコアリング
  - ANTHROPIC_API_KEY 未設定時は PENDING を返す graceful degradation 設計
- **`backend/app/models/legal.py`** — `legal_contracts` テーブル（契約台帳 + AI リスクスコア）
- **`backend/alembic/versions/0011_legal_contracts.py`** — DB マイグレーション
- **`backend/app/api/v1/routers/projects.py` 強化** — `GET /{project_id}/contracts` / `GET /{project_id}/legal-risks` エンドポイント追加（#228）
- **`backend/app/api/v1/routers/itsm.py` 強化** — `GET /incidents/legal` 法令違反インシデント一覧 + `POST /incidents/{id}/escalate` 法務エスカレーション (#227)
- `backend/tests/test_legal.py` — Phase 1 テスト 219 行（認証・RBAC・CRUD・AI解析フォールバック）

#### システム設定 + M365 EntraID SSO (PR#225 / Issue #225)

- **M365 EntraID SSO 非対話式フロー設定タブ** — テナント ID / クライアント ID / 証明書指紋・ロールマッピング UI
- **ユーザー管理テーブル** (ADMIN 限定) — アクティブ/非アクティブ切替・ロール変更
- **ログインページ Microsoft ボタン** — MicrosoftAuthProvider 連携
- `authApi.me()` の `user.role` 永続化バグ修正

### Fixed

- **E2E (Playwright) SSE タイムアウト修正** — `setupAllApiMocks()` に `/api/v1/notifications/stream` SSE モックを追加
  - `route.fulfill({ status: 200, headers: { 'Content-Type': 'text/event-stream' }, body: '' })`
  - 本番 SSE エンドポイントへの ECONNREFUSED 無限リトライによる E2E テストハングを解消
- **Performance Tests CI 修正 (PR #183 / Issue #182)** — 週次ベンチマーク CI の 3 バグを修正
  - `test_api_benchmark.py`: `@pytest_asyncio.fixture` → sync `@pytest.fixture` に変更し、`asyncio_mode='auto'` との event loop 競合を解消。`follow_redirects=True` 追加で FastAPI `redirect_slashes` による 307 → 401 を正確に検出
  - `performance-test.yml`: k6-slo seed スクリプトの `app.db.session` → `app.db.base` import 修正 + `role="admin"` → `"ADMIN"` 大文字化修正
- **ESLint react-hooks/set-state-in-effect 修正** — `SettingsPage.tsx` の `useEffect` 内 setState を適切なパターンに修正
- **Vitest authApi.me テスト修正** — `user.role` モックデータの型安全性修正

---

## [1.1.0] - 2026-04-25

### Added

#### Phase 10a: CHANGELOG 整備 + バージョン履歴文書化（Issue #171）

- **[Unreleased] セクション** — Keep a Changelog 形式に準拠した未リリース変更の集約
- **バージョン履歴の時系列整理** — v0.x.x 開発フェーズ (v0.8.0 / v0.8.1 / v0.9.0) と v1.0.0 系列の並存構造を明文化

#### Phase 10b: API・ユーザードキュメント整備（PR #174 / Issue #172）

- **`docs/user-guide/getting-started.md`** — 5 ステップ初回セットアップガイド（Docker Compose ベース）
- **`docs/user-guide/construction-projects.md`** — 工事案件 CRUD・ステータス遷移・日報・原価・安全確認の操作ガイド
- **`docs/user-guide/admin-guide.md`** — 管理者向け: ロール設計・ユーザー管理・秘密情報ローテーション・ITSM 運用手順
- **FastAPI OpenAPI description 拡充** — `app.description` に認証フロー・ロール表・エラー形式・レート制限を Markdown で追加
- **エンドポイント docstring 詳細化** — auth / projects / costs / safety の主要エンドポイントに権限・パラメータ・制限事項を記載
- **README ユーザードキュメントセクション追加** — `📚 ユーザードキュメント` テーブルを README に挿入

#### Phase 10c: 最終セキュリティ監査 + v1.1.0 リリース（Issue #173）

- **Trivy CRITICAL/HIGH=0 最終確認** — backend / frontend コンテナイメージの脆弱性ゼロを CI で確認
- **OWASP Top 10 セルフチェック** — bandit / CodeQL / Dependency Review 全 pass
- **CHANGELOG [Unreleased] → [1.1.0] 昇格** — Phase 10a/10b/10c の変更をバージョンタグへ昇格
- **GitHub Release v1.1.0** — 全 Phase 10 成果物を含む最終リリース

### Metrics

| 指標                   | v0.9.0 | v1.1.0       |
| ---------------------- | ------ | ------------ |
| バックエンドテスト     | 365 件 | 365 件       |
| E2E テスト             | 206 件 | 206 件       |
| CI チェック数          | 20     | **20**       |
| 脆弱性 (CRITICAL/HIGH) | 0      | **0 維持**   |
| ユーザードキュメント   | なし   | **3 ガイド** |
| OpenAPI description    | 最小限 | **完全拡充** |

---

## [0.9.0] - 2026-04-25

### Added

#### Phase 9a: Prometheus + Grafana 監視スタック（PR #168）

- **prometheus-fastapi-instrumentator** — FastAPI `/metrics` エンドポイント自動計測（全ルート RED メトリクス）
- **docker-compose.monitoring.yml** — prometheus / grafana / alertmanager / node-exporter / postgres-exporter / redis-exporter 分離構成
- **Prometheus 設定** — `monitoring/prometheus/prometheus.yml` + アラートルール 4 件
- **Grafana ダッシュボード** — `monitoring/grafana/dashboards/servicehub.json` (JSON provisioning)
- **`make monitoring-up`** コマンド追加（Grafana:3001 / Prometheus:9090 / Alertmanager:9093）

#### Phase 9b: k6 SLO 負荷試験拡充（PR #169）

- **SLO 定義** (`docs/design/slo.md`) — P95 < 1s @ 100VU / エラー率 < 2% / 可用性 99.9%
- **k6_slo_test.js** — smoke + 100VU SLO load シナリオ（P95/P99 閾値チェック）
- **k6_spike_test.js** — 0→200VU スパイクシナリオ
- **k6_endpoints_test.js** — 7 エンドポイントグループ（auth / projects / reports / safety / cost / photos / itsm）
- **GitHub Actions 週次実行** — `performance-test.yml` k6-slo job（毎週月曜 09:00 JST）

#### Phase 9c: Kubernetes Helm chart 骨格（PR #170）

- **Helm v3 chart** (`charts/servicehub/`) — bitnami/postgresql 15.5.x + bitnami/redis 19.x 依存
- **Deployment×2** — backend (FastAPI) / frontend (Next.js)、セキュリティコンテキスト完備
  - `readOnlyRootFilesystem: true` / `runAsNonRoot: true` / `capabilities.drop: [ALL]`
- **HPA v2** — backend 2-10pod / frontend 2-6pod（CPU 70% / scaleDown 300s stabilization）
- **Ingress (nginx)** — path-based routing `/api` → backend / `/` → frontend
- **RBAC** — Role + RoleBinding + ServiceAccount（最小権限: configmaps/secrets/pods のみ）
- **Namespace + ConfigMap + Secret** (`helm.sh/resource-policy: keep`)
- **Helm Lint CI** (`.github/workflows/helm-lint.yml`) — `helm lint --strict` + kubeconform 1.29.0
- **Kubernetes デプロイメントガイド** (`docs/deployment/kubernetes.md`)

### Metrics

| 指標                   | v0.8.1 | v0.9.0                  |
| ---------------------- | ------ | ----------------------- |
| バックエンドテスト     | 365 件 | 365 件                  |
| E2E テスト             | 206 件 | 206 件                  |
| CI チェック数          | 19     | **20** (Helm Lint 追加) |
| 脆弱性 (CRITICAL/HIGH) | 0      | **0 維持**              |
| SLO P95 目標           | 未定義 | **< 1s @ 100VU**        |
| Kubernetes 対応        | なし   | **Helm chart 骨格**     |

---

## [0.8.1] - 2026-04-25

### Added

- **Trivy コンテナスキャン** — CI Security Scan ワークフローに Trivy (aquasecurity/trivy-action@v0.36.0) 追加。backend (development target) + frontend (production target) の両イメージを CRITICAL/HIGH 脆弱性ゼロ目標でスキャン

### Fixed

- **本番環境 Docker Compose** (`docker-compose.prod.yml`) — alembic マイグレーション実行コマンド追加・healthcheck 設定・欠落環境変数 (`JWT_ALGORITHM`, `MINIO_BUCKET`, `LOG_LEVEL`, `ALLOWED_ORIGINS` 等) を追加
- **pytest-benchmark ScopeMismatch** — `bench_client` fixture を `function` スコープに変更 (pytest-asyncio 0.24 対応)
- **ruff E501** — `config.py` 日本語コメント 90文字超を英語短縮コメントに修正

### Security

- **CVE-2024-33663** (CRITICAL) — `python-jose` 3.3.0 → 3.5.0 (algorithm confusion with OpenSSH ECDSA keys)
- **CVE-2024-53981** (HIGH) — `python-multipart` 0.0.12 → 0.0.26 (DoS via deformation)
- **CVE-2026-24486** (HIGH) — `python-multipart` 0.0.12 → 0.0.26 (Arbitrary file write via multipart)
- **CVE-2024-47874** (HIGH) — `starlette` 0.38.6 → 0.46.2 (`fastapi` 0.115.0 → 0.115.14 更新で間接修正, DoS)
- **CVE-2025-62727** (HIGH) — `starlette` 0.46.2 → 0.49.1 + `fastapi` 0.115.14 → 0.124.4 (DoS via Range header merging)
- **Frontend OS CVE 22件** (CRITICAL: 3 / HIGH: 19) — nginx ベースイメージ `1.25-alpine` → `1.27-alpine` + `apk upgrade` で Alpine OS パッケージ全更新 (curl/libexpat/libxml2/musl 等)

### Metrics

| 指標                   | v0.8.0     | v0.8.1              |
| ---------------------- | ---------- | ------------------- |
| CI チェック数          | 18         | **19** (Trivy 追加) |
| 脆弱性 (CRITICAL/HIGH) | 未スキャン | **0** 目標          |

---

## [0.8.0] - 2026-04-25

### Added

#### Phase 7: 統合テスト・デプロイパイプライン

- **E2E フルスタック統合テスト** — Docker Compose + Playwright 15シナリオ（`docker-compose.test.yml` + `playwright.fullstack.config.ts`）
- **k6 負荷テスト** — `/api/v1/projects` への定常 RPS 計測 CI ワークフロー追加（`k6/load_test.js`）
- **pytest-benchmark** — API レスポンスタイム回帰検知 CI ワークフロー追加
- **デプロイパイプライン** — GHCR Docker push + staging smoke test + rollback 手順（`.github/workflows/deploy.yml`）

#### Phase 6: 品質強化・セキュリティ

- **slowapi レート制限** — ログイン 5 回/分・リフレッシュ 10 回/分（環境変数で設定可能）
- **JWT 監査ログ** — 全 API 操作に `user_id` 埋め込み
- **CodeQL セキュリティ分析** — GitHub Actions ワークフロー追加
- **/health/live + /health/ready** — Liveness / Readiness プローブ分離
- **X-Request-ID correlation** — 全リクエストにトレーシング ID を自動付与
- **統合テスト 51 件追加** — auth / cost / photos / safety + schemathesis contract テスト
- **E2E テスト拡充** — cost / photos / safety スペックを合計 206 件に拡張

### Fixed

- **E2E CI 全テスト通過** — `/health/live` レスポンス `"alive"` への regex 対応・CRUD テストに `project_code` 必須入力を追加
- **レート制限 E2E 競合解消** — テスト環境で `LOGIN_RATE_LIMIT=1000/minute` に緩和（`docker-compose.test.yml`）

### Security

- slowapi による Brute-force 対策（ログインエンドポイント）
- bandit 週次スキャン ワークフロー維持
- secret rotation 手順書追加（`docs/security/secret-rotation.md`）

### Metrics

| 指標                     | v0.7.x | v0.8.0       |
| ------------------------ | ------ | ------------ |
| バックエンドテスト       | 314 件 | 365 件 (+51) |
| フロントエンドテスト     | 270 件 | 294 件 (+24) |
| E2E テスト               | 147 件 | 221 件 (+74) |
| バックエンドカバレッジ   | 85%    | 95%          |
| フロントエンドカバレッジ | 75%    | 88%          |
| CI チェック数            | 8      | 18           |

---

## [1.0.0] - 2026-04-03

### Added

#### フロントエンド実装完了（PR #28, #29）

- **React 18 / Vite / TypeScript / Tailwind CSS** フロントエンド基盤構築
- **認証**: LoginPage / Zustand authStore（JWT永続化）/ axios interceptor
- **レイアウト**: レスポンシブサイドバー / ダッシュボード
- **工事案件管理** — ProjectsPage（一覧・ページネーション・ステータスバッジ）/ ProjectDetailPage
- **日報管理** — DailyReportsPage（プロジェクト別一覧・新規作成モーダル・ステータス管理）
- **安全・品質管理** — SafetyPage（安全チェック / 品質検査タブ切替）
- **ITSM管理** — ItsmPage（インシデント / 変更要求タブ・優先度カラーバッジ）
- **ナレッジ管理** — KnowledgePage（記事一覧・AI検索・カテゴリフィルター）
- **原価管理** — CostPage（予算/実績/差異サマリーカード・原価記録テーブル）
- **API クライアント** — daily_reports / safety / itsm / knowledge / cost（TypeScript型付き）

#### CI/CD 修復（PR #27）

- ruff 0.6.9 固定・pytest asyncio_mode=auto・mypy strict 全通過
- 統合テスト 30/30 グリーン

### Fixed

- conftest.py ruff format 修正
- TypeScript 型エラー全件修正（重複コンテンツ除去・API 関数名統一）

### E2E Status

- docker-compose 統合確認: E2E 全10チェック PASS ✅
- API: 35エンドポイント / DB: 13テーブル / 7マイグレーション

### CI Status

- Backend: ruff/mypy/pytest-30件/bandit 全グリーン ✅
- Frontend: TypeScript 0エラー / Vite build 成功 ✅

### E2E Verification

- docker-compose 統合確認: 全10チェック PASS ✅
- 起動サービス: api / db / redis / frontend / nginx / minio
- テスト環境: docker-compose.local.yml（ポート競合回避）

---

## [1.0.0] - 2026-10-02 (社内リリース予定)

### Added

#### Phase1: 基盤構築

- Docker Compose開発環境（FastAPI / PostgreSQL15 / Redis7 / MinIO / Nginx）
- JWT認証（HS256 / アクセス15分 / リフレッシュ7日）
- RBAC認可（ADMIN / PROJECT_MANAGER / SITE_SUPERVISOR / COST_MANAGER / IT_OPERATOR / VIEWER）
- SoD（職務分離）実装
- SQLAlchemy 2.0 async / Alembic マイグレーション
- GitHub Actions CI/CD（lint / test / security scan）

#### Phase2: コアモジュール

- **工事案件管理** — 案件CRUD / ステータス管理 / 予算管理
- **日報管理** — 日報作成・提出・承認ワークフロー
- **写真・資料管理** — MinIOストレージ / プリサインドURL
- **安全・品質管理** — 安全確認チェックリスト / 品質検査記録
- **原価・工数管理** — コスト記録 / 予実対比サマリーAPI

#### Phase3-4: 拡張モジュール

- **ITSM運用管理**（ISO20000準拠）
  - インシデント管理（INC番号採番 / 優先度 / 解決管理）
  - 変更要求管理（CHG番号採番 / 変更承認ワークフロー / SoD）
- **ナレッジ管理・AI支援**
  - ナレッジ記事CRUD（カテゴリ / タグ / 公開管理）
  - AI検索API（OpenAI gpt-4o-mini / フォールバックキーワード検索）
  - AI検索ログ（監査・改善用）

#### Phase5: テスト基盤

- pytest統合テスト（SQLite aiosqliteインメモリDB）
- SoD検証テスト（変更承認: ADMINのみ）
- Locust性能テスト
- テスト計画書

#### Phase6: リリース準備

- 本番用docker-compose.prod.yml（マルチレプリカ対応）
- .env.prod.example（全環境変数テンプレート）
- デプロイメントガイド

### API仕様

| エンドポイント                           | 説明             |
| ---------------------------------------- | ---------------- |
| `POST /api/v1/auth/login`                | ログイン         |
| `GET /api/v1/projects/`                  | 工事案件一覧     |
| `GET /api/v1/daily-reports/`             | 日報一覧         |
| `POST /api/v1/photos/upload`             | 写真アップロード |
| `GET /api/v1/safety/checks`              | 安全確認一覧     |
| `GET /api/v1/costs/summary/{project_id}` | 原価サマリー     |
| `POST /api/v1/itsm/incidents`            | インシデント起票 |
| `POST /api/v1/itsm/changes`              | 変更要求起票     |
| `POST /api/v1/knowledge/search`          | AI検索           |

### 技術スタック

- **Backend**: Python 3.12 / FastAPI / SQLAlchemy 2.0 async
- **DB**: PostgreSQL 15 / Redis 7 / MinIO
- **Frontend**: React 18 / Vite / TypeScript（フロントエンド実装は次フェーズ）
- **Infra**: Docker Compose / Nginx / GitHub Actions

### セキュリティ

- NIST CSF / ISO27001 / ISO20000 準拠
- 監査ログ（全操作のcreated_by/updated_by記録）
- 論理削除（deleted_at）
- X-Request-ID トレーシング
- bandit週次セキュリティスキャン
