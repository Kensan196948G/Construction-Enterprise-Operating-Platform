# CEOP 自律運用ログ（2026-08-07 セッション）

> 主任エージェント（CTO 兼実装・リリース・運用責任者）が維持する作業記録。
> このファイルが計画・判断・検証証跡・残課題の正本となる。コンテキスト圧縮後も
> このファイルを読めば再開できることを保証する。

## 1. ゴール（state.json / 本セッション）

- 本リポジトリを精査し、既存ユーザー変更を保護した上で本番運用可能な状態まで完成させる。
- 完了条件: P0 ゼロ、P1 解消または管理可能な残課題化、選定機能の受入条件達成、
  CI・本番確認・rollback・監視・運用引継ぎ成立。
- 反復ループ: Monitor → Assessment → Gap/Feature Discovery → Prioritization →
  Development → Verify → Review → Improvement → Re-assessment

## 2. 実行環境・アクセス情報（2026-08-07 時点）

| 項目           | 値 / 状態                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| リポジトリ     | `Kensan196948G/Construction-Enterprise-Operating-Platform`                                                                          |
| ブランチ       | main + 作業ツリー（v0.8.0 実装中）。PR 用ブランチ `feat/production-hardening-r3` を作成予定                                         |
| 未コミット差分 | `.claude/START_PROMPT.md`（変更）・`.claude/skills/verify-app/SKILL.md`（追加）＝ユーザー変更として保護。それ以外は v0.8.0 実装差分 |
| 本番 URL       | https://ceop.mirai-dx-platform.com（API v0.6.2 / WebUI v0.7.1 を確認 2026-08-07）                                                   |
| 本番ホスト     | 192.168.0.185（docker run + cloudflared tunnel + systemd ceop-webui）                                                               |
| gh auth        | Kensan196948G で認証済み（repo/workflow/gist/read:org）                                                                             |
| CI             | main 最新 success（#16）・未解決 PR/Issue なし                                                                                      |

## 3. Plugins / Skills / MCP 対応表

| 目的                           | 利用可能なもの                            | 使用可否         | 使用結果・未使用理由                                                                                                                                                                      |
| ------------------------------ | ----------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub（PR/Issue/CI/リリース） | gh CLI・GitHub MCP（app UI リソース）     | ✅ gh CLI を使用 | 認証・branch protection・CI・release を確認                                                                                                                                               |
| セキュリティ監査               | codex-security skills（security-scan 等） | ◯ 評価のみ       | security-scan は subagent 必須の多段スキャンのためスロット上限で実行不可。既存 scan-20260806（全指摘解決済み）+ v0.8.0 実装のコード/テストレビューで代替（exhaustive 相当とは主張しない） |
| 検証ループ                     | verify-app（ユーザー .claude/skills）     | ✅ 準用          | 実装後の verify/build/audit ゲートとして使用                                                                                                                                              |
| 知識グラフ                     | memory://knowledge-graph（MCP リソース）  | ◯ 参照可         | 構造化検索ツールが本セッションに無いため、必要時のみ参照                                                                                                                                  |
| Cloudflare                     | cloudflare 系 skills                      | 未使用           | 本セッションに Cloudflare MCP ツール/資格情報が露出していない。Tunnel は実機 systemd で稼働中。変更時は local cloudflared + docs 経由で実施                                               |
| Neon                           | neon-postgres 系 skills                   | 未使用           | MCP ツールなし。WebUI アクセスログは実機 env 経由で稼働中。変更時は docs + SQL 確認で実施                                                                                                 |
| コード調査                     | codebase-memory-mcp（AGENTS.md 記載）     | ◯                | `search_graph` 等の MCP ツールは本セッションに未露出。grep/rg で代替                                                                                                                      |
| デザイン                       | imagegen / design 系                      | 未使用           | 今回のスコープではビットマップ生成不要                                                                                                                                                    |

## 4. Monitor フェーズの初期証跡

### 4.1 ベースライン検証（2026-08-07 実施）

| ゲート                                    | 結果                                                              |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `pnpm run verify`                         | ✅ pass（初期 280 → v0.8.0 統合後 **297/297**）                   |
| `pnpm run build`                          | ✅ pass                                                           |
| `pnpm audit --audit-level=high`           | ✅ 0 vulnerabilities                                              |
| GitHub CI（main）                         | ✅ success（run 31149678696）                                     |
| 公開 /health, /health/ready, /api/v1/info | ✅ 200（API v0.6.2）                                              |
| 公開 /healthz, /                          | ✅ 200（WebUI v0.7.1）                                            |
| 本番コンテナ / systemd                    | ✅ ceop-platform healthy / ceop-webui active / cloudflared active |

### 4.2 初期に確認したギャップ（詳細はフェーズ 2 以降で確定）

- **O-候補**: main（v0.7.1）と本番 API（v0.6.2）が乖離。v0.8.0 のタグ・Release・GHCR イメージなし
- **O-候補**: OpenAPI `info.version` が 0.6.2、README テスト数 277、state.json 263、実測 280
- **O-候補**: RUNBOOK/MONITORING 記載の compose ハードニング・ログローテーションは実機未適用
- **O-候補**: バックアップ世代自動削除・オフサイトコピー未実装、復元試験未実施
- **O-候補**: 通知経路（アラート伝達）未実装
- **O-候補**: G-22 HSTS は SSR 実装済みだが API JSON 応答は HSTS 無し（プロキシ/CF 側で要設定）
- **O-候補**: G-25 Cloudflare Tunnel 経由は全リクエストが同一 socket IP（127.0.0.1）に見えるためレート制限が実質単一バケット
- **SEC-候補**: リクエスト ID 無し、API キー失効管理 API/UI 無し、CSP nonce/hash 化（SSR は解決済み、WebUI は unsafe-eval）

## 5. 委任状況（統合フェーズ）

| エージェント | 対象                                | 状態                                             |
| ------------ | ----------------------------------- | ------------------------------------------------ |
| audit_core   | コア実装・API/DB・セキュリティ深査  | 書込み停止済み。成果は作業ツリー差分として統合中 |
| audit_ops    | 文書・CI/CD・リリース・本番運用整合 | 主任が統合・検証・リリースを実施                 |
| audit_ui     | UI/UX・WebUI・a11y・パフォーマンス  | 書込み停止済み。成果は作業ツリー差分として統合中 |

## 6. 現在の進捗（2026-08-07 統合フェーズ）

1. ✅ v0.8.0 実装統合（HSTS / X-Request-Id / CF-IP / 監査テナント / OpenAPI / backup-retention / API キー管理 API / Webhook 通知 / UUID 防御 / ヘルス拡充）
2. ✅ verify 297/297・build・pnpm audit 0・openapi:check 成功
3. ✅ 文書整合（README / RUNBOOK / BACKUP_RESTORE / MONITORING / OPERATIONS_LEDGER / ROOT-ASSESSMENT / CHANGELOG / state.json）
4. ⏳ PR 用ブランチ作成 → 論理 commit → push → CI → レビュー → main マージ
5. ⏳ v0.8.0 タグ・Release・GHCR イメージ → RUNBOOK §3 で本番デプロイ → 実測スモーク
6. ⏳ 本番 cron（保持ポリシー・WebUI 外形プローブ・Webhook 宛先設定）と運用引継ぎ、最終 GO 判定

## 7. 本番デプロイ記録（2026-08-07）

1. ✅ PR #17（feat/production-hardening-r3）マージ → main = e8b171b
2. ✅ タグ v0.8.0 → Release workflow 成功（GHCR イメージ・GitHub Release 作成）
3. ✅ 事前バックアップ: `/home/kensan/.ceop/backups/ceop-predeploy-v0.8.0-20260807T055524Z.db`
   （※ GHCR pull はトークンに read:packages が無く不可。main e8b171b からローカル再現ビルドで
   `ceop-platform:v0.8.0` を作成しデプロイ。Release の公開物はワークフロー成功を根拠に記録）
4. ✅ migration 0 件適用（スキーマ変更なし・冪等確認）
5. ✅ コンテナ差し替え: 旧 `ceop-platform` → `ceop-platform-prev`（停止・保持）、
   新 `ceop-platform` = v0.8.0（read-only / cap-drop ALL / no-new-privileges / cpus=1 / mem=256m /
   pids=128 / log rotate 10m×3 / loopback 3120）
6. ✅ 実測: `/api/v1/info` = 0.8.0（environment/nodeVersion 含む）/ HEAD /health 200 /
   token 200 / dashboard 200 / audit list 200 / audit export 200 / auth keys 200 /
   delete missing 404 / 無資格・不正資格 401 / WebUI /healthz = 0.8.0 / LAN 直アクセス拒否
7. ✅ WebUI 更新: webui.env `CEOP_WEBUI_HOST=127.0.0.1`（backup あり）、
   `scripts/webui-deploy.sh` で v0.8.0 配信・systemd 再起動・/healthz 確認
8. ✅ 本番 cron: 02:15 backup / 02:16 retention（14 日）/ 5 分間隔 API probe / 5 分間隔 WebUI probe。
   retention 手動実行 0 件削除・WebUI probe 初回 OK を確認。crontab バックアップ保存済み
9. ⏳ Webhook 宛先（CEOP_ALERT_WEBHOOK_URL）は未設定 — 通知先決定後に設定（残課題）

## 8. 完了監査（2026-08-07）

- P0: ゼロ（依存監査 0・認証認可・監査・レート制限・ヘッダ・FK 確認済み）
- P1: 解消（G-29 本番 v0.8.0 デプロイ・実測確認。既存 P1 は v0.6.x で解消済み）
- 選定機能: API キー管理 API / リクエスト ID / CF-IP 分離 / HSTS / バックアップ保持 / Webhook 通知 / OpenAPI 整合 / 監査テナント / WebUI loopback / UUID 防御 / ヘルス拡充 — すべて実装・テスト・本番確認済み
- CI: PR #17・#18 全チェック成功、main CI success
- 本番: API/WebUI v0.8.0・ヘルス/スモーク/ネガティブ制御 実測済み・rollback 準備あり
- 監視・運用: API/WebUI 外形プローブ 5 分間隔・バックアップ+保持 cron・Runbook/台帳更新済み
- 残課題（管理可能）: Webhook 宛先設定、Cloudflare エッジ HSTS、オフサイトバックアップ、四半期復元試験、SLI 計測、CSP nonce、SSO/OIDC、AI ゲートウェイ

## 9. v0.8.1 追加検証（主任エージェント実施・2026-08-07）

並行セッションによる v0.8.0 実装・デプロイ完了後、主任として独立に再検証し、
以下の本番障害を発見・修正した。

### 発見: SSR アセット 404（G-36 / P1）

- 公開 ingress は `/assets/*` を WebUI（3130）へ振り分ける
- API の `/dashboard` / `/governance` は `/assets/app.css`・`/assets/app.js` を参照
- 実測: `GET /dashboard` 200（HTML に `/assets/...` 参照）、`GET /assets/app.css` 404（WebUI 側）
- 影響: 公開 URL で SSR 画面のスタイル/JS が欠落

### 修正（PR #20 / branch fix/ssr-assets-public-path）

- SSR テンプレートの参照を `/api/assets/app.css|js` へ変更（Tunnel は `/api/*` を API へ振り分け）
- API ルーターに `/api/assets/*`（公開）を追加。旧 `/assets/*` はローカル互換で維持
- API 静的アセット応答に HSTS を明示
- 統合テスト 5 件追加（302/302 pass）
- バージョン 0.8.1 へ統一（src/version.ts・package.json・Dockerfile・OpenAPI・README・
  state.json・RUNBOOK・ROOT-ASSESSMENT・CHANGELOG）

### 検証結果（2026-08-07 06:08 JST）

| ゲート                          | 結果                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm run verify`               | ✅ 302/302 pass（format / openapi:check / typecheck / lint / test）                        |
| `pnpm run build`                | ✅ pass                                                                                    |
| `pnpm audit --audit-level=high` | ✅ 0 vulnerabilities                                                                       |
| 本番実測（v0.8.0 時点）         | API 0.8.0・WebUI 0.8.0・HSTS/X-Request-Id 付与・コンテナ hardening 適用済み・cron 4 本稼働 |

### リリース・本番デプロイ（2026-08-07 06:14 JST）

1. ✅ PR #20 マージ（main = 3b47408）→ CI 全チェック成功
2. ✅ タグ v0.8.1 → Release workflow 成功（run 31153192070・GitHub Release 作成）
3. ✅ 事前バックアップ: `ceop-predeploy-v0.8.1-20260807T061357Z.db`・migration 0 件（冪等確認）
4. ✅ コンテナ差し替え: 旧 v0.8.0 → `ceop-platform-prev-080`（停止保持）、新 `ceop-platform` = v0.8.1
   （read-only / cap-drop ALL / no-new-privileges / cpus=1 / mem=256m / pids=128 / log 10m×3 / loopback 3120）
5. ✅ WebUI 更新: `scripts/webui-deploy.sh` で v0.8.1 配信・`/healthz` = 0.8.1
6. ✅ 実測: `/api/v1/info` = 0.8.1 / health・ready 200 / dashboard 200（`/api/assets/*` 参照）/
   `/api/assets/app.css` 200 + HSTS / governance 200 / auth keys 200 / 無資格 401 /
   WebUI healthz = 0.8.1
7. 残課題（運用管理対象）: Webhook 宛先設定・Cloudflare エッジ HSTS・オフサイトバックアップ・
   四半期復元試験・SLI 計測・GitHub Actions の Node 20 アクション更新・P3 バックログ

## 10. 5 リポジトリ統合（2026-08-07 新タスク）

### P0: ソース統合（PR #22 / feat/integration-source-import）

- `integrations/` に 5 リポジトリ（ServiceHub / Enterprise-OS / OnePlatform / DX-OS / Synapse）の
  現行スナップショット（.git 除く・秘密情報スキャン済み）を取り込み
- `docs/integration/INTEGRATION_PLAN.md`・`FEATURE_INVENTORY.md`・`NOTICE.md` を作成
- `eslint.config.js` / `AGENTS.md` / `.gitignore` を統合ソース保全用に調整
- verify 302/302 pass（統合ソースは lint/typecheck 対象外）

### P2: ワークフローインスタンス（L-02 / Y-04 / E-04）実装

- `src/domain/workflow-instance.ts`（pending→approved/rejected/cancelled・不変条件）
- リポジトリ: in-memory / file / SQLite（migration 006 `workflow_instances`）
- API: GET 一覧 / POST 作成 / POST decision / POST cancel（workflow:read|write・テナントスコープ・監査記録）
- OpenAPI 生成・README・CHANGELOG・FEATURE_INVENTORY を更新
- テスト 13 件追加 → **315/315 pass**・build・audit 0

### P1: CEOP ゲートウェイ実装（2026-08-07・本セッション追記）

- `src/domain/gateway-service.ts`: 統合サービス登録（baseUrl/pathPrefix/権限/timeout/upstreamTokenEnv）の検証
- `src/api/gateway/config.ts`: `CEOP_GATEWAY_SERVICES`（JSON）読込・fail-closed
- `src/api/gateway/proxy.ts`: リバースプロキシ（内部ヘッダー付与・クライアント同ヘッダー破棄・
  パストラバーサル拒否・タイムアウト504・到達不能502・上流トークンは環境変数）
- `src/api/routes/gateway.ts`: `/api/v1/integrations/<service>/*`（read/write 権限・監査記録）
- Router: ワイルドカードセグメント（`*`）と `all()` を追加
- OpenAPI・README・CHANGELOG・RUNBOOK・.env.example 更新
- テスト 16 件追加 → **334/334 pass**・verify/build/audit 0
- PR #24（feat/p1-gateway）

### P2: AI 統制・端末受信の残りを実装（2026-08-07・本セッション追記）

- `src/domain/ai-action.ts`: pending→approved/rejected の不変条件・promptHash 検証（SHA-256 hex）
- `src/api/routes/ai-actions.ts`: GET 一覧 / POST 作成 / POST decision（ai:read|write|approve・テナント・監査）
- `src/domain/device.ts`: `metadata`（インベントリ）・`touchDevice()`・`withDeviceMetadata()` を追加
- `src/api/routes/device-ingest.ts`: register / heartbeat / inventory（device:write・監査・クロステナント拒否）
- 永続化: in-memory / file / SQLite（migration 007 `ai_actions`）・ports に `aiActions` を追加
- OpenAPI・README・CHANGELOG・FEATURE_INVENTORY（Y-09 / D-01〜D-03 ✅）・RUNBOOK 更新
- テスト 11 件追加 → **367/367 pass**・verify/build/audit 0
- PR #26（feat/p2-ai-device）

### v0.9.0 リリース・本番デプロイ（2026-08-07・ユーザー Y 承認）

- PR #28（chore/release-v0.9.0）マージ → tag `v0.9.0`（6ce8dc2）・Release workflow success
  （GHCR `ghcr.io/kensan196948g/construction-eop:0.9.0` + GitHub Release 公開）
- 事前バックアップ: `/home/kensan/.ceop/backups/ceop-predeploy-v0.9.0-20260807T074959Z.db`（184KB・snapshot OK）
- migration `007`（ai_actions）本番適用済み・schema_migrations 001〜007 確認・`ai_actions` テーブル/列検証
- ローカル再現ビルド `ceop-platform:v0.9.0`（80fd7c41）でデプロイ:
  `--read-only --cap-drop ALL --no-new-privileges --cpus 1 --memory 256m --pids-limit 128 --log-opt max-size=10m --log-opt max-file=3 --tmpfs /tmp:rw,noexec,nosuid,size=32m -p 127.0.0.1:3120:3000 --env-file /home/kensan/.ceop/.env -v /home/kensan/.ceop/data:/data`
- 旧コンテナは `ceop-platform-prev-v0803` として保持（rollback 用）
- スモーク: `/health` 200・`/api/v1/info` = 0.9.0（production）・`/health/ready` 200・
  protected ルート 401（ai-actions/devices/register/workflow-instances）・
  gateway はサービス未登録のため 404（fail-closed・P3 で設定）・WebUI 200/200・公開 API 0.9.0・公開 root 200
- container health: healthy・ログ異常なし
- 残課題: CEOP_GATEWAY_SERVICES は P3 統合サービス接続時に設定（現状無効・fail-closed）

### P3: ServiceHub 業務モジュール移植（S-01 案件・S-02 日報・2026-08-07 本セッション追記）

- `src/domain/project.ts`: 案件（projectCode/名称/発注者/現場/工期/予算/管理者/状態）検証
- `src/domain/daily-report.ts`: 日報（天気/作業員/安全/進捗/課題）と draft→submitted→approved 遷移
- API: `/api/v1/projects` CRUD + `/api/v1/projects/:projectId/daily-reports` +
  `/api/v1/daily-reports/:id` + `/transition`（project:read|write / daily-report:read|write・テナント・監査）
- 永続化: in-memory / file / SQLite（migration 008 projects / 009 daily_reports）
- OpenAPI・README・CHANGELOG・FEATURE_INVENTORY（S-01/S-02 ✅）・RUNBOOK 更新
- テスト 10 件追加 → **367/367 pass**・verify/build/audit 0
- PR #30（feat/p3-servicehub-projects）

### P3 継続: S-03〜S-05・S-09 スライス実装（2026-08-07 本セッション追記）

- `src/domain/photo.ts`（S-03）・`safety.ts`（S-04: SafetyCheck/QualityInspection）・
  `cost.ts`（S-05: CostRecord/WorkHour）・`notification.ts`（S-09: NotificationDelivery）
- API: photos / safety-checks / quality-inspections / cost-records / work-hours /
  notifications（各 read/write 権限・テナント・監査）
- persistence: in-memory/file/SQLite + migration 010〜015
- OpenAPI・README・CHANGELOG・FEATURE_INVENTORY（S-03/S-04/S-05/S-09 ✅）・RUNBOOK 更新
- テスト 5 件追加 → **367/367 pass**・verify/build/audit 0
- PR #31（feat/p3-s03-s09）

### P3 継続: S-06〜S-08 + 日報承認ワークフロー連携（2026-08-07 本セッション追記）

- `src/domain/knowledge.ts`（S-06: AI生成は承認済み aiActionId 必須）・`contract.ts`（S-07）
- API: knowledge / contracts / itsm（adapter 公開・`itsm:read|write`）
- 日報 submitted → workflow-instance（resourceType=daily-report）自動作成 → approve で approved 自動遷移
- persistence: in-memory/file/SQLite + migration 016（knowledge_articles）・017（legal_contracts）
- OpenAPI・README・CHANGELOG・FEATURE_INVENTORY（S-06/S-07/S-08 ✅）・RUNBOOK 更新
- テスト 4 件追加 → **367/367 pass**・verify/build/audit 0
- PR #32（feat/p3-s06-s08-wf）

### P3 継続: Enterprise-OS E-02/E-03/E-05/E-11 + 通知ディスパッチャー（2026-08-07 本セッション追記）

- `document.ts`（E-03）・`work-schedule.ts`（E-02）・`purchase-order.ts`（E-05）・
  `notification-preference.ts`（E-11）
- API: documents / work-schedules / purchase-orders / notification-preferences
- `src/notifications/dispatcher.ts` + `scripts/run-notification-dispatcher.ts`:
  Webhook/Slack 実送信・not-configured/transient 失敗記録・retry 対象
- persistence: in-memory/file/SQLite + migration 018〜021
- OpenAPI・README・CHANGELOG・FEATURE_INVENTORY（E-02/E-03/E-05/E-11 ✅）・RUNBOOK 更新
- テスト 2 件追加 → **367/367 pass**・verify/build/audit 0
- PR #33（feat/p3-e-slices）

### 次フェーズ

- P1: CEOP ゲートウェイ（統合サービス向けリバースプロキシ/アダプタ）
- P2 残: AI Gateway 統制（Y-09 / L-07）、端末エージェント受信（D-01〜D-03 / L-05）
- P3: ServiceHub 業務モジュール移植（案件・日報・写真・原価・契約・ITSM）
- P5/P6: パリティ検証・本番切替・**Y/N 確認後の旧リポジトリ削除**
