# CEOP 総合評価（v0.6.0 Production Readiness）

日付: 2026-08-06
責任者: CTO（主任エージェント）
対象: `Kensan196948G/Construction-Enterprise-Operating-Platform`

## 1. 現状サマリ

| 項目 | 状態 |
|---|---|
| 実装本体 | `feat/platform-foundation`（M1〜M16）→ 本作業ブランチ `feat/production-hardening` で v0.6.0 化 |
| main | v0.6.1 統合済み（PR #2〜#5）・タグ v0.6.1・GHCR イメージ・GitHub Release 作成済み |
| テスト | 226/226 pass（ローカル + GitHub Actions 検証済み） |
| typecheck / lint / build | 全パス |
| 依存監査 | `pnpm audit --audit-level=high` → 0 vulnerabilities（override で解消） |
| CI | グリーン（main: typecheck/lint/test/build/security/Docker 全成功） |
| セキュリティ | 単一パスレビュー実施（`reports/security/report.md`）。P0/P1 の修正済み項目は本リリースに含む |
| ライセンス | なし → `LICENSE.md`（Proprietary / UNLICENSED）を追加、OpenAPI の MIT 表記を修正 |
| 本番 | https://ceop.mirai-dx-platform.com 稼働中（Docker + Cloudflare Tunnel、v0.6.1） |

## 2. 強み

- ランタイム依存ゼロの TypeScript（node:http / node:sqlite / node:test）で監査可能な構成
- 認証（HMAC API key + HS256 JWT）、レート制限、CSP、1 MiB ボディ制限、改ざん検知監査ログ、ABAC/RBAC ポリシーエンジンを標準装備
- マイグレーションランナー（冪等・トランザクション・FK 検査）と API キープロビジョニング CLI
- Docker multi-stage / non-root / HEALTHCHECK / 本番 Compose（named volume、ログローテーション、リソース制限）
- OpenAPI 3.1 生成スクリプトと CI（typecheck / lint / test / build / security audit / Docker）

## 3. 弱み・ギャップ（優先度順）

| ID | 優先度 | 内容 | 状態 |
|---|---|---|---|
| G-01 | P1 | CRUD・認証イベントが監査ログ未記録（監査基盤として致命的） | ✅ v0.6.0 で全 mutation を監査記録化 |
| G-02 | P1 | 本番マイグレーションに FK 制約・workflows/revoked_jtis が未収録（スキーマ漂流） | ✅ migration 004 + テスト |
| G-03 | P1 | `pnpm audit` が high 7 件（devDependencies） | ✅ override + lockfile 更新で 0 件 |
| G-04 | P1 | main が空・PR #1 未統合（本番リリース不可） | ✅ PR #2 で統合、main CI（Docker 含む）グリーン |
| G-04b | P1 | 組織スコープ未強制（テナント横断アクセス） | ✅ テナント分離を実装（entity + dashboard フィルタ、404 非公開化） |
| G-04c | P1 | `user:write`/`role:write` による権限昇格 | ✅ anti-escalation チェックを実装 |
| G-05 | P2 | バージョン表記の分散（package.json 0.1.0 / info 0.5.0 / UI 0.1.0） | ✅ 一元化 + 回帰テスト |
| G-06 | P2 | JWT 失効 API なし | ✅ `/api/v1/auth/revoke` 実装 |
| G-07 | P2 | JWT が `iat >= exp` を受容 | ✅ 拒否に変更 |
| G-08 | P2 | API JSON 応答にセキュリティヘッダなし | ✅ 全応答に付与 |
| G-09 | P2 | グローバルレート制限なし（auth のみ） | ✅ `/api/v1/*` に per-IP 制限 |
| G-10 | P2 | readiness プローブなし（health は liveness のみ） | ✅ `/health/ready` |
| G-11 | P2 | 監査ログ取得に offset なし | ✅ `offset` 追加 |
| G-12 | P2 | バックアップ/復元・監視・運用台帳・Runbook 未整備 | ✅ docs/operations + backup script |
| G-13 | P2 | ブランチ保護・Actions 権限絞り込み・CI 必須チェック未設定 | ✅ main ブランチ保護（必須チェック 3 件・force push/delete 禁止）+ Actions 権限 selected |
| G-14 | P3 | CSP が `unsafe-inline`（SSR テンプレートのインライン JS） | バックログ（nonce/hash 化） |
| G-15 | P3 | リクエスト ID・相関 ID なし | バックログ |
| G-16 | P3 | `node:sqlite` は実験的 API（Node 22） | 運用方針として許容・文書化 |
| G-17 | P3 | 本番 TLS 終端の設定例（nginx）がプラットフォーム側にない | バックログ（プロキシ側で実施） |

## 4. リリース可否判断の根拠

- コード品質: typecheck / lint / build / 221 tests / audit 0 / OpenAPI 生成一致
- セキュリティ: 認証・認可・監査・レート制限・ヘッダ・FK・依存監査を確認
- 運用: バックアップ・復元手順・監視・Runbook・運用台帳を整備
- 判定: **GO（v0.6.1 を本番デプロイ済み）**。残作業は初期安定化監視と四半期運用試験

## 5. バックログ（実装対象外）

- P3: CSP nonce/hash 化、リクエスト ID、nginx TLS サンプル、SSO（OIDC/SAML）、通知/承認ワークフローの実業務連携、AI ガバナンスの LLM ゲートウェイ接続
- P2（次期）: 監査ログのエクスポート（CSV/PDF）、API キー失効 UI、ポリシー変更の承認フロー

## 6. 決定記録

- 本番向け永続化は SQLite（単一ノード）を正とする。マルチノードは将来 PostgreSQL アダプタをバックログ化
- バージョンは v0.6.0 に統一（M1〜M16 の成果を含む最初の main リリース）
- OpenAPI ライセンスは MIT → Proprietary に修正（private リポジトリの実態に整合）
