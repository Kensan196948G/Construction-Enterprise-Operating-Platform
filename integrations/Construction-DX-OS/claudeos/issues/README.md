# Local Issue Factory

GitHub remote が設定されるまでの暫定運用として、Issue を Markdown で管理する。

## ルール

- ファイル名: `NNNN-slug.md` (4桁ゼロ詰め + kebab-case)
- フロントマター: `status`, `priority`, `created`, `labels`, `phase`
- remote 確立後: `gh issue create --body-file <file>` で一括同期
- 同期済みのファイルは `github_issue` にリンクを記録する

## ステータス

| ステータス | 意味 |
|---|---|
| `open` | 未着手 |
| `in_progress` | 作業中 |
| `blocked` | 依存待ち |
| `done` | 完了済み |
| `synced` | GitHub に同期済み |

## 優先度

| レベル | 対象 |
|---|---|
| P1 | CI / Security / Data impact |
| P2 | Quality / UX / Test |
| P3 | Minor / Docs |
