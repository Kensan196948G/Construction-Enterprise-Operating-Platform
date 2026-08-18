# 機能インベントリと統合対応表

日付: 2026-08-07
凡例: ✅ 統合済み / 🔄 統合サービスとして接続予定 / 📦 CEOP コアへ移植予定 /
⬜ 未着手・対象外検討中

> 2026-08-07: 旧5リポジトリは Y 承認により削除済み（ミラー: `/var/backups/ceop-repo-absorption-20260807`・参照ソース: `integrations/`）。

## 1. ServiceHub-Construction-Platform

| #    | 機能                 | 内容                                 | CEOP 対応                                           | 状態 |
| ---- | -------------------- | ------------------------------------ | --------------------------------------------------- | ---- |
| S-01 | 工事案件管理         | 案件一覧・進捗・工期・予算・関連書類 | 📦 project ドメイン + CRUD API                      | ✅   |
| S-02 | 日報・報告管理       | 日報送信・上長通知・承認             | 📦 daily-report ドメイン + workflow                 | ✅   |
| S-03 | 写真・資料管理       | アップロード・検索・整理             | 📦 photo/document ドメイン + オブジェクトストレージ | ✅   |
| S-04 | 安全・品質管理       | 巡視・KY・指摘・是正                 | 📦 safety ドメイン                                  | ✅   |
| S-05 | 原価・工数管理       | 予算 vs 実績・アラート               | 📦 cost ドメイン                                    | ✅   |
| S-06 | AI ナレッジ管理      | チャット・OCR・画像判定・予測        | 🔄 AI Gateway（Synapse）経由                        | ✅   |
| S-07 | 法的コンプライアンス | 契約リスク解析・コンプライアンス管理 | 📦 legalops ドメイン + LegalOps アダプタ            | ✅   |
| S-08 | ITSM                 | インシデント・変更管理               | 🔄 ITSM アダプタ（既存 port あり）                  | ✅   |
| S-09 | 通知                 | メール/Webhook 通知                  | 📦 notification サービス                            | ✅   |
| S-10 | 認証・権限           | JWT・RBAC                            | ✅ CEOP 認証/認可で代替                             | ✅   |

## 2. Construction-Enterprise-OS

| #    | 機能                 | 内容                                       | CEOP 対応                             | 状態 |
| ---- | -------------------- | ------------------------------------------ | ------------------------------------- | ---- |
| E-01 | ダッシュボード       | 進捗・原価・安全・承認・リスク一覧         | ✅ CEOP dashboard（拡張予定）         | ✅   |
| E-02 | 現場管理             | 日報・出来高・写真・作業予定・KY・安全巡視 | 📦 現場モジュール（S-02/S-04 と統合） | ✅   |
| E-03 | 図面・文書           | PDF/CAD/BIM・版管理・電子納品              | 📦 document ドメイン                  | ✅   |
| E-04 | 承認・ワークフロー   | 変更申請・電子署名・決裁滞留               | ✅ workflow-instance API（L-02 実装） | ✅   |
| E-05 | 原価・ERP            | 予算・契約・発注・請求・労務・在庫         | 📦 cost/erp モジュール（S-05 と統合） | ✅   |
| E-06 | GIS・地図            | OpenStreetMap・工事位置・災害リスク        | 🔄 GIS アダプタ                       | ⬜   |
| E-07 | IoT                  | センサー・気象・機械稼働・アラート         | 🔄 IoT アダプタ（port 追加）          | ⬜   |
| E-08 | AI                   | チャット・OCR・予測・ナレッジ検索          | 🔄 AI Gateway（Synapse）              | ⬜   |
| E-09 | セキュリティ         | 監査ログ・SOC・VPN・端末防御               | ✅ CEOP 監査・セキュリティ基盤        | ✅   |
| E-10 | ロボティクス         | ドローン・自律施工・デジタルツイン         | ⬜ 対象外（外部連携）                 | ⬜   |
| E-11 | 通知サービス         | テンプレート・Webhook・未読カウント        | 📦 notification モジュール            | ✅   |
| E-12 | 設計レビュー/検査 AI | 設計レビュー・AI 検査記録                  | 🔄 AI Gateway + 検査モジュール        | ⬜   |

## 3. Construction-DX-OnePlatform

| #    | 機能             | 内容                                                    | CEOP 対応                                          | 状態 |
| ---- | ---------------- | ------------------------------------------------------- | -------------------------------------------------- | ---- |
| O-01 | 共通基盤         | portal・shared-auth・api-gateway・shared-db・shared-pdf | ✅ CEOP Gateway/認証で代替（portal は CEOP WebUI） | 🔄   |
| O-02 | 施工本部         | 工程・日報・写真・出来高                                | 📦 現場モジュール（S-02/E-02 と統合）              | ✅   |
| O-03 | 安全品質環境本部 | ヒヤリハット・リスク・ISO                               | 📦 safety モジュール（S-04 と統合）                | ✅   |
| O-04 | 営業本部         | 入札・顧客・受注見込み                                  | 📦 sales モジュール（次期バックログ）              | ⬜   |
| O-05 | 技術本部         | BIM/CIM・技術ナレッジ                                   | 📦 knowledge（Synapse）と統合                      | ✅   |
| O-06 | 購買部           | 資材・発注・協力会社                                    | 📦 procurement モジュール（次期バックログ）        | ⬜   |
| O-07 | 船舶             | 船団・運航・燃料・保守                                  | ⬜ 特殊業務（設計後）                              | ⬜   |
| O-08 | 管理本部         | 人事・経理・承認                                        | 📦 workflow + hr/finance モジュール（次期バックログ） | ⬜ |
| O-09 | 経営企画         | KPI・AI 予測・ESG                                       | 📦 dashboard 拡張 + AI Gateway（次期バックログ）   | ⬜   |
| O-10 | 統合データ基盤   | データレイク・デジタルツイン                            | ⬜ 別基盤（adapter 検討）                          | ⬜   |
| O-11 | IT-DX 部門       | システム稼働・セキュリティ                              | ✅ CEOP 運用/監視基盤                              | 🔄   |
| O-12 | 監査             | 操作証跡・出力・検索                                    | ✅ CEOP 監査ログ + エクスポート                    | ✅   |

## 4. Construction-DX-OS

| #    | 機能                  | 内容                           | CEOP 対応                                | 状態 |
| ---- | --------------------- | ------------------------------ | ---------------------------------------- | ---- |
| D-01 | 端末登録              | 登録トークン・署名付き本人確認 | 📦 device ドメイン拡張（telemetry 受信） | ✅   |
| D-02 | ハートビート          | 稼働状況の定期報告             | 📦 device heartbeat API                  | ✅   |
| D-03 | インベントリ          | 端末構成情報の収集             | 📦 device inventory API                  | ✅   |
| D-04 | シリアルスキャン      | シリアル番号スキャン・照合     | 📦 device モジュール（次期バックログ）   | ⬜   |
| D-05 | ISO ビルド/配布       | イメージ作成・ダウンロード     | 🔄 統合サービス（外部ビルド基盤）        | ⬜   |
| D-06 | PXE/リング更新        | 段階更新・PXE rollback         | 🔄 統合サービス                          | ⬜   |
| D-07 | 管理 UI               | 端末一覧・状態・お知らせ       | 📦 CEOP WebUI に移植（次期バックログ）   | ⬜   |
| D-08 | 監視                  | Prometheus メトリクス          | 🔄 CEOP 監視と統合（/metrics + 監視スタック） | ✅ |
| D-09 | オフライン spool/sync | 電波断時の一時保存・再送       | 📦 cdx-agent 連携（SDK 移植・次期バックログ） | ⬜ |

## 5. Synapse-OS

| #    | 機能            | 内容                             | CEOP 対応                                                                   | 状態 |
| ---- | --------------- | -------------------------------- | --------------------------------------------------------------------------- | ---- |
| Y-01 | Tenant/Identity | テナント・ID・認証               | ✅ CEOP organization/API key/JWT で代替                                     | ✅   |
| Y-02 | Issue 管理      | Issue オブジェクト CRUD          | 🔄 workflow-instance の subject/comment で代替（専用 issue ドメインは次期） | 🔄   |
| Y-03 | Document        | 文書オブジェクト CRUD            | 📦 document ドメイン（E-03 実装）                                            | ✅   |
| Y-04 | Approval        | 申請→承認→監査フロー             | ✅ workflow-instance API（L-02 実装）                                       | ✅   |
| Y-05 | Audit           | 監査イベント・検索・エクスポート | ✅ CEOP 監査チェーン + export で代替                                        | ✅   |
| Y-06 | Dashboard       | KPI・サービス健全性              | ✅ CEOP dashboard で代替                                                    | ✅   |
| Y-07 | Knowledge       | ナレッジ項目 CRUD・検索          | 📦 knowledge ドメイン（S-06 実装）                                           | ✅   |
| Y-08 | Federation      | 複数組織/会社間のイベント連携    | ⬜ federation ドメイン（設計後）                                            | ⬜   |
| Y-09 | AI Gateway      | AI アクションの統制・承認・監査  | 📦 ai-action ドメイン（P2 で移植）                                          | ✅   |
| Y-10 | フロントエンド  | Next.js 7 画面                   | 🔄 CEOP WebUI へ移植                                                        | ⬜   |

## 6. 対応方針まとめ

- **既に CEOP が代替できる機能**: 認証/認可/監査/ダッシュボード/ITSM アダプタ等 → 統合済み
- **優先移植（P2）**: Issue→Approval→Audit、AI Gateway 統制、端末エージェント受信
- **統合サービス接続（P1/P3）**: 業務サービスは CEOP Gateway 配下で稼働
- **対象外/設計後**: ロボティクス・船舶・データレイク・Federation は外部連携または別設計

## 7. 統合元 4 リポジトリ（2026-08-17 機能移行・統合後リポジトリ削除）

> v0.14.0 で Civil-Construction-Management-Platform / Civil-Construction-AI-Build-Platform /
> DX-Project-Portfolio-Atlas / Civil-Material-Photo-Logger の全機能を CEOP へ移行。
> 全データはダミー（`rich-demo.ts`）で、CRUD API + 監査 + WebUI（`/mvp-app`）+ テストを備える。
> 統合元リポジトリは移行完了後に GitHub から削除（既削除はスキップ）。

### 7-1. Civil-Construction-Management-Platform（現場管理・ISO 運用）

| #    | 機能                 | 内容                                             | CEOP 対応                                  | 状態 |
| ---- | -------------------- | ------------------------------------------------ | ------------------------------------------ | ---- |
| C-01 | 作業指示             | WorkItem（title/status/dueDate/担当）CRUD        | 📦 work-order ドメイン + API + 監査         | ✅   |
| C-02 | 検査・チェックリスト | Inspection + ChecklistItem（合否導出）CRUD       | 📦 inspection ドメイン + API + 監査         | ✅   |
| C-03 | 供給者評価           | SupplierEvaluation（スコア/状態/ISO 条項）CRUD   | 📦 supplier ドメイン + API + 監査           | ✅   |
| C-04 | 品質目標             | QualityObjective（基準値/目標値/状態）CRUD       | 📦 quality-objective ドメイン + API + 監査  | ✅   |
| C-05 | リスク管理           | Risk（5×5 マトリクス/処置/状態遷移）CRUD         | 📦 risk ドメイン + API + 監査               | ✅   |
| C-06 | マネジメントレビュー | ManagementReview（開催/次回/議題/結論）CRUD      | 📦 management-review ドメイン + API + 監査  | ✅   |

### 7-2. Civil-Construction-AI-Build-Platform（AI 案件生成）

| #    | 機能             | 内容                                               | CEOP 対応                                   | 状態 |
| ---- | ---------------- | -------------------------------------------------- | ------------------------------------------- | ---- |
| B-01 | 案件生成レジストリ | 生成案件（name/theme/purpose/scope）登録           | 📦 ai-build-project ドメイン + API + 監査    | ✅   |
| B-02 | 生成ライフサイクル | generated/archived/restored/deleted・placeholder 検査 | 📦 ai-build-project 状態遷移（API PUT）     | ✅   |

### 7-3. DX-Project-Portfolio-Atlas（DX 案件ポートフォリオ）

| #    | 機能         | 内容                                                   | CEOP 対応                              | 状態 |
| ---- | ------------ | ------------------------------------------------------ | -------------------------------------- | ---- |
| P-01 | ポートフォリオ台帳 | DX 案件（slug/名称/種別/ライフサイクル/重要度）CRUD | 📦 dx-project ドメイン + API + 監査     | ✅   |
| P-02 | 進捗・レビュー管理 | approvedProgress / milestone / 次回レビュー日       | 📦 dx-project フィールド（API PUT）     | ✅   |

### 7-4. Civil-Material-Photo-Logger（材料写真ログ）

| #    | 機能         | 内容                                                   | CEOP 対応                                  | 状態 |
| ---- | ------------ | ------------------------------------------------------ | ------------------------------------------ | ---- |
| M-01 | 写真ログ登録 | 案件番号/材料名/数量/置場/座標のメタデータ CRUD        | 📦 material-photo-log ドメイン + API + 監査 | ✅   |
| M-02 | CSV エクスポート | 固定カラム順の CSV 出力（Excel 台帳取込用）          | 📦 /api/v1/material-photo-logs/export.csv | ✅   |
