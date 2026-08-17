# Release Notes v0.4.0（AI 類似/リスク・通知自己診断・3D 全ラベル）

公開日: 2026-08-07

## 変更内容

### AI の類似プロジェクト検出・リスク説明（FR-017 次段階）

- `POST /api/v1/projects/{id}/ai-similar`（manager+）: 承認済みメタデータ
  （領域・区分・フェーズ・担当・Topics）から類似スコア（0〜1）を計算し、上位5件と
  共通点・理由を返す。可視性ルール（D-004）を適用。
- `POST /api/v1/projects/{id}/ai-risk`（manager+）: ルールベースでリスク候補を検出
  （同期失敗 critical / CI 失敗 warning / 活動停滞 warning / レビュー未処理 warning /
  担当未登録・レビュー未設定 info）。重大度順にソートして返す。
- 類似・リスクはオフラインで常に動作し、呼び出しは監査ログ（`ai.similar` / `ai.risk`）に記録。
- 詳細画面に「類似を探す」「リスク分析」ボタンと結果表示を追加。
- オフライン要約も監査のため `ai_usage` に provider=offline として記録するよう変更。

### 通知の自己診断（資格情報設定後の確認用）

- `POST /api/v1/notifications/test`（administrator）: 現在のアダプター設定でテスト通知を
  即時送信し、status / channel / error_code を返す。資格情報設定後の確認がワンステップに。
- operations-runbook の設定チェックリストを更新。

### 3D Atlas のラベル常時表示（FR-011）

- 全ノードのラベルを常時表示（重要度4以上は標準サイズ、その他は 82% サイズ）。

## 検証

| 項目 | 結果 |
| --- | --- |
| Backend ruff / format / mypy | PASS |
| Backend pytest（AI 類似/リスク・通知・レポート・設定・スケジューラー・同期・バージョン） | PASS |
| Frontend lint / build / test | PASS（16 tests） |
| CI 6 ジョブ | マージ時に確認 |

## 対象外（バックログ）

- LLM による類似理由・リスク説明の自然言語化（プロバイダー設定後に追加予定）
- ベクトル埋め込みによる類似検出（pgvector 等・データ量に応じて検討）
- 通知アダプター本番資格情報の設定（決定後のチェックリスト適用）
