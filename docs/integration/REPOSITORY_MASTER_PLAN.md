# レポジトリ統廃合・機能連携 マスタープラン

日付: 2026-08-11 / 更新: 2026-08-17（v0.14.0 統合元 4 リポジトリ機能移行） / 責任者: CTO（主任エージェント）

対象: Construction Enterprise 系リポジトリ群（中核 1・統合元 5・維持・機能連携 2）

## 1. 全体方針

- **中核**: Construction-Enterprise-Operating-Platform（CEOP）が
  全社業務・建設DX・現場管理・承認・経営管理・AI ガバナンス・DX 案件管理の単一基盤を所有する。
- **統合元（全機能を CEOP へ移行し、統合後に GitHub から削除）**:
  Civil-Construction-IMS は v0.11.0 で完全吸収・削除済み。
  **v0.14.0（2026-08-17）で Civil-Construction-Management-Platform /
  Civil-Construction-AI-Build-Platform / DX-Project-Portfolio-Atlas /
  Civil-Material-Photo-Logger の全機能を CEOP へ移行**（9 ドメイン・CRUD API・監査・
  WebUI `/mvp-app`・ダミーデータ・テスト）。削除済みの場合はスキップし、
  履歴・データは保全済みであることを確認する。
- **維持・機能連携**: Civil-4D-AI-Planner / Construction-DX-Idea は吸収・削除せず、
  各システムの専門性と独立性を維持する。CEOP は Webhook 受信・イベントキュー・認証・監査・
  再送・冪等性を一元的に提供する疎結合の調整レイヤーとなる。

## 2. リポジトリ一覧と現状（2026-08-17 確認）

| 区分 | リポジトリ | GitHub 状態 | CEOP 側実装 | 根拠文書 |
|---|---|---|---|---|
| 中核 | Construction-Enterprise-Operating-Platform | 稼働中（main） | — | 本リポジトリ |
| 統合元 | Civil-Construction-IMS | **削除済み（2026-08-09・Y 承認）** | v0.11.0 で完全吸収（ISO 9001/14001/45001/55001/19650・監査・是正・ISMS・BCP・BIM/CIM） | `IMS_MIGRATION_LEDGER.md` / `IMS_INTEGRATION_REPORT.md` |
| 統合元 | Civil-Construction-Management-Platform | **削除済み（2026-08-18）** | **v0.14.0 で移行**（作業指示/検査/供給者評価/品質目標/リスク/マネジメントレビュー） | `FEATURE_INVENTORY.md` §7-1 |
| 統合元 | Civil-Construction-AI-Build-Platform | **削除済み（2026-08-18）** | **v0.14.0 で移行**（AI 案件生成レジストリ） | `FEATURE_INVENTORY.md` §7-2 |
| 統合元 | DX-Project-Portfolio-Atlas | **削除済み（2026-08-18）** | **v0.14.0 で移行**（DX 案件ポートフォリオ台帳） | `FEATURE_INVENTORY.md` §7-3 |
| 統合元 | Civil-Material-Photo-Logger | **削除済み（2026-08-18）** | **v0.14.0 で移行**（材料写真ログ + CSV 出力） | `FEATURE_INVENTORY.md` §7-4 |
| 維持・連携 | Civil-4D-AI-Planner | 生存（main） | 連携基盤実装済み（webhook/event/contract） | `LINKED_INTEGRATION_SPEC.md` §1 |
| 維持・連携 | Construction-DX-Idea | 生存（main） | 連携基盤実装済み | `LINKED_INTEGRATION_SPEC.md` §2 |

参考: 旧 5 リポジトリ（ServiceHub-Construction-Platform / Construction-Enterprise-OS /
Construction-DX-OnePlatform / Construction-DX-OS / Synapse-OS）は 2026-08-07 に
Y 承認を得て削除済み。統合実績は `INTEGRATION_PLAN.md`・`FEATURE_INVENTORY.md` に記録。

## 3. 責務境界とデータ所有者

### CEOP が所有（一元管理）

- 認証・認可（JWT/API キー・RBAC・テナント境界）
- 監査ログ（改ざん検知ハッシュチェーン）・承認ワークフロー
- ISO 統合マネジメント記録・案件マスタ・AI ガバナンス（承認・権限・監査・利用停止）
- 統合イベント管理（受信検証・キュー・再送・契約バージョン）

### 連携先が所有（専門ドメイン）

| システム | 連携先が所有 | CEOP が所有 |
|---|---|---|
| Civil-4D-AI-Planner | 4D 工程モデル・AI 計画・シミュレーション | 案件・承認・監査・ISO 記録 |
| Construction-DX-Idea | アイデア受付・審査・評価 | 採択・案件化・予算・監査 |
| Civil-Construction-Management-Platform | 作業指示・検査・供給者・目標 | 承認フロー・監査・ISO 記録 |
| Civil-Construction-AI-Build-Platform | モデル構築・評価・デプロイ | モデル利用の AI ガバナンス・停止指示 |
| DX-Project-Portfolio-Atlas | 予算・効果・KPI・ポートフォリオ分析 | 案件承認・監査・統合イベント |
| Civil-Material-Photo-Logger | 写真撮影・証跡保存・バイナリ | メタデータ・検査記録・監査 |

同期方向は原則双方向（連携先 → CEOP の webhook 受信、CEOP → 連携先の outbound イベント）。
バイナリ（写真等）は各システムのオブジェクトストレージに保持し、CEOP は URL・ハッシュ・
メタデータのみ扱う。

## 4. CEOP 連携基盤（実装済み）

- 受信: `POST /api/v1/integrations/webhooks/:system`
  （HMAC-SHA256 共有シークレット・冪等性キー・契約イベント種別検証・監査）
- 送信: `POST /api/v1/integrations/events`（outbound 作成）
- 再送: `POST /api/v1/integrations/events/:id/retry`（タイムアウト・バックオフ・冪等性ヘッダ）
- 自動配送: `pnpm run integration:dispatch`（systemd timer / cron、5 分間隔）
- 契約: `GET /api/v1/integrations/contracts`（6 契約・version 管理）
- 環境変数: `CEOP_INTEGRATION_URL_<SYSTEM>` / `CEOP_INTEGRATION_TOKEN_<SYSTEM>` /
  `CEOP_INTEGRATION_SHARED_SECRET`
- テスト: `src/api/routes/integrations.test.ts` + `scripts/run-integration-dispatcher.test.ts`

## 5. 実装・検証実績

| リリース | PR | 内容 | 検証 |
|---|---|---|---|
| v0.11.0 | #40 | IMS 完全吸収 + 連携先 6 システム連携基盤 | verify 398・parity 27/27・build・E2E |
| v0.11.0 | #41 | 本番デプロイ・連携 URL 設定・IMS 削除記録 | 本番スモーク |
| v0.11.1 | #42/#43 | Webhook HMAC・ISO/連携メトリクス・a11y・配送 systemd | verify 407・本番適用 |
| v0.11.2 | #44 | ルート集約・P3 テスト追加・CI parity/lcov・文書同期 | verify 523 |
| v0.11.3 | 本 PR | 統廃合マスタープラン・CI カバレッジ閾値/Gitleaks・E2E viewer キー・ロガー配線 | verify 523・build・audit 0 |

2026-08-11 現在のゲート結果: `pnpm run verify` ✅（format / openapi / typecheck / lint /
test 523 / build / parity 27/27）、`pnpm audit --audit-level=high` ✅ 0。

## 6. 残課題（外部依存・運用）

| # | 課題 | 状態 | アクション |
|---|---|---|---|
| 1 | 連携先トークン設定・実疎通 | 未設定 | 各システムの Cloudflare Access / API 認証提供後に `CEOP_INTEGRATION_TOKEN_*` を設定し疎通確認 |
| 2 | site-management 受信 URL | 未稼働（`192.168.0.185:3003` → 000） | デプロイ後に再確認 |
| 3 | photo-logger 公開 URL | 未特定 | 受信エンドポイントの公開後、URL/トークンを設定 |
| 4 | ai-build 受信経路 | 405（ホスト到達・経路存在） | 受信実装と契約合わせ |
| 5 | IMS 実データのソースダンプ | 未発見 | 提供があれば `scripts/import-ims-records.ts` で本番適用 |
| 6 | 連携先の契約変更監視 | 定期確認 | eventTypes 追加は後方互換（既存フィールド不変）で受容し、README 契約と突合 |

## 7. 削除済みリポジトリの保全

- 旧 5 リポジトリ: ミラー `/var/backups/ceop-repo-absorption-20260807` +
  `integrations/` スナップショット（GitHub 削除済み 2026-08-07）
- Civil-Construction-IMS: ミラー `/var/backups/ceop-ims-absorption-20260809` +
  `integrations/Civil-Construction-IMS/` + `reports/ims-archive/`
  （bundle・issues 50・pulls 37・releases）

削除済みリポジトリは GitHub 上で参照不可のため、移行・監査・参照は上記保全先を正とする。
