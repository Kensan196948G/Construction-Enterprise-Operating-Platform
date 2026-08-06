# Legacy プロジェクト調査・ギャップ分析

日付: 2026-08-06
方法: `legacy-projects/` の README / state / docs / 主要コードを主任エージェントが精査
（並列エージェントのセキュリティスキャン成果物は `reports/security/scan-20260806/` に統合済み）

## 1. Synapse-OS（統制・Federation・AI Governance・監査ゲート）

| 観点 | 評価 |
|---|---|
| 実装状況 | 396 tests pass / static analysis clean / CI 6 jobs green / 11 Docker サービス / 全 6 Governance Gates（G1–G6）完了 / 監査 Export CSV・JSON 実装 / JWT auth + Next.js 15 フロント 7 画面 / Federation デモ / AI 直接アクセス CI ゲート |
| プラットフォームへの移植済み | ポリシーエンジン（deny-overrides）、監査ログ（ハッシュチェーン）、JWT、RBAC/ABAC、ダッシュボード、CORS 環境変数化 |
| 未移植（バックログ候補） | Issue→Approval→Audit の業務オブジェクトと承認フロー、監査ログ CSV/JSON エクスポート、AI Action/Document/Federation オブジェクト、Knowledge Graph/DLP、クロス組織トラストモデル、Postgres/Alembic 対応、Non-Goals Guard、ポリシーテストマトリクス |

## 2. Construction-Enterprise-OS（業務ポータル・統合画面）

| 観点 | 評価 |
|---|---|
| 実装状況 | WebUI モック（ダミーデータ）、22 サービスのスケルトン、Docker/systemd 起動。実データ連携・権限設計・監査要件は未確認（README 明記） |
| プラットフォームへの示唆 | 利用者別ビュー（現場・支店・本社・経営・監査）、業務領域カタログ（日報/写真/図面/承認/原価/GIS/IoT/AI/セキュリティ/ロボティクス）がアダプタ・UI 要件の出発点になる |
| 未移植 | 文書・図面・原価・GIS・IoT・AI アダプタの実接続、モバイルアプリ、承認・稟議 UI |

## 3. Construction-DX-OS（現場端末・クライアント基盤・運用）

| 観点 | 評価 |
|---|---|
| 実装状況 | cdx-agent（署名付きデバイス本人確認・ハートビート・インベントリ・オフライン spool/sync）、Construction Hub ランチャー、ISO ビルド/配布（PXE 含む）、段階更新/リング rollback、systemd パッケージ、Grafana/Prometheus 監視、復元試験・Runbook 完備 |
| プラットフォームへの移植済み | デバイスドメイン（CRUD・状態）、アプリケーション健康状態 |
| 未移植 | デバイスエージェントプロトコル/オフライン同期、デバイス署名・プロビジョニング、更新リング、テレメトリースキーマ、中央管理 UI、監視アラート連携 |

## 4. プラットフォームへのギャップ/バックログ（優先度順）

| ID | 優先度 | 項目 | 根拠 | 受入条件 |
|---|---|---|---|---|
| L-01 | P2 | 監査ログ CSV/JSON エクスポート API | Synapse-OS Sprint 9（G6 監査 Export） | `GET /api/v1/governance/audit/export?format=csv\|json` で全件/範囲エクスポート + 権限 `audit:export` |
| L-02 | P2 | 承認ワークフローインスタンス（申請→承認→監査） | Synapse Issue/Approval + Enterprise-OS 承認 UI | Workflow テンプレートからインスタンス生成、承認/却下、監査記録 |
| L-03 | P2 | PostgreSQL アダプタ（マルチノード運用） | Synapse-OS G3 DB Migration / Postgres | `Repositories` ポートの Postgres 実装 + migration 互換 |
| L-04 | P3 | 監査ログの知識グラフ/DLP 連携 | Synapse Knowledge/DLP モデル | 任意（設計後） |
| L-05 | P3 | デバイスエージェント/オフライン同期アダプタ | Construction-DX-OS cdx-agent | デバイステレメトリ受信 API + 署名検証 |
| L-06 | P3 | 外部アダプタ実接続（CMDB/ITSM/IMS/LegalOps/BCP/Document） | プラットフォームの port のみ | 1 アダプタ以上の実装と契約テスト |
| L-07 | P3 | AI ゲートウェイ統制（モデル利用の承認・監査） | Synapse AI Governance | AI 利用リクエストのポリシー評価 + 監査 |
| L-08 | P3 | モバイル/PWA | Enterprise-OS apps/mobile | 既存 SSR の PWA 化 |
| L-09 | P3 | クロス組織 Federation/トラスト | Synapse Federation | 外部組織連携の信頼モデル設計 |

## 5. 競合代替率（想定）

想定される類似製品カテゴリ:

- 現場管理アプリ（例: ANDPAD、現場プロ）— 日報・写真・工程
- 建設業向け基幹/原価管理（例: 建設業向け ERP、奉行シリーズ等）— 予算・発注・請求
- ワークフロー/ポータル（例: kintone、Microsoft 365/Teams）— 承認・通知
- 統制/監査（例: ServiceNow GRC、AuditBoard）— 監査ログ・リスク管理

現状の CEOP は「共通ドメイン・統制ゲート・監査証跡・API」の coordination layer であり、
各カテゴリの代替ではなく連携基盤。代替可能率の目安:

- 現在: 10〜20%（認証・RBAC/ABAC・監査・ダッシュボード・CRUD の基盤部分）
- 80% 到達条件: L-01〜L-03 + 実アダプタ 2 件 + 帳票/エクスポート + 通知/承認フロー + 運用監視の本番接続
- 対象外: 原価計算・CAD/BIM・GIS・IoT 解析・AI 推論そのもの（外部システム/アダプタの責務）

※ 競合詳細の数値比較は各ベンダー資料の確認が必要なため、ここではカテゴリと代替率の判断基準のみを示す。
