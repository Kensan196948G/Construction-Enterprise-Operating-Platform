# Release Notes v0.1.1（本番堅牢化・運用補強）

公開日: 2026-08-06

## 目的

Phase 1 本番運用開始後に判明したセキュリティ・データ整合性・運用監視上の
ギャップを解消し、本番運用可能な状態を維持するためのリリース。

## 変更内容

### セキュリティ（P1）

- **P0 修正**: compose.yaml が `SECRET_KEY` を api / worker / scheduler / migrate
  コンテナへ渡していなかったため、ローカルセッション JWT がデフォルト鍵で署名される
  状態を解消。本番再デプロイ後は既存セッションが無効化されるため再ログインが必要
- **P0 修正**: `.env` の `DATABASE_URL` に `&` が含まれると `source` が代入を破壊し、
  bootstrap.sh / backup.sh / restore.sh が失敗する問題を修正（共通の安全な
  env-loader を追加。次回再起動時のコンテナ起動失敗を防止）
- `cryptography` を 49.0.0 以上へ更新し、PYSEC-2026-3552 / 3553 / 3554 を解消
  （pip-audit で検証）
- 本番（`APP_ENV != local`）起動時に設定検証を追加:
  `SECRET_KEY` 32 文字以上 / Webhook Secret・Access AUD・Issuer・DB URL のダミー値拒否
- ロールの正本を DB に統一し、セッション JWT 内の旧ロールを毎リクエスト上書き。
  権限剥奪・昇格の反映遅延（最大12時間）を解消

### データ整合性・監査（P2）

- `PATCH /projects/{id}` の `If-Match` を必須化（欠落時 428）。楽観ロックの実効化
- レビューキュー解決・運用メッセージ作成にレート制限を追加
- 同期実行・再試行を監査ログへ記録（`sync_run.create` / `sync_run.retry`）
- GitHub 一覧系 API（repos / issues / pulls / workflow runs）をページング対応

### 監視・運用（P2）

- メトリクス追加: `dx_atlas_api_ready` / `dx_atlas_github_rate_limit_remaining` /
  `dx_atlas_db_connection_errors_total`
- Prometheus アラートを実在メトリクスへ修正（ReadinessDown / GitHubRateLimitLow /
  DatabaseConnectionErrors）
- Prometheus スクレイプの Bearer 認証（`METRICS_TOKEN`）対応
- `scripts/bootstrap.sh` の必須変数に `SECRET_KEY` を追加し、トンネル方式の
  旧警告を削除。systemd Unit のパス表記を実機設定へ一致

### Frontend（P2）

- 権限のない利用者（viewer 等）が管理系バッジ取得 API を呼んで 403 になるのを防止
  （ナビゲーションバッジをロールで出し分け）

## 検証

| 項目 | 結果 |
| --- | --- |
| Backend lint / format / mypy / pytest | PASS |
| Frontend lint / build / vitest | PASS |
| pip-audit（依存監査） | PASS（既知脆弱性なし） |
| pnpm audit | PASS（既知脆弱性なし） |
| CI（GitHub Actions） | マージ前後に確認 |

## 対象外・残課題

- `APP_ACCESS_TOKEN` の無効化（ADR-002 L-003 撤回）は運用安定後に別途承認
- GitHub App 導入（OI-001）、Private 閲覧ポリシー確定（OI-002）は従来どおり保留
- LICENSE の確定はプロジェクトオーナー承認待ち
- Branch Protection / デフォルト branch の整理はリポジトリ設定変更として別途実施
