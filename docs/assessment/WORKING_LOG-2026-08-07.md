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

| 項目           | 値 / 状態                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| リポジトリ     | `Kensan196948G/Construction-Enterprise-Operating-Platform`                                              |
| ブランチ       | main + 作業ツリー（v0.8.0 実装中）。PR 用ブランチ `feat/production-hardening-r3` を作成予定             |
| 未コミット差分 | `.claude/START_PROMPT.md`（変更）・`.claude/skills/verify-app/SKILL.md`（追加）＝ユーザー変更として保護。それ以外は v0.8.0 実装差分 |
| 本番 URL       | https://ceop.mirai-dx-platform.com（API v0.6.2 / WebUI v0.7.1 を確認 2026-08-07）                       |
| 本番ホスト     | 192.168.0.185（docker run + cloudflared tunnel + systemd ceop-webui）                                   |
| gh auth        | Kensan196948G で認証済み（repo/workflow/gist/read:org）                                                 |
| CI             | main 最新 success（#16）・未解決 PR/Issue なし                                                          |

## 3. Plugins / Skills / MCP 対応表

| 目的                           | 利用可能なもの                            | 使用可否         | 使用結果・未使用理由                                                                                                                        |
| ------------------------------ | ----------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub（PR/Issue/CI/リリース） | gh CLI・GitHub MCP（app UI リソース）     | ✅ gh CLI を使用 | 認証・branch protection・CI・release を確認                                                                                                 |
| セキュリティ監査               | codex-security skills（security-scan 等） | ✅ 使用予定      | スキル手順に沿って phasing 実施（後述）                                                                                                     |
| 検証ループ                     | verify-app（ユーザー .claude/skills）     | ✅ 準用          | 実装後の verify/build/audit ゲートとして使用                                                                                                |
| 知識グラフ                     | memory://knowledge-graph（MCP リソース）  | ◯ 参照可         | 構造化検索ツールが本セッションに無いため、必要時のみ参照                                                                                    |
| Cloudflare                     | cloudflare 系 skills                      | 未使用           | 本セッションに Cloudflare MCP ツール/資格情報が露出していない。Tunnel は実機 systemd で稼働中。変更時は local cloudflared + docs 経由で実施 |
| Neon                           | neon-postgres 系 skills                   | 未使用           | MCP ツールなし。WebUI アクセスログは実機 env 経由で稼働中。変更時は docs + SQL 確認で実施                                                   |
| コード調査                     | codebase-memory-mcp（AGENTS.md 記載）     | ◯                | `search_graph` 等の MCP ツールは本セッションに未露出。grep/rg で代替                                                                        |
| デザイン                       | imagegen / design 系                      | 未使用           | 今回のスコープではビットマップ生成不要                                                                                                      |

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
