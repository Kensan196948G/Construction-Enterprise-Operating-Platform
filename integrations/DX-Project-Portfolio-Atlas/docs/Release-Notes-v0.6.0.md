# Release Notes v0.6.0（本番運用性・RBAC運用・セキュリティ強化）

公開日: 2026-08-12

## 変更内容

### ユーザー・ロール管理（administrator 専用・監査ログ付き）

- `GET /api/v1/users`（一覧・検索・ページング）、`PATCH /api/v1/users/{id}`
  （ロール・有効/無効・表示名）、`POST /api/v1/users/{id}/password`（管理者リセット）を追加。
- WebUI に「ユーザー管理」画面（`/users`）を追加。ロール切替・無効化・パスワードリセットを
  画面から実行可能。自分自身の administrator 剥奪・無効化はロックアウト防止のため拒否。

### セッション失効（token_version）

- migration 0007 で `app_users.token_version` を追加。ローカルセッション JWT に `ver` を埋め込み、
  パスワード変更・管理者リセット・ロール変更・無効化時に旧セッションを即時失効させる。
- 全ユーザー向けのセルフパスワード変更（`POST /auth/me/password`＋WebUI「パスワード変更」）を追加。

### 監査ログ CSV 出力

- `GET /api/v1/exports/audit-logs.csv`（auditor / administrator）を追加。
  ISO27001 / J-SOX 指向の監査証跡として、変更前後・操作主体・IPハッシュ・UA を出力。
- 監査ログ画面に「CSV出力」ボタンを追加。

### セキュリティ・CI 強化

- API のリクエストボディ上限（1 MiB・Content-Length 事前拒否）と
  API 応答の `Cache-Control: no-store` を追加。
- GitHub Actions のサードパーティ action を SHA ピン化し、Dependabot で継続更新。
- CI / preview へ最小権限（`permissions: contents: read`）と concurrency ガードを追加。
- `scripts/backup-check.sh`（バックアップ鮮度・整合性チェック）を追加し、CI に Shell 構文検査を追加。

## 検証

| 項目 | 結果 |
| --- | --- |
| Backend lint / format / mypy | PASS |
| Backend pytest（非統合） | PASS |
| Frontend lint / test / build | PASS |
| 依存監査（pip-audit / pnpm audit） | PASS |
| compose / workflow 回帰テスト | PASS |

## 残課題

- OI-001 GitHub App 導入（本番は PAT 暫定運用）
- OI-004 通知資格情報（SMTP / Teams）の本番設定
- OI-005 Neon PITR 契約確認
- BK-06 APP_ACCESS_TOKEN の無効化（Cloudflare Access 全面適用後）
