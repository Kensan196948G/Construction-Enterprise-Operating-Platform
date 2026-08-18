# Release Notes v0.1.6（セキュリティ堅牢化・可視性統合）

公開日: 2026-08-07

## 変更内容

### セキュリティ

- **BE-06: プロジェクト台帳の可視性統合** — viewer が private リポジトリ由来の
  プロジェクト情報を、一覧・詳細・関係図・CSV・KPI で参照できていた問題を解消。
  `visible_project_filter` を全プロジェクト参照エンドポイントへ適用し、
  管理者のみ全件、他ロールは public / 明示許可リポジトリを持つプロジェクトのみ。
- **BE-07: Webhook ボディ上限の事前チェック** — `Content-Length` 超過を
  ボディ読み込み前に 413 で拒否し、nginx にも明示的な `client_max_body_size 2m` を設定。
- **GitHub Token の暗号化保存** — `app_settings` の `github.token` を Fernet で
  暗号化。`GITHUB_TOKEN_ENCRYPTION_KEY` 未設定時は `SECRET_KEY` から導出し、
  既存の平文保存値は後方互換で読取可能（次回保存時に暗号化へ移行）。
- **SEC-01: Token 操作 API を administrator 限定へ** — 資格情報の設定・テストは
  manager には許可しない（閲覧は従来どおり manager+ でマスク表示のみ）。
- **HSTS ヘッダー追加** — nginx レスポンスへ `Strict-Transport-Security` を付与。
- **イメージ再現性** — API Dockerfile の非フリーズ依存解決フォールバックを廃止。

### テスト

- viewer / administrator の可視性統合テスト（一覧・詳細・関係・CSV・KPI）。
- Webhook 上限超過テスト、Token 暗号化・レガシー平文互換テストを追加。

## 影響範囲

| 対象 | 影響 |
| --- | --- |
| API 動作 | viewer の参照範囲が D-004 に一致（既存仕様の欠落修正） |
| DB スキーマ | 変更なし（migration ゼロ） |
| 秘密情報 | 保存済み Token は次回保存時に暗号化へ移行。値・キーの出力なし |

## デプロイ・ロールバック

既存 v0.1.5 と同手順。暗号化キーを導入する場合はデプロイ前に
`GITHUB_TOKEN_ENCRYPTION_KEY` を設定し、保存済み Token を再保存する。
