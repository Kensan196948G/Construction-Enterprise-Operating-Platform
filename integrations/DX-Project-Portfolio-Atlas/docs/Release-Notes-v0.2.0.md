# Release Notes v0.2.0（Phase 2: 保持・通知・3D WebGL）

公開日: 2026-08-07

## 変更内容

### 保持期間の自動削除ジョブ（OPS-04）

- スケジューラーが 24 時間ごとに `run_retention()` を実行し、設定値に基づいて
  audit_logs / observations / 終了済み sync_runs / 終了済み job_queue をバッチ削除。
- 実行中（queued/running）の run・job は削除しない。
- 結果は監査ログ（`retention.run`）と通知キュー（`retention.completed`）へ記録。
- 保持日数は管理設定 API から変更可能（`retention_audit_days` /
  `retention_observations_days` / `retention_sync_runs_days` /
  `retention_job_queue_days`）。

### 運用通知（FR-012 の Phase 2 スライス・OI-004 の実装基盤）

- `notifications` テーブル（migration 0004）と通知キューを追加。
- 通知イベント: 同期失敗（critical）/ 同期部分失敗（warning）/ レビューキュー追加（info）/
  保持削除完了（info）。
- アダプター: email（SMTP・STARTTLS/SMTPS）と webhook（HTTP POST）。`teams` は
  未実装のため skipped として記録（Phase 3 で実装）。
- 配信状態（pending / sent / failed / skipped）を DB に保持し、失敗理由も記録。
- スケジューラーが毎 tick で未配信分（最大20件）を配信。
- 新 API: `GET /api/v1/notifications`（認証済み・ページング）。
- 通知画面を実 API へ接続（従来の派生イベントは実データが無い場合のフォールバック）。

### 3D Atlas の WebGL 化（Phase 2）

- SVG 擬似 3D に代わり、three.js による WebGL 描画を追加（遅延ロード・約 131KB gzip の
  独立チャンク）。ドラッグ回転・ホイールズーム・クリック選択・選択ハイライトに対応。
- WebGL 非対応環境・prefers-reduced-motion では従来の SVG 表示/2D 誘導へフォールバック。
- 主要バンドルには影響しない（動的 import）。

### 設定・環境変数

- `.env.example` に SMTP / Webhook 通知用変数を追加
  （`SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` /
  `NOTIFICATION_WEBHOOK_URL`。アダプターが none/未実装の場合は skipped、
  SMTP/Webhook/送信先が未設定の場合は failed として記録され運用を阻害しない。
  設定完了後は次回イベントから配信される）。
- 管理設定 API に保持日数・通知先メールを追加。

## 検証

| 項目 | 結果 |
| --- | --- |
| Backend ruff / format / mypy | PASS |
| Backend pytest（通知・保持・設定・スケジューラー・同期） | PASS |
| Frontend lint / build / test | PASS（16 tests） |
| 3D 遅延チャンク | PASS（518KB min / 131KB gzip・別チャンク） |
| CI 6 ジョブ | マージ時に確認 |

## 対象外（バックログ）

- Teams アダプター・通知の抑制/集約ロジック（Phase 3）
- 週次レポートの自動送信（Phase 3・アダプター基盤は本リリースで整備）
- AI（要約・分類・RAG）: OI-007 承認後に設計書
  （docs/architecture/ai-integration-design.md）へ沿って実装
- 3D のラベル描画・ノード個別フォーカス（Phase 3）
