# Changelog

All notable changes to the Construction Enterprise Operating Platform are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **レポジトリ統廃合・機能連携マスタープラン** — `docs/integration/REPOSITORY_MASTER_PLAN.md`
  （中核 CEOP・統合元 IMS 削除済み・維持連携 6 システムの責務境界と現状を一元化）
- **レベル付きロガー** — `src/obs/logger.ts`（`LOG_LEVEL` 対応・stderr 出力）を HTTP リクエストログへ適用

### Changed

- **CI カバレッジ閾値** — line 70% / branch 60% / function 70% を test ジョブに追加
- **CI Gitleaks スキャン** — `.gitleaks.toml` によるシークレットスキャンを追加
- **verify に build を追加** — `pnpm run verify` が format / openapi / typecheck / lint / test / build / parity を実行
- **E2E viewer クレデンシャル** — viewer 権限の E2E 用 API キーを seed（`CEOP_E2E_VIEWER_API_KEY_*`）
- **node:sqlite 型整備** — `createRequire` ブリッジを撤廃し `DatabaseSync` / `StatementSync` 型を直接利用
- **.gitignore** — `.opencode/`（エージェントセッション状態）を除外

### 2026-08-11

- **ルート共通ヘルパー集約** — 21 のルートファイルに重複定義されていた `str()`/`nowTs()`/`forbidden()`/`notFound()`/`badRequest()` を
  `src/api/routes/route-helpers.ts` へ集約し import で共有（`-805/+288` 行・挙動不変・verify pass）
- **P3 後半ルート/ドメインのテスト追加** — `documents`/`work-schedules`/`purchase-orders`/`notification-preferences`/`compliance` の
  ルート統合テストとドメインテストを追加（計 17 ファイル・verify 523/523 pass）
- **src/domain/index.ts 全ドメイン再エクスポート** — 19 ドメイン（compliance/contract/cost/daily-report/device-ingest/document/
  iso/knowledge/notification/notification-preference/notification-template/p3b/p3-slices/photo/project/
  purchase-order/s07-e11/safety/work-schedule）の型・ファクトリを再エクスポート
- **CI に parity ジョブ追加** — `ci.yml` の test ジョブに `pnpm run parity`（FEATURE_INVENTORY 突合 + API プローブ 27/27 PASS）を追加
- **CI カバレッジ lcov 出力** — `--test-reporter=lcov` で `coverage/lcov.info` を artifact に追加
- **README 更新** — テスト数 523 に修正、未記載エンドポイント（CSV エクスポート・ai-actions/status・portal/iso/iso-app）と
  SMTP 環境変数を追記、品質状態のテスト記述を最新化

### Fixed

- **README テスト数不整合** — バッジ・表・品質状態セクションのテスト数を実測（523 pass）に修正

## [0.11.1] - 2026-08-10

**本番適用済み（2026-08-10）** — PR #42 マージ（f669114）・事前バックアップ・コンテナ差し替え・
公開スモーク（version 0.11.1・HMAC 401・metrics 新 gauge・CSV 200）確認。

### Added

- **Webhook HMAC 署名検証** — `CEOP_INTEGRATION_SHARED_SECRET` 設定時に
  `X-CEOP-Signature`（HMAC-SHA256、raw body）を必須化。トークン検査と二重化。
- **モニタリング拡張** — `/metrics` に `ceop_iso_records_total` と
  `ceop_integration_events_pending` を追加。
- **アクセシビリティ** — ISO コンソールのダイアログに `role=dialog`・`aria-modal`・
  ESC クローズ・フォーカス移動、トーストに `aria-live=polite`。
- **運用資産** — `deploy/systemd/ceop-integration-dispatcher.{service,timer}`
  （5 分間隔のイベント自動配送）。
- **帳票（Excel/CSV 書き出し）** — 工事日報と ISO レコードの CSV エクスポート
  （`/daily-reports/export.csv`・`/iso/export.csv`、式インジェクション対策済み）。
- **PWA 対応** — `/manifest.webmanifest` を公開し全 SSR ページへリンク。
- **復旧検証ツール** — `scripts/verify-restore.ts`（SQLite 整合性・migration・必須テーブル検証）。
- **性能スモーク** — 100 並列リクエストの応答検証テストを追加。
- テスト 9 件追加（HMAC・メトリクス・テンプレート・CSV・負荷・復旧、計 407）。

## [0.11.0] - 2026-08-09

### Added

- **Civil-Construction-IMS 完全吸収（v0.11.0）** — ISO 9001/14001/45001/55001/19650・監査・是正・
  ISMS・BCP・BIM/CIM を CEOP 設計へ再構成。kind 判別型 `iso_records`（migration `025`）+ 統一 ISO API
  （`/api/v1/iso` CRUD・状態遷移・分析）と IMS 互換エイリアス 32 系統。
- **連携先6システム連携基盤** — Webhook 受信（`/api/v1/integrations/webhooks/:system`）、イベントキュー・
  再送（`/api/v1/integrations/events`・`/:id/retry`）、契約定義一覧（`/api/v1/integrations/contracts`）、
  `integration_events`（migration `026`）。共有シークレット認証・冪等性・監査・再試行を実装。
- **移行台帳・アーカイブ** — `docs/integration/IMS_MIGRATION_LEDGER.md`・`IMS_FEATURE_INVENTORY.md`・
  `LINKED_INTEGRATION_SPEC.md` を作成。`reports/ims-archive/` に Git bundle・Issue 50・PR 37 を保存。
- **UI** — `/iso` ランディングページとポータル/サイドバー導線。
- **ISO 管理コンソール** — `/iso-app`（認証必須・`iso:read`）：全モジュールの一覧・検索・新規/編集・
  状態遷移・削除・分析・連携契約表示。
- **AI ガバナンス拡張** — `ai-actions` に evidenceRefs（根拠表示）/inputRetentionDays（入力管理）/
  piiSensitive（個人情報保護）/wrongAnswerMitigation（誤回答対策）と利用停止エンドポイント
  `POST /api/v1/ai-actions/:id/status` を追加。
- **データ移行・復旧実演** — `import-ims-records` 実 import（3 件）→ バックアップ → 削除 → 復元の
  SQLite 実地検証を実施（3 件復元確認）。
- **ブラウザ E2E** — Playwright を導入し、`/iso-app` の認証ゲート・CRUD・状態遷移・分析・
  連携契約表示を E2E 化。CI に `E2E (Playwright)` ジョブを追加。
- **連携イベント自動配送** — `pnpm run integration:dispatch` で pending/retrying の outbound イベントを
  契約ポリシー（タイムアウト・再試行）で自動送信。受信/送信とも契約外の `eventType` を 400 で拒否。
- **本番デプロイ（2026-08-09）** — v0.11.0 を本番適用（migration 025/026・コンテナ差し替え・
  事前バックアップ・公開スモーク）。Tunnel 経路に `/iso`・`/iso-app`・`/portal` を追加。
  連携先実 URL を設定（4D/Idea/AI-Build/Atlas/現場LAN）。
- **Civil-Construction-IMS 削除（2026-08-09）** — ユーザー Y 承認・最終ミラー退避後、
  `gh repo delete` を実行し 404 を確認。
- テスト 16 件追加（domain/API/SQLite/連携/Web assets、計 398）。

## [0.10.0] - 2026-08-07

### Fixed

- **migration 016〜024 の欠落復元（P5 検証で発見）** — P3/P4 で追加された
  knowledge/legal/contracts/documents/work-schedules/purchase-orders/notification-preferences/
  compliance/legal-evidence/notification-templates のスキーマ定義がマージ過程で main から
  欠落していたため復元。`scripts/verify-parity.ts` に migration カバレッジ検査（001〜024）を追加。

### Added

- **P5 パリティ検証** — `scripts/verify-parity.ts`（FEATURE_INVENTORY 突合 + API プローブ 24 ルート）を
  `pnpm run verify` に組込。Y-03/Y-07・O-02/O-03/O-05・D-08 を統合済みに更新し、
  次期バックログ（O-04/O-06/O-08/O-09/D-04/D-07/D-09）を明示。テスト 2 件追加（382/382 pass）。

## [0.9.0] - 2026-08-07

### Added

- **Portal（P4）** — `GET /portal` で全モジュールの入口を提供。
- **Prometheus Metrics（P4）** — `GET /metrics`（text format・`CEOP_METRICS_TOKEN` 任意）。
  `ceop_http_requests_total` と runtime gauges（監査/通知/AI/ワークフロー/ゲートウェイ）。
- **監視スタック資産** — `deploy/prometheus/prometheus.yml`・Grafana provisioning
  （datasource + CEOP Platform ダッシュボード）・`docker compose --profile monitoring`（loopback 9090/3001）。
- テスト 6 件追加（379/379 pass）。

- **Compliance Check / Legal Evidence（ServiceHub S-07 残）** — コンプライアンスチェックと
  契約の法的証跡タイムライン API（`compliance:*` / `legal:*`・SHA-256 evidenceHash）。migration `022/023`。
- **Notification Templates / Unread / Email（Enterprise-OS E-11 残）** — テンプレート API・
  未読カウント・既読化（`notification:*`）と **SMTP email 実送信**（implicit TLS / AUTH PLAIN・
  `CEOP_SMTP_*`。未設定は not-configured 記録）。migration `024`。
- テスト 6 件追加（379/379 pass）。

- **Document（Enterprise-OS E-03）** — 図面・文書 API（`document:read|write`・版/状態管理）。migration `018`。
- **Work Schedule（Enterprise-OS E-02）** — 現場作業予定 API（`work-schedule:read|write`）。migration `019`。
- **Purchase Order（Enterprise-OS E-05 / ERP）** — 発注 API（`purchase-order:read|write`・番号一意・金額自動計算）。migration `020`。
- **Notification Preference + Dispatcher（E-11 / S-09）** — 通知購読設定 API と
  `scripts/run-notification-dispatcher.ts`（Webhook/Slack 実送信・`not-configured`/`transient` 失敗記録）。migration `021`。
- テスト 2 件追加（379/379 pass）。

- **Knowledge（ServiceHub S-06 / AI Gateway 連携）** — ナレッジ記事 API（`knowledge:read|write`・監査）。
  AI 生成記事は承認済み AI アクション（aiActionId）必須で AI Gateway の承認トレイルに接続。migration `016`。
- **Contract（ServiceHub S-07 LegalOps）** — 契約 API（`contract:read|write`・監査・契約番号一意）。migration `017`。
- **ITSM Adapter（ServiceHub S-08）** — `ItsmPort` を CEOP 認証/監査の背後で公開（`itsm:read|write`）。
- **日報承認ワークフロー連携** — 日報 submitted 時にワークフローインスタンスを自動作成し、
  承認で日報を approved へ自動遷移（監査 `daily-report:workflow-approved`）。
- テスト 4 件追加（379/379 pass）。

- **Photo/Document（ServiceHub S-03）** — 写真・資料メタデータ API（`photo:read|write`・監査）。migration `010`。
- **Safety/Quality（ServiceHub S-04）** — 安全点検・品質検査 API（`safety:read|write` / `quality:read|write`・監査）。migration `011/012`。
- **Cost/Work Hour（ServiceHub S-05）** — 原価記録・工数 API（`cost:read|write`・監査）。migration `013/014`。
- **Notification（ServiceHub S-09）** — 通知配信意図 API（`notification:read|write`・pending 管理）。migration `015`。
- テスト 5 件追加（379/379 pass）。

- **Construction Project ドメイン（ServiceHub S-01）** — 工事案件の CRUD API
  （`GET/POST /api/v1/projects`・`GET/PATCH/DELETE /:id`）。`project:read` /
  `project:write`・テナントスコープ・監査記録・projectCode 一意。migration `008`。
- **Daily Report ドメイン（ServiceHub S-02）** — 日報 CRUD と状態遷移
  （`draft→submitted→approved`）。案件配下の一覧/作成と個別取得/更新/遷移 API。
  `daily-report:read` / `daily-report:write`・監査記録。migration `009`。
- テスト 10 件追加（379/379 pass）。

- **Integration Gateway（P1）** — 統合サービス向けリバースプロキシと統一認証。
  `CEOP_GATEWAY_SERVICES` で登録したサービスを `/api/v1/integrations/<service>/*`
  として公開し、CEOP の JWT/API キー認証・権限（`integration:read` /
  `integration:write`）・監査・レート制限を一元的に適用。内部識別ヘッダー
  （`X-CEOP-Subject` 等）はクライアント入力値を破棄して CEOP が設定し、
  上流トークンは環境変数経由（非コミット）。パストラバーサル拒否・タイムアウト
  504・到達不能 502。ルータにワイルドカードセグメント（`*`）と `all()` を追加。
  テスト 16 件追加。
- **AI Action Governance（統合 Y-09 / L-07）** — AI アクション要求の統制・承認・監査。
  `GET/POST /api/v1/ai-actions` と `POST /:id/decision` を追加（`ai:read` / `ai:write` /
  `ai:approve`・テナントスコープ・監査記録）。プロンプト本文は保存せず SHA-256 ハッシュのみ記録。
  migration `007`（`ai_actions` テーブル）を追加。
- **Device Agent Ingest（統合 D-01〜D-03 / L-05）** — 端末登録・ハートビート・インベントリ受信。
  `POST /api/v1/devices/register` / `/:id/heartbeat` / `/:id/inventory` を追加
  （`device:write`・監査記録・`metadata` は string 値のみ・スキーマ変更不要）。
- テスト 379/379 pass・verify/build/audit 0。

## [0.8.2] - 2026-08-07

### Added

- **ブラウザタブ favicon** — SSR ページ（`/dashboard`・`/governance`）と WebUI 配信に
  `favicon.svg`（タワークレーンアイコン）を追加。`/api/assets/favicon.svg`・
  `/assets/favicon.svg`・WebUI の `/favicon.svg`（`/favicon.ico` は 302 リダイレクト）で配信

- **Workflow Instance API（統合 L-02 / Synapse Issue→Approval→Audit）** —
  ワークフローテンプレートからテナント単位の実行インスタンスを生成・承認・却下・取消できる
  `GET/POST /api/v1/workflow-instances` と `POST /:id/decision`・`POST /:id/cancel` を追加。
  認可は `workflow:read` / `workflow:write`、テナントスコープと監査記録を標準適用。
  migration `006`（`workflow_instances` テーブル）を追加。テスト 13 件追加（315/315 pass）

## [0.8.1] - 2026-08-07

- 2026-08-07

### Fixed

- **SSR ページの静的アセットが公開 URL で 404（G-36 / P1）** — Cloudflare Tunnel の
  ingress は `/assets/*` を WebUI 静的ホストへ振り分けるため、API が配信する
  `/dashboard`・`/governance` が参照する `app.css` / `app.js` が 404 になり、
  公開 URL ではスタイル・JavaScript が欠落していた。SSR テンプレートの参照を
  `/api/assets/*` へ変更し、Tunnel 経路（`/api/*` → API）で確実に届くように修正。
  旧 `/assets/*` ルートは直接/ローカルデプロイ互換として維持
- API 静的アセット応答に HSTS ヘッダを明示（README の「全応答化」主張との整合）

### Added

- `/api/assets/app.css` / `/api/assets/app.js` の統合テスト 5 件追加
  （ステータス・MIME・HSTS/X-Request-Id・HEAD・テンプレート参照先を固定）

### Changed

- テスト 302/302 pass（v0.8.0 の 297 から 5 件追加）

## [0.8.0] - 2026-08-07

### Added

- **API キー管理 API（SEC-013）** — `GET /api/v1/auth/keys`（一覧）と
  `DELETE /api/v1/auth/keys/:keyId`（失効・削除）を追加。`auth:write` 権限かつ
  プラットフォームレベル資格情報のみ利用可能（組織スコープは 403）。
  SQLite 永続化と同期し、秘密ハッシュは一切返却しない。失効は監査ログに記録され、
  直ちに認証不能になる（統合テスト 2 件）
- **HSTS を全応答へ適用（G-22）** — API JSON/添付・SSR・静的アセット・WebUI 配信の
  全応答に `Strict-Transport-Security: max-age=63072000; includeSubDomains` を付与。
  Cloudflare エッジ設定を待たずにアプリ層で HTTPS 強制の効力を得る
- **リクエスト相関 ID（SEC-010）** — API/WebUI の全応答に `X-Request-Id`（UUID）を付与し、
  API アクセスログにも出力。障害切り分け時の相関を可能に
- **Cloudflare Tunnel の実クライアント IP 分離（G-25）** — loopback peer 限定で
  `CF-Connecting-IP` を信頼し、グローバル/認証レート制限と WebUI アクセスログの
  バケットを実クライアント IP 単位へ分離。非 loopback からの偽装ヘッダは無視
- **バックアップ世代自動削除（G-24）** — `scripts/backup-retention.ts`（既定 14 日）を追加。
  `predeploy` / `crontest` は保護し、cron からバックアップ直後に実行
- **OpenAPI ドリフト検査** — `pnpm run openapi:check` を `verify` に統合し、
  enum・ページネーションキー・limit 上限（200）・Workflow スキーマをドメイン実装へ整合
- **WebUI 展開時の UUID パストラバーサル防御** — `__bundler` マニフェストのキーが
  UUID 形式以外の場合に展開を拒否（不正なバンドルによるディレクトリ外書き込み防止）
- **ヘルス情報の拡充** — `/api/v1/info` に `environment` / `nodeVersion` を追加

### Fixed

- **本番 API コンテナのバージョン乖離（G-29）** — 公開環境が v0.6.2 のままで
  HEAD 対応・監査エクスポートが未配信だった。v0.8.0 としてリリースし本番デプロイ済み
  （2026-08-07）。`/api/v1/info` = 0.8.0・HEAD `/health` 200・監査エクスポート 200・
  認証込みスモーク・ネガティブ制御 401 を実測確認
- **監査イベントのテナント属性欠落（G-32）** — `auth:token` と
  `governance:evaluate` が解決済み context の `organizationId` を metadata に
  持たない経路を修正し、組織スコープの監査閲覧から不可視にならないようにした
- **WebUI の LAN 全公開（G-31）** — 既定 bind を `127.0.0.1` へ変更し、
  Cloudflare Tunnel 経由のみで公開（LAN 直アクセスを遮断）
- **HEAD テストのタイミング依存** — `/health` の `uptime` 桁数変化による
  Content-Length 比較の flake を、安定エンドポイントのみ厳密比較する形へ修正

### Changed

- API サーバ / WebUI サーバに `headersTimeout` / `requestTimeout` /
  `keepAliveTimeout` を設定し slowloris 対策を強化
- 本番 `docker run` に `read_only` / `cap_drop ALL` / no-new-privileges /
  CPU・メモリ・pids 制限 / ログローテーションを適用（RUNBOOK §3 に反映）
- テスト 297/297 pass（client-ip 4・CF-IP レート分離 1・監査テナント 2・
  backup-retention 3・auth-keys 2・WebUI unpack UUID 防御 1・HEAD 安定化）

## [0.7.1] - 2026-08-07

### Fixed

- **WebUI 白画面（CSP による React CDN ブロック）** — デザインバンドルのランタイムは
  `window.__resources` に CDN URL → ローカルパスの対応が無い場合、unpkg.com から
  React / ReactDOM を読み込もうとし、CSP `script-src 'self'` にブロックされて
  ページが白画面のまま起動しなかった。`src/webui/unpack.ts` が
  `__bundler/ext_resources` セクション（CDN URL → 同梱アセット UUID）を解析し、
  展開済みローカルアセットへのマッピング `window.__resources` を外部ファイル
  `ext-resources.js` として出力し、`<head>` 直後に `<script src>` で参照するよう修正
  （CSP に `'unsafe-inline'` が無いためインライン注入は自身がブロックされる。
  `/assets/` は immutable キャッシュ対象のためルート直下・no-cache 配置）。
  CSP は緩和せず、デザイン HTML も無改変のまま（元の自己展開ローダーと同じ手法を
  blob: URL の代わりにローカルパスで再現）。ユニットテスト 3 件追加（注入・
  セクション欠落時の無変更・未知 UUID 参照の拒否）

## [0.7.0] - 2026-08-07

### Added

- **WebUI（デザインバンドル 100% 適用の静的 SPA ホスティング・v0.7.0）** — ユーザー提供の
  デザイン成果物 `webui/CEOP Platform.html`（自己展開型 `__bundler` HTML、8.7MB、
  React 18 UMD + IBM Plex フォント 507 個を内包）を改変せずそのまま配信する構成。
  - `src/webui/unpack.ts` + `scripts/webui-unpack.ts` — gzip+base64 マニフェストを
    展開し、UUID 参照を `assets/<uuid>.<ext>` へ書き換えて `webui/dist/`（gitignore 済）
    に静的ファイル化するビルドステップ。デザイン HTML が唯一の正本
  - `src/webui/server.ts` — 依存ゼロ（node:http）の静的サーバ。パストラバーサル防御、
    GET/HEAD のみ許可、`/healthz`、セキュリティヘッダ一式、UUID アセットの
    immutable キャッシュ + シェル文書の no-cache。CSP は `script-src 'self' 'unsafe-eval'`
    （デザインランタイムが `text/x-dc` ソースを `new Function` でコンパイルするため。
    本体 API とは別プロセスに隔離）
  - `src/webui/access-log.ts` — Neon PostgreSQL（`ceop-production` プロジェクト、
    additive な `webui_access_log` テーブル）へ SQL-over-HTTP でアクセスログを
    バッチ記録。ドライバ依存なし・fire-and-forget（Neon 障害が配信を止めない）。
    アセットヒットは記録対象外
  - `deploy/systemd/ceop-webui.service` + `scripts/webui-deploy.sh` — systemd 常駐化
    （hardening: ProtectSystem=strict / ProtectHome=read-only / NoNewPrivileges）と
    ワンコマンドデプロイ。`0.0.0.0:3130` で待受け、LAN URL `http://192.168.0.185:3130/`
  - テスト 14 件追加（277/277 pass）：展開の合成バンドル検証、トラバーサル 4 系統、
    キャッシュ/MIME/HEAD/405/400、アクセスログのバッチ INSERT 形状
- 公開 URL `https://ceop.mirai-dx-platform.com` 配下への WebUI ルーティング
  （Cloudflare Tunnel ingress のパス分割）は production route 変更のため
  **別途 Approval PR** で扱う（本 PR には含まない）

- **監査証跡エクスポート API（L-01 / P2）** — `GET /api/v1/governance/audit/export`
  （`?format=csv|json&limit=1000&offset=0`、limit 最大 10000）。監査人へ証跡を
  引き渡すための一括出力で、次の設計上の判断を含む。
  - 権限は `audit:read` と分離した **`audit:export`**。ログを 1 ページずつ読むことと
    全件を持ち出すことは異なる能力であり、後者だけを個別に付与・剥奪できる必要がある。
    ただし wildcard `audit:*` は両方を満たす（既存 wildcard 保持者は自動的に取得）
  - **拒否された出力要求も監査記録する**（ページ読み取り API とは異なる）。
    拒否された一括持ち出しの試行そのものが証跡価値を持つため。応答書き込み前に記録し、
    クライアント切断で記録が消えないようにしている
  - 出力範囲は記録の**前**にスナップショットする。出力イベント自身が
    「その出力が何を含んでいたか」の説明に混入すると、範囲確定時に存在しなかった
    エントリを含むことになるため
  - 各行に `sequence` / `previousHash` / `hash` を含める。これらが無ければ
    エクスポートは改竄検知可能な証拠ではなく単なる主張の一覧になる
  - テナントスコープは `GET /api/v1/governance/audit` と同一（`scopeAuditEntries`）
  - ファイル名はサーバ生成。呼び出し側の値は `Content-Disposition` に到達しない
- **CSV 数式インジェクション対策（`src/api/csv.ts`）** — 監査エクスポートは
  プログラムより表計算ソフトで開かれることが多く、実質的な consumer が攻撃面になる。
  先頭が `=` `+` `-` `@` TAB CR のセルにアポストロフィを付与して実行を無効化する
  （TAB / CR は Excel・LibreOffice が評価前に除去するため、`=` のみの検査では素通りする）。
  値自体は改変せず、マーカーは表示時に消費されるため監査人は元の値を読める。
  RFC 4180 引用符処理とは**別レイヤー**で、引用符だけでは生きた数式が残り、
  接頭辞だけではカンマ入りの値でレコードが壊れるため両方を適用する
- ダウンロード応答ヘルパ `writeAttachment()` を追加し、ベースラインセキュリティヘッダ
  （nosniff / DENY / no-referrer / no-store）を JSON 応答と共通化。
  エクスポートでは nosniff の重要度が JSON より高い（先頭セルがマークアップに見える
  CSV をブラウザが HTML として同一オリジンで描画しうるため）
- テスト 20 件追加（252/252 pass）。CSV エスケープ 9 件 + エンドポイント統合 11 件。
  数式中和の無効化・権限チェックの緩和・テナントスコープの除去・nosniff の削除・
  スナップショット順序の反転という 5 種の変異をすべて検出することを確認済み
- compose にコンテナハードニングを追加（read_only rootfs + tmpfs、`cap_drop: ALL`、
  no-new-privileges、cpu/memory/pids 制限、ログローテーション）。v0.6.2 イメージで実機起動検証済み

### Fixed

- **HEAD メソッドが全ルートで 404（G-27 / P2）** — `Router.#match` がメソッドを
  厳密一致で照合していたため、`/health` を含む全ルートが HEAD に 404 を返していた。
  多くの死活監視・ロードバランサは既定で HEAD をプローブに使うため、
  正常稼働中のサービスが停止と誤判定されうる状態だった（GET 200 / HEAD 404 を実測）。
  `#match` に HEAD→GET フォールバックを追加。`node:http` は HEAD 応答の本文だけを
  抑止しヘッダ（`Content-Length` 含む）は保持するため、ハンドラ側の変更は不要で
  RFC 9110 の定義どおりの意味論になる。認証も GET と同一に継承されるため、
  保護ルートへの HEAD は 401 のまま。POST 専用ルートへはフォールバックしない。
  併せて監査エクスポートの記録に `method` を追加した。HEAD はルートに到達するが
  本文は破棄されるため、これが無いと実際には配信されていない持ち出しを
  「成功した配信」として証跡に残してしまう
- `docker-compose.prod.yml` を実運用トポロジ（bind mount / `container_name: ceop-platform` /
  loopback bind / `CEOP_IMAGE` 必須）へ整合。従来の named volume・`latest`・`0.0.0.0` 公開は、
  compose 操作が実機に効かない、あるいは空 DB の 2 台目を LAN 公開で起動させる乖離だった
- バックアップ cron のイメージ参照をバージョン固定タグから可動エイリアス
  `ceop-platform:current` へ変更（旧イメージ prune で静かに失敗する問題）

### Changed

- RUNBOOK / BACKUP_RESTORE を実機の `docker run` 運用に合わせて全面改訂。
  compose 未適用による既知の差分、保持世代の手動管理、復元試験未実施を明示
- README・ROOT-ASSESSMENT を v0.6.2 本番稼働の実態へ更新し、新規ギャップ G-19〜G-25 を記録

## [0.6.2] - 2026-08-07

Audit log tenant isolation release.

### Security

- **監査ログのテナント分離（G-18 / P1）** — 監査ログはプラットフォーム全体で
  1 本のハッシュ連鎖であるため、組織スコープ付き資格情報に `audit:read` を
  付与すると他テナントの actor / resource / metadata が閲覧可能だった。
  `recordAudit()` が解決済み context からテナントを `metadata` へ付与し、
  `GET /api/v1/governance/audit` と dashboard の `auditEvents` /
  `deniedAccessEvents` を自組織へ絞り込む。グローバル資格情報は全体可視の
  ままで、プラットフォーム全体の完全性検証は維持される。
  属性付与前の既存エントリはスコープ付き資格情報から不可視（fail-closed）。
  ハッシュ定義は不変のため既存エントリの検証性に影響なし。migration 不要。

### Changed

- `GET /api/v1/governance/audit` の OpenAPI 記述にテナント絞込み挙動を追記。

### Quality

- 監査テナント分離の回帰テスト 5 件を追加（231/231 pass）。修正を戻すと
  該当 3 件が fail することを確認済み（vacuous test でないことの実証）。
- `PLATFORM_VERSION` と Dockerfile の `org.opencontainers.image.version` ラベルの
  一致を検証する回帰テストを追加。バージョンの実体は `src/version.ts` /
  `package.json` / `Dockerfile` の 3 箇所にあるが、これまでテストは前 2 者しか
  照合しておらず、イメージラベルだけが古いまま出荷されうる状態だった（232/232 pass）。

## [0.6.1] - 2026-08-06

WebUI design refresh and hardening release.

### Added

- **Claude-inspired WebUI** — dashboard/governance pages redesigned with a warm
  paper palette, terracotta accent, serif headings, and generous whitespace.
- **External static assets** — `src/web/static/app.css` / `app.js` served from
  `/assets/*`; inline `<style>`/`<script>` blocks removed.
- **SSR session token** — dashboard/governance pages embed a short-lived JWT so
  client-side auto-refresh and audit/policy fetches are authenticated.

### Security

- **CSP hardened** — `unsafe-inline` removed: `default-src 'self'; style-src
'self'; script-src 'self'` (closes SEC-009 backlog item).
- Static assets served with `X-Content-Type-Options: nosniff` and short cache.

### Deploy

- Deployed to production at **https://ceop.mirai-dx-platform.com** (Docker on
  192.168.0.185 + Cloudflare Tunnel `ceop`, systemd `cloudflared-ceop.service`).
- SQLite migrations 001–005 applied; admin/viewer API keys provisioned and
  stored outside the repository (root-only files under `/home/kensan/.ceop/`).
- Daily backup (02:15 JST) and health/ready check (02:30 JST) scheduled via cron.

## [0.6.0] - 2026-08-06

Production readiness release: version unification, CRUD/auth audit coverage,
JWT revocation endpoint, schema consolidation, dependency audit fix, and
operations documentation for the first main-branch release.

### Added

#### Production Readiness (v0.6.0)

- **Version single-source-of-truth** — `src/version.ts` + `PLATFORM_VERSION` guard test; `package.json`, `/api/v1/info`, OpenAPI, SSR UI, and Docker labels unified to `0.6.0`.
- **OpenAPI license corrected** — previously declared `MIT`; now matches the proprietary/UNLICENSED status of the private repository (`LICENSE.md` added).
- **README CI badge fixed** — pointed at the correct GitHub repository.
- **Audit coverage for mutations** — every CRUD mutation (organizations/users/roles/devices/applications), policy CRUD, workflow CRUD, and authentication events (`auth:token`, `auth:revoke`) now append tamper-evident audit events with the authenticated actor (`src/api/audit.ts`).
- **JWT revocation endpoint** — `POST /api/v1/auth/revoke` revokes the caller's current JWT via the persistent revocation store (`auth:write` permission required).
- **Migration 004** — consolidates `workflows`/`revoked_jtis` into the migration set and rebuilds domain tables with foreign-key constraints (works on fresh and legacy databases; verified with `PRAGMA foreign_key_check`).
- **Dependency audit clean** — pnpm overrides resolve the 7 high-severity devDependency advisories (brace-expansion, js-yaml); `pnpm audit --audit-level=high` reports 0 vulnerabilities.
- **API response hardening** — JSON responses now carry `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Cache-Control: no-store`.
- **JWT claim validation** — tokens with `iat >= exp` are rejected as malformed.
- **Readiness probe** — `GET /health/ready` verifies the active persistence tier (in addition to liveness).
- **Audit log pagination** — `GET /api/v1/governance/audit` now supports `offset` and returns `total`/`limit`.
- **Global API rate limit** — `/api/v1/*` is limited per socket IP (default 300 req/min, configurable via `CEOP_RATE_LIMIT_MAX` / `CEOP_RATE_LIMIT_WINDOW_MS`).
- **Migration runner tests** — `applyMigrations()` is now importable and covered by integration tests (idempotency, schema, FK enforcement).
- **SQLite backup script** — `scripts/sqlite-backup.ts` writes a consistent `VACUUM INTO` snapshot and replaces the destination atomically.
- **Operations documentation** — Runbook, backup/restore, monitoring (SLI/SLO), operations ledger, and security response procedures under `docs/operations/`; root `AGENTS.md` and `SECURITY.md` added.
- **Tenant scoping** — API keys/JWTs may carry `organizationId`; org-scoped credentials can only list/read/create/update/delete entities in their own organization (cross-org access returns 404/403). Dashboard and list endpoints are org-filtered.
- **Privilege-escalation control** — role create/update and user role assignment require the grantor to already hold every granted permission (wildcard-aware); `user:write`/`role:write` alone can no longer mint `*:*`.
- **Migration 005** — `api_keys.organization_id` column; `provision-api-key.ts --organization-id` support.

#### M9 — Full Entity CRUD API (21 endpoints)

- **`src/api/routes/entity-crud.ts`** — complete Create/Read/Update/Delete for all 5 platform entities
  - `GET /api/v1/organizations/:id`, `POST`, `PUT`, `DELETE` — organization lifecycle
  - `GET /api/v1/users/:id`, `POST`, `PUT`, `DELETE` — user lifecycle; DELETE is **soft-delete** (status → `deactivated`) to preserve audit trail references
  - `GET /api/v1/roles`, `GET /api/v1/roles/:id`, `POST`, `PUT`, `DELETE` — role management; list endpoint was previously missing
  - `GET /api/v1/devices/:id`, `POST`, `PUT`, `DELETE` — device lifecycle; optional fields `assignedUserId`/`lastSeenAt` preserved on PUT when omitted
  - `GET /api/v1/applications/:id`, `POST`, `PUT`, `DELETE` — application lifecycle
  - Conflict detection (409) via repository lookup for duplicate email, role name, application key
  - All mutations validate through domain factory functions (`createOrganization`, `createUser`, etc.) — invariants always enforced
  - Permission model: `<resource>:read` for GET; `<resource>:write` for POST/PUT/DELETE

- **`src/api/routes/entity-crud.test.ts`** — 34 integration tests (entities + auth guards)
  - Covers: create (201), conflict (409), validation (400), read (200/404), update (200), delete (204/200), permission denial (403), no-auth (401)
  - Users DELETE test verifies `status: "deactivated"` returned and record still accessible via GET

- **`src/api/routes/health.ts`** — `/api/v1/info` version updated to `0.5.0`

### Changed

- **Test count**: 112 → 146 (all pass)

### Security

- Full mutation audit trail (actor from authenticated context, never request body).
- JWT revocation API + revocation audit events.
- Migration 004 foreign-key enforcement for existing and fresh databases.
- Baseline security headers on all JSON API responses.
- `iat < exp` JWT claim validation.
- `pnpm audit` high-severity findings resolved (devDependencies).
- Global per-IP rate limiting on `/api/v1/*`.
- Organization-scoped authorization (tenant isolation) for entities and dashboard.
- Anti-escalation checks on role grants and user role assignment.

---

## [0.5.0] - 2026-06-27

Fifth milestone release: CodeRabbit critical/high security hardening (M7.5) and
production deployment tooling (M8) — Docker Compose prod config, SQLite schema
migration runner, and CLI API key provisioning.

### Added

#### M8 — Production Deployment Tooling

- **`docker-compose.prod.yml`** — production-grade Docker Compose configuration
  - Named volume `ceop-data:/data` backs the SQLite database across container restarts.
  - `CEOP_JWT_SECRET` required at startup; missing value causes container exit.
  - `CEOP_LOG_DEMO_CREDS` hardcoded `"false"` — credentials are never logged in prod.
  - Resource limits: 1 CPU / 256 MiB memory, 64 MiB reservation.
  - `json-file` log driver with 10 MiB / 3-file rotation.

- **`scripts/migrate.ts`** — idempotent SQLite schema migration runner
  - `schema_migrations` tracking table (version, description, applied_at).
  - Defined migrations: `001` (domain entity tables from M7), `002` (`api_keys` table for CLI-provisioned credentials).
  - Each migration wrapped in `BEGIN` / `COMMIT` / `ROLLBACK` — failures roll back cleanly.
  - Re-runs are safe: already-applied versions are skipped with a `✓ already applied` message.
  - Exit codes: 0 = success, 1 = argument/config error, 2 = migration failure.
  - Usage: `node --experimental-strip-types scripts/migrate.ts [--db /data/ceop.db]`

- **`scripts/provision-api-key.ts`** — CLI API key provisioning tool
  - Generates 128-bit random `keyId` and 256-bit random `secret` via `node:crypto`.
  - Computes `HMAC-SHA256(keyId, secret)` and stores only the hash in `api_keys` table.
  - Raw secret printed once to stdout as `KEY_ID=…`, `KEY_SECRET=…`, `CREDENTIAL=…:…`.
  - Credential cannot be recovered after exit; deliver via a secrets manager.
  - Exit codes: 0 = success, 1 = validation error, 2 = database error.
  - Usage: `node --experimental-strip-types scripts/provision-api-key.ts --subject <s> --permissions "p:read,q:write" [--db <path>]`

- **`.env.example`** — updated with all production environment variables
  - Documents `CEOP_JWT_SECRET`, `CEOP_SQLITE_FILE`, `CEOP_SEED_DEMO`, `CEOP_LOG_DEMO_CREDS`.
  - Includes generation command for JWT secret (`openssl rand -hex 32`).
  - Stale placeholders (`API_KEY`, `DATABASE_URL`) removed.

- **`.gitignore`** exception rule — `!scripts/provision-api-key.ts` added so the
  provisioning script is tracked despite the `*key*` wildcard pattern.

#### M7.5 — Security Hardening (CodeRabbit C-1 / H-1 / Major findings)

- **C-1 Critical — ABAC deny-bypass via attribute spread** (`src/governance/policy-engine.ts`)
  - `buildLookup()` previously spread `request.attributes` AFTER the authoritative
    `subject`, `resource`, `action` fields, allowing a caller to pass
    `attributes: { subject: "admin" }` and overwrite the authenticated subject in the
    ABAC lookup map, silently bypassing all subject-scoped deny policies.
  - Fix: spread order reversed — authoritative fields are now written LAST:
    `{ ...request.attributes, subject, resource, action }`.

- **H-1 High — JWT revocation not implemented** (`src/api/middleware/jwt.ts`)
  - `JwtIssuer` interface now exposes `revoke(jti: string): void` and `ttlSeconds`.
  - `createJwtIssuer` maintains a `Map<string, number>` of revoked JTIs keyed to their
    pruning timestamp (expiry Unix second).
  - `verify()` prunes expired revocation entries before checking, then rejects any token
    whose `jti` is in the revocation map with a new `"revoked"` result kind.
  - JWT secret minimum length check: `Buffer.byteLength(secret, "utf8") < 32` throws on
    construction, preventing weak secrets at configuration time.
  - Full payload validation: `sub` (non-empty string), `permissions` (string array),
    `iat` / `exp` (`Number.isSafeInteger`), `jti` (non-empty string).

- **Major #1 — Module-level `rateLimiter` singleton** (`src/api/routes/auth.ts`)
  - Instance creation moved inside `createAuthRoutes()` factory to allow per-request
    isolation in tests and prevent shared state across server instances.

- **Major #2/3/4 — Seeding and credential leakage in `app.ts`**
  - Production fail-fast: `NODE_ENV=production` without `CEOP_JWT_SECRET` throws on startup.
  - Demo seeding now gated on `inMemory || CEOP_SEED_DEMO=true`; persistent stores are never
    polluted by demo data on restart.
  - Demo credential logging requires explicit opt-in via `CEOP_LOG_DEMO_CREDS=true`.

- **Major #5 — Write race condition in `BaseFileRepository`** (`src/persistence/file/base-file-repository.ts`)
  - `#writeQueue: Promise<void>` Promise-chain mutex serializes all `save()` calls;
    concurrent writes no longer race on the shared `.tmp` file.

- **Major #6 — Non-array JSON silently empties the store**
  - `#load()` now throws if the parsed JSON is not an array, and validates that every
    entry has a string `id` field; corrupted files surface immediately.

- **Major #7/8 — Rate limiter unbounded bucket map + no input validation** (`src/api/middleware/rate-limiter.ts`)
  - `MAX_BUCKETS = 10_000` cap prevents memory exhaustion from IP enumeration attacks.
  - `pruneStale()` periodically evicts expired buckets when the cap is reached.
  - `Number.isSafeInteger()` guards on `windowMs` and `maxRequests` constructor arguments.

- **Major #9/10 — JWT secret length and incomplete payload validation** (see H-1 entry above)

- **Major #11/12/13 — Router information leakage + `readJsonBody` settle race** (`src/api/router.ts`)
  - 500 responses suppress `e.message`; only `"unexpected error"` is returned to clients.
  - Access log records `path` only (query string no longer logged — prevents credential leak
    in URLs like `/api?token=…`).
  - `readJsonBody` uses a `settled` guard and explicit `close` event handler to prevent
    double-resolve across all Node.js event edge cases.

- **M-2 — `JwtIssuer` interface incompleteness** — `ttlSeconds` and `revoke` added (see H-1).
- **M-4 — `"unknown"` fallback for missing `remoteAddress`** (`src/api/routes/auth.ts`)
  — null `remoteAddress` now returns `400 Bad Request` instead of silently rate-limiting
  under a shared `"unknown"` key.

### Tests

- 112/112 tests pass (unchanged from v0.4.0 — no net regression from security hardening).

---

## [0.4.0] - 2026-06-27

Fourth milestone release: SQLite-backed persistence layer using `node:sqlite` experimental API.

### Added

- **SQLite persistence base** (`src/persistence/sqlite/base-sqlite-repository.ts`)
  - `BaseSqliteRepository<T>` — generic JSON-in-column SQLite repository.
  - 2-column strategy: `data TEXT NOT NULL` (full JSON) + indexed helper columns for O(log n) queries.
  - WAL journal mode + foreign key enforcement enabled on every `openDatabase()` call.
  - `createRequire(import.meta.url)` bridge for loading untyped `node:sqlite` in ESM context.
  - All public methods are `async` to satisfy the `Repository<T, Id>` port contract.

- **Six domain SQLite repositories** (`src/persistence/sqlite/index.ts`)
  - `SqliteUserRepository` — extra columns: `email` (unique index), `org_id`
  - `SqliteOrganizationRepository` — extra columns: `type`, `parent_id` (nullable)
  - `SqliteRoleRepository` — extra column: `name` (unique index)
  - `SqliteDeviceRepository` — extra column: `org_id`
  - `SqliteApplicationRepository` — extra columns: `app_key` (unique index), `owner_org_id`
  - `SqlitePolicyRepository` — extra column: `effect`
  - `createSqliteRepositories(dbPath)` factory — shared `DatabaseSync` instance across all six repos.

- **Persistence tier selection in `app.ts`**
  - Priority: `CEOP_SQLITE_FILE` → `CEOP_DATA_DIR` → In-Memory.
  - `CEOP_SQLITE_FILE=/data/ceop.db` enables SQLite mode (production-recommended).

- **15 SQLite integration tests** (`src/persistence/sqlite/sqlite-repository.test.ts`)
  - Isolated per-group `:memory:` databases for unit-level CRUD tests.
  - File-based database test verifying WAL persistence across `openDatabase()` calls.
  - Total test count: 112 (up from 97).

### Changed

- `app.ts` — persistence tier selection updated to check `CEOP_SQLITE_FILE` first.

---

### Security (2026-06-27)

- **Rate-limit bypass via spoofable X-Forwarded-For header** — `clientKey()` in
  `src/api/routes/auth.ts` previously trusted the `X-Forwarded-For` / `X-Real-IP`
  request headers, which any client can set to rotate through fake IPs and bypass
  the per-IP rate limiter. The function now uses the TCP-layer `socket.remoteAddress`
  (populated from `req.socket.remoteAddress` in the router, exposed as
  `ApiRequest.remoteAddress`) which cannot be forged by the client. When running
  behind a reverse proxy, configure the proxy to SNAT so Node.js sees the real client
  IP on the socket.

---

## [0.3.0] - 2026-06-27

Third milestone release: JWT session auth, POSIX-atomic file persistence, and
comprehensive security hardening (Critical + High + Medium + Low findings from
CodeRabbit, Codex, and internal review).

### Added

- **JWT authentication** (`src/api/middleware/jwt.ts`)
  - `generateJwtSecret()` — 48-byte cryptographically random hex string.
  - `createJwtIssuer(config)` — HS256 JWT issuer/verifier; `timingSafeEqual` on
    HMAC comparison; 1-hour expiry; `jti` (random 8-byte hex) for replay detection.
  - `JwtVerifyResult` discriminated union: `ok` / `expired` / `invalid` / `malformed`.

- **Rate limiter** (`src/api/middleware/rate-limiter.ts`)
  - Sliding-window rate limiter using `Map<string, number[]>`.
  - Lazy cleanup: expired timestamps are pruned on each `check()` call.
  - `RateLimiter.reset()` clears all buckets (used in tests).

- **Token exchange endpoint** (`src/api/routes/auth.ts`)
  - `POST /api/v1/auth/token` — accepts `{ credential: "keyId:secret" }` and
    returns `{ token, expiresIn: 3600, subject }`.
  - Public route (no Bearer header required); rate-limited at 10 req/min per IP.
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` response headers.

- **Bearer JWT support in Router** (`src/api/router.ts`)
  - Tokens containing `:` → API key path (existing behaviour).
  - Tokens without `:` → JWT verify path; `JwtPayload` mapped to `ApiKeyContext`.
  - `RouterOptions.jwtIssuer` optional field; Router backward-compatible with
    `Map<string, ApiKeyRecord>` (tests still pass a plain Map).

- **POSIX-atomic file repositories** (`src/persistence/file/`)
  - `BaseFileRepository<T>` — lazy-load JSON cache; atomic write via
    `writeFile(tmpPath) → rename(tmpPath, filePath)` (crash-safe; no partial writes).
  - Six concrete repositories: `FileUserRepository`, `FileOrganizationRepository`,
    `FileRoleRepository`, `FileDeviceRepository`, `FileApplicationRepository`,
    `FilePolicyRepository` — each delegates id-typed methods to the base class.
  - `createFileRepositories(dataDir)` factory — creates the directory tree with
    `ensureDataDir()` and wires all six repositories.
  - `CEOP_DATA_DIR` env var in `src/app.ts` — when set, activates file-backed
    persistence instead of the default in-memory repositories.
  - `CEOP_JWT_SECRET` env var — when set, overrides the auto-generated JWT secret
    so secrets persist across process restarts.

- **ApiRequest.remoteAddress** (`src/api/types.ts`)
  - TCP-layer remote address populated by the router from `req.socket.remoteAddress`.
  - Used by the auth route for rate-limiting; prevents X-Forwarded-For spoofing.

### Security — Round 3 (CodeRabbit + Codex findings — 2026-06-27)

- **Dashboard list endpoints missing authorization (Critical)** — `GET /api/v1/organizations`,
  `GET /api/v1/users`, `GET /api/v1/applications`, and `GET /api/v1/devices` now enforce
  per-permission guards via a shared `hasPermission()` helper. Organization and user listings
  require `organization:read` / `user:read` (admin only); application and device listings
  require `application:read` / `device:read` (admin + viewer). Unauthenticated callers receive
  401; authenticated callers without the required permission receive 403.
- **ABAC conditions broken for top-level request fields (High)** — `conditionsHold` in
  `policy-engine.ts` merged `request.subject`, `resource`, and `action` into the attribute
  lookup map so policies using `conditions: [{ attribute: "subject", equals: "guest" }]` now
  correctly gate access.
- **ITSM spread order bug — caller id/status could override generated values (High)**.
- **CMDB adapter returns live references (High)** — `getItem()` / `listItems()` return
  shallow clones.
- **Invalid ISO timestamp acceptance (High)** — `toIsoTimestamp()` performs round-trip check.
- **CSP blocks inline styles/scripts (Medium)**, **health class prefix mismatch (Medium)**,
  **audit outcome class injection (Medium)**, **hasPermission not shared (Medium)**,
  **document adapter `missingVariables` inconsistency (Low)**, and additional low-severity
  fixes.

### Security — Round 2 (code-review findings — 2026-06-27)

- **keyId enumeration via error message (Low→fixed)**, **NODE_ENV case sensitivity (High)**,
  **body/JSON error separation (Medium)**, **missing governance:evaluate permission (Medium)**,
  **wildcard permission coverage gap (Medium)**, **CSP form-action/base-uri/frame-ancestors
  (Medium/Low)**, **Cache-Control no-store (Low)**.

### Security — Round 1 (2026-06-27)

- **Timing attack (Critical)** — HMAC comparison uses `timingSafeEqual`.
- **DoS — body size (High)** — 1 MiB request-body limit.
- **Missing authorization on audit log and policy listing (High ×2)**.
- **Silent audit failure (High)**, **CSP header (High)**, **demo key logging (High)**,
  **audit actor spoofing (High)**.

### Fixed

- **TypeScript exactOptionalPropertyTypes compliance** — four categories resolved:
  - `src/api/router.ts`: private field `#jwtIssuer?: JwtIssuer` → `: JwtIssuer | undefined`.
  - `src/api/server.ts`: conditional spread to avoid passing `{ jwtIssuer: undefined }`.
  - `src/persistence/file/file-repository.test.ts`: `IsoTimestamp` import + `nowTs()` return
    type; removed incorrect `_brand` (single underscore) casts.
  - `src/persistence/file/index.ts`: `override` keyword on all 12 `findById`/`delete` methods.

### Quality

- Test count increased from 45 to **97** (39 new: JWT middleware ×15, rate limiter ×7,
  auth route ×5, file repository ×12).
- typecheck, lint, build, and all 97 tests remain green.

### Notes

- File repositories are suitable for single-node deployments; for multi-node or high-load
  use cases, replace with PostgreSQL / SQLite WAL adapters (ports are defined in
  `src/persistence/ports.ts`).
- JWT secret defaults to a per-process random value; set `CEOP_JWT_SECRET` for persistence.
- Concrete external adapters (CMDB, ITSM, etc.) are planned for M7.

---

## [0.2.0] - 2026-06-27

### Security / Quality — Round 3 (CodeRabbit + Codex findings — 2026-06-27)

- **Dashboard list endpoints missing authorization (Critical)** — `GET /api/v1/organizations`,
  `GET /api/v1/users`, `GET /api/v1/applications`, and `GET /api/v1/devices` now enforce
  per-permission guards via a shared `hasPermission()` helper. Organization and user listings
  require `organization:read` / `user:read` (admin only); application and device listings
  require `application:read` / `device:read` (admin + viewer). Unauthenticated callers receive
  401; authenticated callers without the required permission receive 403.
- **ABAC conditions broken for top-level request fields (High)** — `conditionsHold` in
  `policy-engine.ts` merged `request.subject`, `resource`, and `action` into the attribute
  lookup map so policies using `conditions: [{ attribute: "subject", equals: "guest" }]` now
  correctly gate access. Previously only `request.attributes` was checked.
- **ITSM spread order bug — caller id/status could override generated values (High)** —
  `InMemoryItsmAdapter.createIncident()` now spreads input first, then overwrites `id` and
  `status` with generated values, ensuring callers cannot inject a pre-set id or bypass
  `"open"` status.
- **CMDB adapter returns live references (High)** — `getItem()` and `listItems()` now return
  shallow clones (`{ ...item, attributes: { ...item.attributes } }`) so callers cannot mutate
  the internal store state.
- **Invalid ISO timestamp acceptance (High)** — `toIsoTimestamp()` in `domain/common.ts` now
  performs a round-trip check: `new Date(value).toISOString() !== value` rejects dates like
  `"2026-02-30T00:00:00.000Z"` that JavaScript silently normalizes to a different date.
- **CSP blocks inline styles/scripts in SSR templates (Medium)** — `sendHtml()` in `web.ts`
  added `style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'` because
  `default-src 'self'` does not cover inline `<style>` and `<script>` blocks.
- **Health class prefix mismatch (Medium)** — `renderer.ts` and `index.html` corrected
  `app-health-dot` class from `${health}` to `health-${health}` (e.g. `health-healthy`) to
  match the CSS selectors `.health-healthy`, `.health-degraded`, `.health-down`.
- **Audit outcome class injection (Medium)** — `index.html` now allowlists outcome values
  (`success | denied | error`) before inserting them as CSS class names, preventing arbitrary
  class injection from audit log data.
- **hasPermission helper not shared (Medium)** — `hasPermission()` exported from
  `governance.ts` and imported in `dashboard.ts`; single source of truth for wildcard
  permission matching across all route modules.
- **document adapter `missingVariables` inconsistency (Low)** — uses
  `Object.prototype.hasOwnProperty.call` consistently with `render()`, preventing
  prototype-chain pollution from keys like `constructor` or `toString`.
- **Governance page missing API key input (Low)** — `governance.html` now includes an API key
  field; `runEvaluate()` reads it and sends `Authorization: Bearer <key>` so the policy
  evaluation form is usable without browser dev tools.
- **Healthcheck accepts only 200 (Low)** — `scripts/healthcheck.ts` now accepts any 2xx
  response (`statusCode >= 200 && statusCode < 300`) for forward-compatibility with 204/206.
- **Router throws 500 on malformed URL encoding (Low)** — `router.ts` wraps `#match()` in a
  try-catch to convert `URIError` from malformed `%xx` sequences into HTTP 400 Bad Request.
- **`demo` script missing `--experimental-strip-types` (Low)** — `package.json` updated so
  `pnpm run demo` can execute the `.ts` entry point directly.
- **New HTTP integration tests for dashboard authorization** — `src/api/routes/dashboard.test.ts`
  added 13 tests covering admin-only (organizations, users) and viewer-accessible (applications,
  devices) endpoints, plus unauthenticated 401 responses and response-shape assertions.

### Security — Round 2 (code-review findings — 2026-06-27)

- **keyId enumeration via error message (Low→fixed)** — `auth.ts` now returns a unified
  `"invalid credentials"` message for both missing keyId and wrong secret, preventing callers
  from distinguishing the two cases and enumerating valid key IDs.
- **NODE_ENV case sensitivity (High)** — `app.ts` now uses `.toLowerCase()` so
  `"Production"` and `"PRODUCTION"` are treated identically to `"production"`.
- **Body size vs JSON parse error conflation (Medium)** — `router.ts` now returns
  `"request body exceeds 1 MiB limit"` (413-style message) vs
  `"request body must be valid JSON"` for distinct failure modes.
- **Missing governance:evaluate permission (Medium)** — `POST /api/v1/governance/evaluate`
  now requires `governance:evaluate` (or wildcard) permission; viewer-only keys receive 403.
- **Wildcard permission coverage gap (Medium)** — `audit:*` and `policy:*` resource-level
  wildcards now correctly grant `audit:read` and `policy:read` respectively, via a shared
  `hasPermission(ctx, resource, action)` helper that handles `r:a`, `r:*`, `*:a`, and `*:*`.
- **CSP `form-action` missing (Medium)** — `form-action 'self'` added; `default-src` does not
  cover form submission targets per CSP Level 3 specification.
- **CSP `base-uri` missing (Low→fixed)** — `base-uri 'none'` prevents `<base>` tag injection
  from redirecting all relative URLs to an external origin.
- **CSP `frame-ancestors` missing (Low→fixed)** — `frame-ancestors 'self'` added alongside
  `X-Frame-Options: SAMEORIGIN` for defense-in-depth against browsers that ignore the legacy header.
- **Missing `Cache-Control` (Low→fixed)** — SSR pages now include `Cache-Control: no-store`
  to prevent sensitive dashboard content from being stored in browser or proxy caches.

### Security — Round 1 (2026-06-27)

- **Timing attack (Critical)** — HMAC hash comparison in `auth.ts` now uses
  `crypto.timingSafeEqual` instead of `!==` to prevent timing side-channel attacks.
- **DoS — body size (High)** — `router.ts` enforces a 1 MiB request-body limit; oversized
  bodies are rejected before buffering to prevent heap exhaustion.
- **Missing authorization on audit log (High)** — `GET /api/v1/governance/audit` now requires
  `audit:read` (or wildcard) permission; unauthenticated callers receive 403.
- **Missing authorization on policy listing (High)** — `GET /api/v1/governance/policies` now
  requires `policy:read` permission.
- **Silent audit failure (High)** — governance evaluate no longer silently discards audit event
  creation errors; failures are logged for investigation.
- **Content-Security-Policy (High)** — SSR pages now include `Content-Security-Policy` header.
- **Demo key logging (High)** — API key credential printing in `app.ts` is gated behind
  `NODE_ENV !== "production"` to prevent secret leakage in production logs.
- **Audit actor spoofing (High)** — `POST /api/v1/governance/evaluate` uses `ctx.subject`
  (authenticated API key) as the audit actor rather than the request body's `subject` field.

### 初版リリース内容

Second milestone release: HTTP API Gateway, Server-Side Rendered frontend, persistence layer,
and Docker production packaging.

### Added

- **HTTP API Gateway** (`src/api/`)
  - `Router` — lightweight path-parameter router on `node:http` primitives (no framework).
  - `createServer()` — CORS-aware HTTP server factory wiring all route groups.
  - `GET /health` — public liveness probe for load balancers and Kubernetes probes.
  - `GET /api/v1/info` — build info (name, version, environment).
  - `GET /api/v1/dashboard` — role-filtered dashboard JSON via Governance Core.
  - `GET /api/v1/organizations` — organisation listing.
  - `GET /api/v1/users` — user listing.
  - `GET /api/v1/applications` — application listing.
  - `GET /api/v1/devices` — device listing.
  - `GET /api/v1/governance/policies` — policy listing.
  - `GET /api/v1/governance/audit` — tamper-evident audit log (`?limit` up to 200).
  - `POST /api/v1/governance/evaluate` — RBAC+ABAC access decision endpoint; every
    evaluation is automatically recorded to the audit log.

- **API key authentication middleware** (`src/api/middleware/auth.ts`)
  - `Bearer keyId:secret` credential format; secrets stored as HMAC-SHA256 only (never plaintext).
  - Constant-time comparison to resist timing attacks.

- **Server-Side Rendered frontend** (`src/web/`)
  - `GET /` — 302 redirect to `/dashboard`.
  - `GET /dashboard` — HTML dashboard page (role-based, SSR, guest-scoped view).
  - `GET /governance` — HTML governance management page (policy list, SSR).
  - Security response headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.

- **In-Memory Persistence Layer** (`src/persistence/in-memory/`)
  - Generic `InMemoryRepository<T>` implementing `findAll` / `findById` / `save` / `delete`.
  - Concrete repositories: `OrganizationRepository`, `UserRepository`, `RoleRepository`,
    `DeviceRepository`, `ApplicationRepository`, `PolicyRepository`.

- **Application bootstrap** (`src/app.ts`)
  - `createApp()` — wires repositories, audit log, API key store, and deterministic demo seed
    data into an `AppContainer`. Each call returns an independent in-memory container.
  - `start(port?)` — binds the HTTP server with graceful SIGTERM / SIGINT shutdown.

- **Production start script** (`scripts/start.ts`)
  - Launched via `node --experimental-strip-types scripts/start.ts` (no build step needed).
  - Reads `PORT`, `NODE_ENV`, `LOG_LEVEL`, `PLATFORM_NAME` from environment.

- **Docker packaging** (`Dockerfile`, `docker-compose.yml`)
  - Multi-stage build: `build` stage (tsc compile) + `runtime` stage (zero npm deps in image).
  - Non-root user (`ceop:ceop`, uid 1001) for least-privilege security.
  - `HEALTHCHECK` using curl against `/health`.
  - `docker-compose.yml` for local development with source volume mounts.

### Changed

- `src/index.ts` — public re-exports extended with `adapters` namespace (`v0.1.0` had
  `domain`, `governance`, `dashboard`; `v0.2.0` adds explicit `adapters` export).
- Package `version` bumped to `0.2.0`.

### Quality

- Test count increased from 31 to **45** (14 new API + server integration tests).
- typecheck, lint, build, and all 45 tests remain green.
- Docker image verified: multi-stage build compiles cleanly; runtime image has zero npm deps.

### Notes

- Persistence is still in-memory; a persistent store (PostgreSQL / SQLite) is planned for M6.
- API key lifecycle (rotation, expiry) is not yet implemented; demo keys are ephemeral per process.
- Concrete external adapters (CMDB, ITSM, etc.) are planned for M6.

---

## [0.1.0] - 2026-06-25

First foundation release: a verifiable coordination layer for the platform.

### Added

- **Domain model** — the eight core domains (`organization`, `user`, `role`, `device`,
  `application`, `workflow`, `policy`, `audit-event`) with branded ids, exhaustive
  enums, and exception-free `Result`-based validation.
- **Governance Core**
  - `evaluateAccess` — access decisions with deny-overrides precedence
    (explicit deny > explicit allow > RBAC grant > default deny) plus ABAC conditions.
  - `AuditLog` — append-only, SHA-256 hash-chained audit trail with tamper detection.
- **Role-based dashboard** — `buildDashboard`, a pure read-model that filters
  governance / app-health / device / pending-approval data by viewer permission and
  reports withheld record counts (no silent redaction).
- **Adapter ports** — `CmdbPort`, `ItsmPort`, `ImsPort`, `LegalOpsPort`, `BcpPort`,
  `DocumentPort` integration contracts, with an in-memory `DocumentPort` reference adapter.
- **Tooling** — strict TypeScript, ESLint (flat config), Prettier, `node:test`,
  GitHub Actions CI, and a runnable `examples/quickstart.ts` demo.

### Quality

- typecheck, lint, build green; 31 unit + integration tests passing.

### Notes

- Runtime has **no production dependencies**; it runs on Node v22.6+ native TypeScript.
- Not yet production-ready: persistence, API gateway, and concrete adapters land in M4.
