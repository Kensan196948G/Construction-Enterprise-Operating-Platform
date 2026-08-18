# Release Notes v0.3.0（Phase 3: Teams・通知抑制・週次レポート・AI・3D 操作性）

公開日: 2026-08-07

## 変更内容

### 通知（FR-012 拡張）

- **Teams アダプター実装**: Microsoft Teams Incoming Webhook（MessageCard）へ送信。
  `NOTIFICATION_TEAMS_WEBHOOK_URL` で設定（未設定時は
  `teams_webhook_not_configured` として記録）。
- **通知の抑制・集約**: `fingerprint` を導入し、同一原因の通知は抑制ウィンドウ
  （既定60分・`notify.suppress_minutes` で変更可）内で新規作成せず
  `duplicate_count` を加算。同期失敗は error_code 単位、レビュー追加はプロジェクト単位で集約。
- 通知画面に集約件数（×N）を表示。

### 週次ポートフォリオサマリー（FR-016）

- スケジューラーが 7 日ごとに週次サマリーを生成し通知キューへ登録
  （`reports.weekly_last_run_at` で管理・再起動に強い）。
- 管理画面から `POST /api/v1/notifications/weekly-report` で手動生成も可能
  （通知画面の「レポートを送信」ボタン・manager+）。

### AI（FR-017・OI-007 承認済み・オフライン動作可能）

- `POST /api/v1/projects/{id}/ai-summary` を追加（manager+・レート制限・監査ログ）。
- プロバイダー: `AI_PROVIDER=none`（既定・ルールベース要約）または `openai`
  （`AI_API_KEY` / `AI_MODEL` / `AI_BASE_URL`）。未設定・API 障害・月次費用上限超過時は
  オフライン要約へ自動フォールバック。
- 送信データは承認済みメタデータのみ（README 本文・Issue/PR 本文・個人情報は送らない）。
- 全呼び出しを `ai_usage` テーブルへ記録（モデル・トークン・推定費用・成否）。
- 詳細画面に「AI要約」ボタンと「AI提案・未確認」表示を追加。

### 3D Atlas（FR-011 拡張）

- 重要度4以上のノードにラベル（スプライト）を表示、選択中ノードは常時ラベル表示。
- キャンバスにフォーカスし矢印キーでノード選択（キーボード操作）。

### 設定・環境変数

- `notify.suppress_minutes`（通知抑制時間）を管理設定に追加。
- `.env.example` に `NOTIFICATION_TEAMS_WEBHOOK_URL` と AI 変数を追加。

## 検証

| 項目 | 結果 |
| --- | --- |
| Backend ruff / format / mypy | PASS |
| Backend pytest（通知・レポート・AI・設定・スケジューラー・同期・バージョン） | PASS |
| Frontend lint / build / test | PASS（16 tests） |
| migration（0001→0005） | PASS |
| CI 6 ジョブ | マージ時に確認 |

## 対象外（バックログ）

- AI の類似プロジェクト検出・リスク説明（要約の次段階・プロバイダー設定後に追加）
- 3D のノード個別ラベル常時表示（重要度4以上のみ現状表示）
- SMTP/Webhook/Teams の本番資格情報設定（設定チェックリストは runbook に記載）
