# Release Notes v0.1.5（同期データ列長超過の解消）

公開日: 2026-08-07

## 目的

v0.1.4 デプロイ後の本番監視で、GitHub Actions Run のタイトルが 500 文字を
超える場合に `github_items` の挿入が
`StringDataRightTruncation: value too long for type character varying(500)`
で失敗し、該当リポジトリの同期が `repos_failed` として記録されることを検出。
データ収集の劣化を解消する。

## 変更内容

- `_upsert_github_item` の保存境界で、DB 列長を超えるフィールドを切り詰める
  - title: 500 / state: 50 / author: 120 / github_id: 100 / kind: 20
  - url は Text 列のため対象外
- 回帰テスト追加（700 字タイトル・200 字 author・150 字 github_id でも保存成功）
- バージョン 0.1.5（api / web 一致）

## 影響範囲

| 対象 | 影響 |
| --- | --- |
| 同期データ | 列長超過フィールドが切り詰められて保存（表示・検索用途のため完全性に影響なし） |
| API 応答 / DB スキーマ | 変更なし（migration ゼロ） |
| 秘密情報 / DNS / 認証 | 変更なし |

## テストおよび CI 結果

- `uv run pytest tests/test_sync.py` → 6 passed（新規回帰含む）
- `ruff check` / `mypy` → PASS
- CI: backend / frontend / security / build-and-smoke / e2e / deploy-preview → SUCCESS

## deployment 方法

release-runbook のとおり、API イメージから起動する 4 サービスをまとめてビルドし
`docker compose up -d api worker scheduler web`。

## rollback 方法

直前のイメージタグ（rollback-v0.1.4）へ戻す（migration ゼロのため DB rollback 不要）。
