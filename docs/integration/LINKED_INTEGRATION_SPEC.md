# CEOP × 連携先6システム 連携仕様書

日付: 2026-08-09
方針: 連携先は吸収・削除しない。各システムの専門性と独立性を維持し、CEOP は
Webhook 受信・イベントキュー・認証・監査・再試行・冪等性を一元的に提供する疎結合の調整レイヤーとなる。

共通原則:
- 認証: 各連携は CEOP の API キー/JWT（`integration:*` 権限）と、オプションの共有シークレット
  `CEOP_INTEGRATION_SHARED_SECRET`（`X-Integration-Token` ヘッダ）で受信検証する。
- 冪等性: すべての Webhook/イベントは `X-Idempotency-Key`（または body `idempotencyKey`）を必須とし、
  CEOP が `(system, idempotencyKey)` で重複受信を 200/duplicated 応答で抑止する。
- 監査: 受信・キュー・再送はすべて CEOP 監査ログに記録する。
- 障害時: 送信失敗は `retrying` → 指数バックオフ（既定 1〜2 秒、最大 3〜5 回）→ `failed` として保持し、
  `POST /api/v1/integrations/events/:id/retry` で再送できる。受信側は 5xx を 429/503 扱いにして再送を促す。
- バージョン互換性: 契約は `INTEGRATION_CONTRACTS`（GET /api/v1/integrations/contracts）で version 管理し、
  新イベント種別の追加は後方互換（既存フィールド不変、追加フィールドのみ）とする。

## 1. Civil-4D-AI-Planner（4D 工程・AI 計画）

現状: Hono REST API（Cloudflare Workers）。`GET /v1/projects`、`GET /v1/projects/:id/tasks`、
`GET/POST /v1/tasks/:id/assessments`、`GET /health`（`apps/api/src/app.ts`）。

- 責務境界: 4D 工程モデル・AI 計画生成・シミュレーションは Planner が所有。CEOP は工程・案件マスタの参照と
  計画承認・監査を所有。
- データ所有者: Planner（工程/タスク/評価）。CEOP（案件・承認・監査・ISO 記録）。
- 同期方向: 双方向（案件 → Planner push、計画・評価 → CEOP webhook pull）。
- 契約:
  - 受信: `POST /api/v1/integrations/webhooks/4d-planner` — `schedule.updated` / `plan.generated` / `simulation.completed`
  - 送信: `POST https://{planner-host}/v1/ceop/events` — `project.registered` / `schedule.approved`
- タイムアウト 10 秒・最大再試行 3 回・冪等性必須。

## 2. Construction-DX-Idea（DX アイデア）

現状: Cloudflare Workers（`/api/*` 配下、SPA 同一オリジン）、アイデア永続化・評価ボード実装済み。

- 責務境界: アイデアの受付・審査・評価は Idea が所有。採択後の案件化・予算・監査は CEOP が所有。
- データ所有者: Idea（アイデア）。CEOP（採択・案件化・承認・監査）。
- 同期方向: 双方向（idea.submitted → CEOP、CEOP の採択通知 → Idea）。
- 契約:
  - 受信: `POST /api/v1/integrations/webhooks/dx-idea` — `idea.submitted` / `idea.reviewed` / `idea.selected`
  - 送信: `POST https://{dxidea-host}/api/ideas/events` — `idea.project_created` / `idea.rejected`
- タイムアウト 10 秒・最大再試行 3 回・冪等性必須。

## 3. Civil-Construction-Management-Platform（現場施工管理・承認フロー）

現状: NestJS 10 + Next.js 15 + Prisma。`work-items`（CRUD + complete/cancel）、`audits` + `findings` +
`audit-logs`、`suppliers`、`objectives`、`inspections` + `checklist-items`、`dashboard/overview`・`site-staff`
（`/tmp/mgmt-clone.K34mIG/apps/api/src`）。

- 責務境界: 現場の作業指示・検査・供給者・目標は Management Platform が所有。CEOP は承認フロー・監査・ISO 記録を調整。
- データ所有者: Management Platform（作業・検査）。CEOP（承認・監査・ISO）。
- 同期方向: 双方向（現場イベント → CEOP、CEOP 承認結果 → 現場）。
- 契約:
  - 受信: `POST /api/v1/integrations/webhooks/site-management` — `site.daily_report` / `site.approval` /
    `site.instruction` / `site.evidence`
  - 送信: `POST https://{mgmt-host}/api/v1/integrations/events` — `approval.decided` / `iso.record_linked`
- タイムアウト 15 秒・最大再試行 5 回・冪等性必須（現場の電波断を考慮）。

## 4. Civil-Construction-AI-Build-Platform（AI システム構築・モデル・リスク審査）

現状: 設計・テンプレート・webui 中心（`docs/`・`templates/`・`webui/`、README/設計たたき台）。

- 責務境界: モデル構築・評価・デプロイは AI Build Platform が所有。CEOP はモデル利用の
  AI ガバナンス（承認・権限・監査・個人情報保護・誤回答対策・利用停止）を所有。
- データ所有者: AI Build Platform（モデル・実験）。CEOP（利用統制・監査・リスク判定）。
- 同期方向: 双方向（モデル登録/審査 → CEOP、CEOP の利用停止/承認 → AI Build）。
- 契約:
  - 受信: `POST /api/v1/integrations/webhooks/ai-build` — `model.registered` / `model.reviewed` /
    `model.risk_assessed` / `model.deployed`
  - 送信: `POST https://{ai-build-host}/api/v1/ai/events` — `governance.approved` / `governance.stopped`
- AI ガバナンス要件: モデル利用は CEOP `ai-actions` API の承認・監査ゲートを必須とし、停止指示イベントを最優先処理する。

## 5. DX-Project-Portfolio-Atlas（DX 案件・予算・効果・KPI）

現状: FastAPI + SQLAlchemy + Alembic（`/api/v1`、`docs/contracts/api-v1.md`、OpenAPI `/api/v1/openapi.json`）、
プロジェクト・設定・GitHub Webhook 受信を実装。

- 責務境界: DX 案件の予算・効果・KPI・ポートフォリオ分析は Atlas が所有。CEOP は案件の承認・監査・
  ISO/現場記録との関連付けを所有。
- データ所有者: Atlas（ポートフォリオ）。CEOP（承認・監査・統合イベント）。
- 同期方向: 双方向（案件更新 → CEOP、CEOP の採択・予算承認 → Atlas）。
- 契約:
  - 受信: `POST /api/v1/integrations/webhooks/portfolio-atlas` — `dxcase.updated` / `budget.updated` /
    `effect.measured` / `kpi.updated`
  - 送信: `POST https://{atlas-host}/api/v1/portfolio/events` — `dxcase.selected` / `budget.approved`
- タイムアウト 10 秒・最大再試行 3 回・冪等性必須。

## 6. Civil-Material-Photo-Logger（資材写真・証跡・検査・出来形）

現状: 設計・アプリ資産中心（`app/`・`docs/`、README/CHANGELOG）。

- 責務境界: 写真撮影・証跡保存・出来形紐付けは Photo Logger が所有。CEOP は検査・ISO 記録・監査との紐付けを所有。
- データ所有者: Photo Logger（写真・バイナリ）。CEOP（メタデータ・検査記録・監査）。
- 同期方向: 双方向（撮影/証跡 → CEOP、CEOP の検査紐付け → Photo Logger）。
- 契約:
  - 受信: `POST /api/v1/integrations/webhooks/photo-logger` — `photo.captured` / `photo.evidence_linked` /
    `inspection.recorded`
  - 送信: `POST https://{photo-host}/api/v1/photos/events` — `inspection.linked` / `evidence.requested`
- ファイル連携: バイナリは各システムのオブジェクトストレージに保持し、CEOP は URL・ハッシュ・メタデータのみ扱う。

## 7. CEOP 実装済みコンポーネント

- 受信 Webhook: `POST /api/v1/integrations/webhooks/:system`（認証・共有シークレット・冪等性・監査）
- イベントキュー: `POST /api/v1/integrations/events`（outbound 作成）
- 再送: `POST /api/v1/integrations/events/:id/retry`（契約タイムアウト・再試行・冪等性ヘッダ付き送信）
- 自動配送: `pnpm run integration:dispatch`（`scripts/run-integration-dispatcher.ts`）が
  pending/retrying の outbound イベントを契約ポリシーで自動送信（systemd timer / cron 運用）
- 一覧: `GET /api/v1/integrations/events` / `GET /api/v1/integrations/contracts`
- 契約検証: 受信/送信イベントは契約定義の `eventTypes` にない種別を 400 で拒否（fail-closed）
- 契約テスト: `src/api/routes/integrations.test.ts`（受信認証・冪等性・イベント種別検証・再送実送信・契約一覧 6 件）+
  `scripts/run-integration-dispatcher.test.ts`（自動配送）
- 環境変数: `CEOP_INTEGRATION_URL_<SYSTEM>` / `CEOP_INTEGRATION_TOKEN_<SYSTEM>` /
  `CEOP_INTEGRATION_SHARED_SECRET`

## 8. 実 URL 特定・到達性確認（2026-08-09）

連携先リポジトリの README・wrangler.toml・state.json・docs から実稼働 URL を特定し、
本番 `.env`（Git 外）へ `CEOP_INTEGRATION_URL_*` として設定しました。トークンは
各システムの Cloudflare Access / API 認証が提供された時点で `CEOP_INTEGRATION_TOKEN_*` に設定します。

| システム | 実 URL（設定値） | 到達性（イベント経路 POST） |
|---|---|---|
| 4d-planner | `https://civil4d-ai.mirai-dx-platform.com/v1/ceop/events` | 302（Cloudflare Access。トークン設定後に疎通確認） |
| dx-idea | `https://dxidea.mirai-dx-platform.com/api/ideas/events` | 302（Cloudflare Access。トークン設定後に疎通確認） |
| site-management | `http://192.168.0.185:3003/api/v1/integrations/events` | 000（本機で未稼働。デプロイ後に再確認） |
| ai-build | `https://ccabp.mirai-dx-platform.com/api/v1/ai/events` | 405（ホスト到達・経路存在。受信実装後に契約合わせ） |
| portfolio-atlas | `https://dx-atlas.mirai-dx-platform.com/api/v1/portfolio/events` | 302（Cloudflare Access。トークン設定後に疎通確認） |
| photo-logger | 未特定（リポジトリに公開 URL なし。Expo アプリ想定） | 未確認 |
