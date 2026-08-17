# Release Notes v0.1.4（管理設定の永続化・UI/UX・監査表示の強化）

公開日: 2026-08-07

## 目的

フロントエンド監査（2026-08-07 サイクル3）で検出された管理機能の欠落
（設定が保存されない・監査の変更前後が表示されない・関係性管理 UI がない・
CSV 出力が認証付きでない・モバイル検索がない）を解消し、Phase 1 の
主要業務フローを完成させる。

## 変更内容

### バックエンド API

- **設定の永続化**: `GET/PUT /api/v1/settings` が活動閾値（active/normal/stale/
  本番猶予）、通知先アダプター、データ鮮度 SLO、監査ログ・観測値の保持日数を
  保存・検証・監査ログ記録できるよう拡張（FE-01）
- **監査ログの before/after**: `GET /api/v1/audit-logs` が変更前後の値を返す
  （FE-04）

### フロントエンド

- 設定画面: 全項目の保存ボタン・バリデーション・保存状態表示（FE-01/FE-10）
- 監査ログ画面: 変更前 → 変更後の表示（FE-04）
- 関係性管理: 作成モーダル（proposed/approved・根拠・理由）と承認/却下操作
  （FE-13、FR-009 の Must フロー完成）
- プロジェクト編集: 利用区分・会社資産・領域の分類項目を追加（FE-16）
- CSV 出力: 認証ヘッダー付き fetch + Blob ダウンロード（FE-03）
- モバイル検索: 一覧画面へ検索入力を追加（FE-06）
- 全件ページング: リポジトリ/プロジェクトの `limit:100` 先頭分依存を解消
  （FE-07/FE-08）
- 3D Atlas: prefers-reduced-motion 時は 2D へ案内、SVG ノードのキーボード選択
  とフォーカス表示（FE-05/FE-12）
- nginx: `index.html` no-cache / ハッシュ付き静的アセット immutable（FE-17）

### テスト

- 設定の永続化・監査 before/after の回帰テスト（`test_settings.py`）
- 関係性作成・承認操作のフロントテスト（`RelationsPage.test.tsx` 新規）
- 検索・CSV・全件ページングのテスト追加（`ProjectsPage.test.tsx` /
  `Pages.smoke.test.tsx`）

## 影響範囲

| 対象 | 影響 |
| --- | --- |
| API 応答 | `GET /settings` に新フィールド追加、`GET /audit-logs` に before/after 追加（後方互換: 追加のみ） |
| DB スキーマ | 変更なし（AppSetting の既存 key-value を利用。migration ゼロ） |
| 秘密情報 | 変更なし |
| 公開 DNS / ルート / 認証方式 | 変更なし |

## テストおよび CI 結果

- バックエンド: `uv run pytest` → 全 PASS（含む設定・監査回帰）
- フロント: `pnpm lint` / `pnpm build` / `pnpm test`（22 tests）→ 全 PASS
- CI: PR 上で backend/frontend/security/build-and-smoke/e2e を確認

## deployment 方法

release-runbook のとおり、API イメージから起動する 4 サービスをまとめてビルドし
`docker compose up -d api worker scheduler web`。

## rollback 方法

直前のイメージタグへ戻す（migration ゼロのため DB rollback 不要）。
