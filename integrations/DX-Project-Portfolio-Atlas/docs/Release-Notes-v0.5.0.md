# Release Notes v0.5.0（AI 自然言語化・ベクトル類似検出・通知自己診断 UI）

公開日: 2026-08-07

## 変更内容

### AI の自然言語化（AI_PROVIDER=openai 設定時）

- リスク説明: ルールベースのリスク項目を基に、OpenAI が自然言語の要約を生成。
  未設定・費用超過・API 障害時は従来のルール要約へフォールバック。
- 類似検出: `AI_SIMILARITY_MODE=embedding` 設定時はベクトル類似度（コサイン）を使用。
  OpenAI Embeddings（`AI_EMBEDDING_MODEL`・既定 text-embedding-3-small）または
  オフライン feature-hashing 埋め込み（API キー不要・決定論的）へ自動フォールバック。
  既定は `metadata`（従来のメタデータ類似度）で後方互換。

### ベクトル類似検出の基盤（migration 0006）

- `project_embeddings` テーブル（JSON 保存・project_id 主キー）を追加。
- 現在のデータ量（数十〜数百プロジェクト）では JSON＋Python コサイン類似で十分な性能。
  数千規模になった時点で pgvector の vector 列＋HNSW インデックスへ移行する設計
  （docs/architecture/ai-integration-design.md に移行手順を記載）。

### 通知自己診断 UI

- 通知画面に「通知設定テスト」ボタン（administrator）を追加。`POST /notifications/test` の
  結果（status / channel / error_code / 送信内訳）を画面に表示。

## 検証

| 項目 | 結果 |
| --- | --- |
| Backend ruff / format / mypy | PASS |
| Backend pytest（AI 類似/リスク・埋め込み・通知・レポート・設定・スケジューラー・同期・バージョン） | PASS |
| Frontend lint / build / test | PASS（16 tests） |
| migration（0001→0006） | PASS |
| CI 6 ジョブ | マージ時に確認 |

## 対象外（バックログ）

- pgvector への本格移行（数千プロジェクト規模・性能要件発生時）
- 通知アダプター本番資格情報の設定（資格情報決定後・自己診断 API/UI で確認）
