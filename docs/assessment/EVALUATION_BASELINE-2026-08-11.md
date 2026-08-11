# CEOP 改善前評価ベースライン（2026-08-11 実測）

評価対象: Construction-Enterprise-Operating-Platform（CEOP）v0.11.1
- GitHub: https://github.com/Kensan196948G/Construction-Enterprise-Operating-Platform
- 稼働中 URL: https://ceop.mirai-dx-platform.com（Cloudflare Tunnel → API 3120 / WebUI 3130）
- 本番コンテナ: `ceop-platform:v0.11.1`（docker run・healthy・35h 稼働・bind mount /home/kensan/.ceop/data:/data）
- 本番 DB: SQLite WAL（migration 001〜026 適用済み）※DB正本は Neon PostgreSQL の方針だが本番は SQLite 単一ノード
- Neon: `ceop-production`（aws-us-west-2）— WebUI アクセスログ `webui_access_log` 1,258 行（2026-08-07〜11、約 290 hits/日）

## 0. 実測証拠サマリ

| 項目 | 実測結果 | 判定 |
|---|---|---|
| `/health` `/health/ready`（公開） | 200・storage: sqlite・uptime 127,125s | ✅ |
| 公開面の保護 | `/metrics` `/dashboard` `/iso` `/portal` `/api/v1/info` 等は公開 URL から 403（Tunnel ingress 分割） | ✅ |
| 本番コンテナ セキュリティ | **ReadOnly:false / CapDrop:[] / NoNewPrivileges:[] / Memory:0 / LogConfig json-file ローテーションなし** | ❌ G-23 回帰 |
| CI | 直近 5 runs 全て success（schedule 含む） | ✅ |
| Git タグ / GitHub Release | **v0.10.0 止まり。v0.11.0/v0.11.1 のタグ・Release 未作成** | ❌ |
| CHANGELOG | [0.11.1] / [0.11.0] 記載あり | ✅ |
| バックアップ | 日次 02:15 スナップショット（ceop-20260807〜11）＋ retention（14日） | ✅ ただしオフサイトなし |
| 外形プローブ | health-probe.sh 5 分間隔・OK 継続・`CEOP_ALERT_WEBHOOK_URL` **未設定** | ⚠️ 通知先なし |
| 本番 DB 業務データ | **全業務テーブル 0 件**（projects/users/iso_records 等）。api_keys 2・audit_log 5 | ❌ 実データなし |
| Neon itsm スキーマ | hub_tickets 等 17 テーブル **全 0 件**（旧システム遺残） | ⚠️ 残置 |
| pnpm audit | 0 vulnerabilities | ✅ |
| verify（format/typecheck/lint/test/parity） | ローカル全 pass（407 件＋parity 27/27） | ✅ |
| カバレッジ | CI で `--experimental-test-coverage` 指定だが **lcov 出力なし**（今回修正） | ⚠️ |
| CI parity | **ci.yml に parity 未含**（release のみ verify 実行）（今回修正） | ⚠️ |
| E2E | `e2e/iso-app.spec.ts` 2 テストのみ | ⚠️ |
| 未テストルート | documents / work-schedules / purchase-orders / notification-preferences 等（今回修正） | ⚠️ |

## 1. 18 カテゴリ採点（改善前・100 点満点）

| # | カテゴリ | 点数 | 主な根拠（証拠） |
|---|---|---:|---|
| 1 | 業務適合性 | 70 | 案件/日報/写真/安全/原価/契約/発注/作業予定/ISO/連携 API 実装。経理・労務・入札・GIS 未実装、実業務データ 0 |
| 2 | 機能完成度 | 62 | API 170+ エンドポイント・migration 26。フロント UI・帳票・モバイル・協力会社ポータル不足 |
| 3 | UI/UX | 55 | `/dashboard` `/governance` `/iso-app` 実用。利用者ペルソナ導線・モバイル導線不足 |
| 4 | アクセシビリティ | 50 | dialog/aria-live 追加済み（v0.11.1）。フォーカストラップ・コントラスト実測なし・E2E 1 画面のみ |
| 5 | データ品質 | 68 | ドメイン検証・unique 制約・監査列あり。番号一意制約（DB レベル）不足・マスタ/クレンジングなし・実データ 0 |
| 6 | AI有効性 | 35 | AI ガバナンス（承認/監査/根拠/停止）実装。AI 推論・RAG・検索・予測・異常検知未実装（gateway 0・ai_actions 0） |
| 7 | 設計 | 82 | ゼロ依存・Result 型・ポート&アダプタ・テナント分離・改ざん検知監査・HMAC 署名 |
| 8 | コード品質 | 80 | strict TS・lint 0・TODO 0・テスト 407。ルートの定型ヘルパー約 21 ファイル重複（今回修正） |
| 9 | 性能・拡張性 | 70 | 軽量 node:http・SQLite WAL・1MiB・レート制限・100 並列スモーク pass。負荷試験・水平展開未検証・単一ノード |
| 10 | セキュリティ | 78 | JWT/API キー・RBAC・CSP・HSTS・監査チェーン・pnpm audit 0。**本番コンテナ ハーデニング回帰**・アラート通知先なし |
| 11 | 可用性・バックアップ | 75 | unless-stopped・HEALTHCHECK・日次バックアップ・復元実演済み（verify-restore）。オフサイトなし・単一ノード |
| 12 | 監視・障害対応 | 65 | Prometheus/Grafana・外形プローブ・メトリクス。アラート通知未接続・ログ集約なし・SLI 未計測 |
| 13 | テスト | 82 | 単体/統合/E2E/契約(parity)/復旧(verify-restore)自動化。P3 後半ルート未テスト（今回修正）・Fuzz/負荷本格なし |
| 14 | CI/CD・リリース | 76 | Actions 全ジョブ成功。**parity 未含**（今回修正）・**v0.11.x タグ/Release 未作成**・リリース手動 |
| 15 | 運用保守性 | 72 | RUNBOOK/運用台帳/systemd/バージョン一元。cron 手動・通知未接続・コンテナ管理 compose 外 |
| 16 | 文書 | 74 | README 充実・運用/統合文書あり。README 未記載機能 29 件（今回修正）・利用者向け手順不足 |
| 17 | 費用対効果 | 70 | ゼロ依存・単一コンテナ・Neon 無料帯で低コスト。実業務効果未測定（データ 0） |
| 18 | 競合代替性 | 52 | KANNA/Procore 等に対し現場 UX・モバイル・帳票・実績不足。ガバナンス/監査/ISO で優位 |
| | **平均** | **67.4** | 総合判定: **条件付き利用可**（ガバナンス・連携・ISO 基盤として可。全社業務システムとしては Phase 1 完了後） |

※採点はソース・テスト・CI・本番実測・公開情報の証拠に基づく。確認不能項目は「未確認」として点数に反映しない。

## 2. 強み（15 件）

1. ランタイム依存ゼロ（node:http + node:sqlite）で脆弱性・保守面が小さい
2. Result 型・strict TS による例外を投げない設計（typecheck 0 error）
3. SHA-256 ハッシュチェーン監査ログ（改ざん検知・verify 実装）
4. RBAC + テナント境界 + 非開示 404（IDOR 対策）
5. JWT（HS256・jti replay guard）+ API キー（HMAC + timingSafeEqual）+ 失効 API
6. ISO 9001/14001/45001/55001/19650 統合管理を 1 基盤で実装（migration 025・エイリアス 32 系統）
7. 連携先 6 システム Webhook（HMAC 署名）/イベントキュー/再送/冪等性/契約管理
8. テスト 407 件 + parity（FEATURE_INVENTORY 照合）+ verify-restore + Playwright E2E
9. 日次バックアップ（VACUUM INTO）+ 保持ポリシー + 復元実演（スクリプト・手順）
10. Prometheus/Grafana 監視スタック導入（loopback 限定・cap-drop）
11. バージョン一元管理（src/version.ts 整合テスト・Docker LABEL）
12. 本番デプロイ済み・公開 URL スモーク実測（/health 200・公開面 403 制御）
13. 移行台帳・git bundle アーカイブ・Issue/PR 記録（IMS 吸収 P6）
14. シークレット非コミット（.env 分離・provision CLI・HMAC 秘密は環境変数）
15. AI ガバナンス（promptHash のみ保存・evidenceRefs・PII 明示・誤回答対策・利用停止ステータス）
16. 運用文書（RUNBOOK/BACKUP/MONITORING/LEDGER）が実運用と一致（コンテナ ハーデニング除く）
17. 公開面の経路分割で管理画面・メトリクスを非公開（403 実測）

## 3. 弱み・リスク（15 件・影響度付き）

| # | 弱み | 影響度 | 根拠 |
|---|---|---:|---|
| 1 | **本番コンテナ ハーデニング回帰**（read-only / cap-drop ALL / no-new-privileges / リソース制限 / ログローテーション未適用。RUNBOOK §5 は「適用済み」と記載） | 重大 | `docker inspect` 実測（ReadOnly:false・CapDrop:[]・Memory:0・LogConfig json-file 空） |
| 2 | 本番 DB 実業務データ 0 件（audit_log 5・全業務テーブル 0） | 高 | SQLite 直接集計 |
| 3 | 経理・労務・入札・請求（要員/予算/完成）未実装 | 高 | FEATURE_INVENTORY バックログ |
| 4 | モバイル/PWA・オフライン未対応（manifest はあるが SW なし） | 高 | webui/static 実装 |
| 5 | 帳票（PDF/Excel 本格・電子納品）未実装（CSV 書き出しのみ） | 高 | エクスポート実装 |
| 6 | AI 推論・RAG・予測・異常検知が未実装（ガバナンスのみ） | 中 | gateway 0・ai_actions 0 |
| 7 | アラート通知先が未設定（障害が人に届かない） | 高 | `.env` に CEOP_ALERT_WEBHOOK_URL なし・MONITORING §2 |
| 8 | 単一ノード・単一 SQLite で水平展開・DR 未検証（本番 DB は SQLite であり Neon 方針と乖離） | 中 | アーキテクチャ・README |
| 9 | オフサイトバックアップ未設定（ホスト障害で同時消失） | 中 | BACKUP_RESTORE 明記 |
| 10 | 協力会社ポータル・外部 ID 管理なし | 高 | UI/機能一覧 |
| 11 | v0.11.0/v0.11.1 の Git タグ・GitHub Release 未作成（release.yml 未発火・GHCR 未更新） | 中 | gh release list / git tag |
| 12 | CI に parity 未含・カバレッジ lcov 出力なし（今回修正） | 中 | ci.yml 実測 |
| 13 | P3 後半ルート（documents/work-schedules/purchase-orders/notification-preferences 等）テスト不足（今回修正） | 中 | テスト一覧 |
| 14 | 番号（planNo/orderNumber 等）の一意制約が DB レベルでない | 中 | iso_records スキーマ |
| 15 | Neon `itsm` スキーマ 17 テーブルが空のまま残置 | 低 | Neon 集計 |
| 16 | ログ集約・トレース（OpenTelemetry）なし | 低 | 監視構成 |
| 17 | 性能・負荷・Fuzz テストなし（100 並列スモークのみ） | 低 | テスト一覧 |
| 18 | リリース・タグ運用が手動・ルール未文書化 | 低 | release.yml・RUNBOOK 未記載 |

## 4. 競合比較（公開情報ベース・要更新日確認）

| 製品 | 主要機能 | 導入方式 | 連携 | AI | セキュリティ | 費用 | CEOP との関係 |
|---|---|---|---|---|---|---|---|
| KANNA（Aldagram） | 現場共有・報告書・写真・協力会社 ID | SaaS | 写真/帳票 | 一部 | Access 等 | 要問合せ | 現場 UX・帳票で優位。CEOP は監査/ガバナンスで差別化 |
| Procore | 案件・原価・品質・財務の統合 PM | SaaS | API 豊富 | 開発中 | Enterprise | 高額 | 大規模向け。CEOP は軽量・低コスト |
| BUILD-U21（Unitec） | 受注・実行予算・発注・定時支払・完成 | オンプレ/SaaS | 基幹 | なし | 企業向け | 中〜高 | CEOP は原価の一部のみ。経理系は非代替 |
| OpenProject | PM・WBS・BIM 連携 | OSS/自社 | API | なし | 自社管理 | 低〜中 | CEOP はガバナンス/監査で上位、PM 機能は下位 |
| Oracle Aconex | 文書・コラボ・審査フロー | SaaS | 豊富 | なし | 規制対応 | 高額 | 公共発注者の CDE として併用候補 |

### 加重代替率（業務フロー35%・必須機能25%・UX15%・データ連携10%・セキュリティ/監査10%・運用保守5%）

| 要素 | 現在値 | 改善後予測 | 備考 |
|---|---:|---:|---|
| 業務フロー | 55% | 62% | 案件・日報・写真・安全・原価概算は可。経理/労務/発注は不可 |
| 必須機能 | 45% | 52% | 帳票・モバイル・協力会社・GIS が不足 |
| UX | 30% | 40% | コンソールはあるが利用者別導線・モバイル不足 |
| データ連携 | 60% | 68% | Webhook/イベント基盤あり。実トークン疎通待ち |
| セキュリティ/監査 | 80% | 85% | HMAC 追加・監査チェーン・RBAC。コンテナ ハーデニング回帰を修正 |
| 運用保守性 | 70% | 76% | 配送 timer・文書更新 |
| **加重代替率** | **52.5%** | **57.5%** | — |

- 80% 到達必須項目: 案件管理・日報・写真/証跡・安全/品質・原価概算・通知・RBAC・監査・バックアップ/復旧
- 90% 到達項目: 発注/受発注・経理/請求・労務/勤怠・モバイル/オフライン・GIS/地図・帳票（PDF/Excel）・AI 検索/予測
- 意図的に代替しない機能: ロボティクス/自律施工、船舶運航、大規模データレイク、CDE（Aconex 等）の専用機能
