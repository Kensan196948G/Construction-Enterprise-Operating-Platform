# Civil-Construction-IMS → CEOP 移行台帳

日付: 2026-08-09
判定者: CTO（主任エージェント）
方針: 単なるファイルコピーではなく、CEOP の認証・認可・監査・テナント境界・永続化・UI・テストへ再構成して統合する。

凡例: 🟢 そのまま移植 / 🔧 中核設計へ再構成して統合 / 🔁 重複機能を統合・置換 / 🔄 互換性を維持して移行 / 🗑 廃止候補 / 🔗 連携先へ接続

## A. 共通基盤

| ID | 機能 | 分類 | CEOP 対応 | 状態 |
|---|---|---|---|---|
| I-C01 | 組織・部門 | 🔁 | CEOP organization ドメインで代替（users/organizations 既存） | ✅ |
| I-C02 | ユーザー・役割（11 役割 RBAC） | 🔁 | CEOP user/role + `hasPermission` で代替 | ✅ |
| I-C03 | JWT + リフレッシュトークンローテーション | 🔁 | CEOP JWT 発行・失効（revoked_jtis）で代替 | ✅ |
| I-C04 | Entra ID OIDC 連携 | 🗑 | 外部 IdP は CEOP 認証ゲートの外で設定（env で接続）。本実装は CEOP JWT/API キーを正とする | ✅ |
| I-C05 | 監査証跡（who/when/before/after） | 🔁 | CEOP 改ざん検知ハッシュチェーン監査ログで代替（`recordAudit`） | ✅ |
| I-C06 | 論理削除・versionNo | 🔧 | CEOP は物理削除 + versionNo 方式。ISO レコードは `versionNo` 継承 | ✅ |
| I-C07 | 通知（未読・既読・削除） | 🔁 | CEOP notifications API（unread-count 含む）で代替 | ✅ |
| I-C08 | ワークフロー要求・承認アクション | 🔁 | CEOP workflow-instance API（submit/approve/reject/audit）で代替 | ✅ |
| I-C09 | 文書カテゴリ・版管理・承認公開フロー | 🔧 | CEOP documents API + ISO アクション（submit-review/approve/publish/withdraw）で代替 | ✅ |

## B. ISO 9001 / 14001 / 45001 / 55001 / 19650

| ID | 機能 | 分類 | CEOP 対応 | 状態 |
|---|---|---|---|---|
| I-Q01 | 品質計画（承認フロー） | 🔧 | ISO record kind `quality-plan`（/api/v1/quality/plans） | ✅ |
| I-Q02 | 品質検査・出来形記録 | 🔧 | kind `quality-inspection`（既存 quality-inspections と統合・置換予定は B 参照） | ✅ |
| I-Q03 | 不適合管理 | 🔧 | kind `nonconformity` | ✅ |
| I-E01 | 環境側面評価 | 🔧 | kind `environmental-aspect` | ✅ |
| I-E02 | 法的要求・順守評価 | 🔧 | kind `legal-requirement` | ✅ |
| I-E03 | 廃棄物記録 | 🔧 | kind `waste-record` | ✅ |
| I-S01 | 危険源・リスクアセスメント | 🔧 | kind `hazard` | ✅ |
| I-S02 | ヒヤリハット | 🔧 | kind `near-miss` | ✅ |
| I-S03 | 安全教育・参加者管理 | 🔧 | kind `safety-education`（参加者は parentId + participants payload） | ✅ |
| I-S04 | KY 活動・Toolbox Talk | 🔧 | kind `toolbox-talk` | ✅ |
| I-S05 | 安全パトロール・指摘是正 | 🔧 | kind `safety-inspection`（既存 safety-checks と統合・置換予定） | ✅ |
| I-S06 | 事故・インシデント報告 | 🔧 | kind `safety-incident` | ✅ |
| I-A01 | 資産台帳（ISO 55001） | 🔧 | kind `asset` | ✅ |
| I-A02 | 保全計画 | 🔧 | kind `asset-maintenance-plan`（parentId=asset） | ✅ |
| I-A03 | 資産点検 | 🔧 | kind `asset-inspection` | ✅ |
| I-A04 | 資産リスク評価 | 🔧 | kind `asset-risk-assessment` | ✅ |
| I-A05 | 廃棄・除却（承認必須） | 🔧 | kind `asset-disposal`（approve アクション必須） | ✅ |
| I-A06 | 資産引渡し | 🔧 | kind `asset-handover` | ✅ |
| I-B01 | EIR（情報要件） | 🔧 | kind `bim-eir` | ✅ |
| I-B02 | BEP（BIM 実行計画） | 🔧 | kind `bim-bep` | ✅ |
| I-B03 | 情報コンテナ・CDE 状態 | 🔧 | kind `bim-container`（cde-status は action） | ✅ |
| I-B04 | 調整課題（干渉チェック） | 🔧 | kind `bim-coordination-issue` | ✅ |

## C. 監査・是正・ISMS・BCP・分析

| ID | 機能 | 分類 | CEOP 対応 | 状態 |
|---|---|---|---|---|
| I-AU01 | 監査計画・監査指摘 | 🔧 | kind `audit-plan` / `audit-finding` | ✅ |
| I-AU02 | 是正処置（CA 番号・根本原因・予防） | 🔧 | kind `corrective-action` | ✅ |
| I-I01 | ISMS 情報資産 | 🔧 | kind `isms-asset` | ✅ |
| I-I02 | ISMS 脅威・リスク評価 | 🔧 | kind `isms-threat` / `isms-risk-assessment` | ✅ |
| I-I03 | ISMS インシデント | 🔧 | kind `isms-incident` | ✅ |
| I-BC01 | BCP 計画・承認 | 🔧 | kind `bcp-plan` | ✅ |
| I-BC02 | BCP リスクシナリオ | 🔧 | kind `bcp-risk-scenario` | ✅ |
| I-BC03 | BCP 訓練記録 | 🔧 | kind `bcp-drill` | ✅ |
| I-AN01 | ISO コンプライアンス分析 | 🔧 | GET /api/v1/iso/analytics + /api/v1/analytics/iso-compliance | ✅ |
| I-AN02 | 安全 KPI | 🔧 | GET /api/v1/analytics/safety-kpi | ✅ |

## D. 廃止候補・移行判断

| ID | 候補 | 根拠 | 影響 | 代替 |
|---|---|---|---|---|
| I-D01 | IMS 単独の Next.js フロントエンド | CEOP は SSR/ポータルへ一本化。設計バンドルは編集対象外 | 画面遷移は `/iso`・`/portal` 経由 | CEOP Portal + ISO ランディング |
| I-D02 | IMS 単独の Prisma/PostgreSQL スキーマ | 重複した RBAC・監査・永続化を CEOP に統一 | 旧 API クライアントは互換エイリアスで継続 | CEOP SQLite/ファイル永続化 + iso_records |
| I-D03 | IMS の RefreshToken 実装 | CEOP JWT 失効管理で代替 | なし（新規利用なし） | revoked_jtis + JWT |
| I-D04 | IMS の Docker Compose スタック | CEOP が本番スタックを所有 | なし | docker-compose.prod.yml |
| I-D05 | 既存 CEOP quality-inspections / safety-checks 簡易モデル | ISO モジュールと重複。後方互換のため当面維持 | 二重管理リスク | 次リリースで ISO レコードへ統合・置換 |

## E. 連携先へ接続する機能

| 機能 | 連携先 | CEOP 側実装 |
|---|---|---|
| 4D 工程・AI 計画 | Civil-4D-AI-Planner | `/api/v1/integrations/webhooks/4d-planner` + outbound event |
| DX アイデア受付・審査・採択 | Construction-DX-Idea | `/api/v1/integrations/webhooks/dx-idea` |
| 現場施工管理・承認フロー | Civil-Construction-Management-Platform | `/api/v1/integrations/webhooks/site-management` |
| AI システム構築・モデル・リスク審査 | Civil-Construction-AI-Build-Platform | `/api/v1/integrations/webhooks/ai-build` |
| DX 案件・予算・効果・KPI | DX-Project-Portfolio-Atlas | `/api/v1/integrations/webhooks/portfolio-atlas` |
| 資材写真・証跡・検査・出来形 | Civil-Material-Photo-Logger | `/api/v1/integrations/webhooks/photo-logger` |

## F. 検証結果

- CEOP 型検査: `pnpm typecheck` ✅
- 新規テスト 13 件（ISO domain/API/SQLite・連携 API）✅
- 既存 382 テスト + 新規 = 395 件（統合後の verify で確定）
- 移行アーカイブ: `reports/ims-archive/civil-construction-ims.bundle`・issues.json(50)・pulls.json(37)
