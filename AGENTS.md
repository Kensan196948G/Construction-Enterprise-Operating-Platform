# AGENTS.md — Construction Enterprise Operating Platform

このリポジトリは建設会社向け統合運用基盤（ガバナンス・業務ポータル・フィールド OS・AI ガバナンスの調整レイヤー）です。
詳細な運用ポリシーは [.claude/CLAUDE.md](.claude/CLAUDE.md) を参照してください。

## 優先順位

1. 本番対象はリポジトリ直下のプラットフォーム（`src/`, `scripts/`, `docs/`）。
2. `legacy-projects/` は設計参照元。本番コードとして変更せず、移植は設計・バックログ経由。
3. `integrations/` は統合元リポジトリのスナップショット（移行中ソース）。
   直接の本番コード変更は行わず、機能は CEOP 本体（`src/`）または統合サービスとして移行する。
   統合計画は `docs/integration/` を正とする。
4. セキュリティ・監査・認証・承認は後付けにしない。変更は必ず検証する。

## 必須ゲート

- `pnpm run verify`（typecheck + lint + test）と `pnpm run build` を必ず実行
- `pnpm audit --audit-level=high` を 0 に保つ
- シークレット・トークン・個人データをコミット/ログ/Issue/PR に載せない
- 本番 DB スキーマ変更は `scripts/migrate.ts` に追記（適用済み migration は編集禁止）
- main への直接 push 禁止。PR と CI 必須。ブランチ保護を迂回しない

## コード規約

- TypeScript strict / 例外を投げない Result 型 / node:test でテスト
- 監査対象の mutation は `src/api/audit.ts` の `recordAudit()` で監査ログに記録
- バージョンは `src/version.ts` を正とし、`package.json` と一致させる
- 秘密の生成・ローテーションは `scripts/provision-api-key.ts` / 環境変数経由

<!-- central-github-policy -->

## GitHub運用ポリシー（中央配布）

GitHub運用はこのWorkspaceの記述ではなく、中央ポリシーに従います。

- 正本: /home/kensan/Projects/Deep-Seek-Harness-Project/GITHUB_POLICY.md
- 詳細: /home/kensan/Projects/Deep-Seek-Harness-Project/docs/architecture/CloudflareNeonGitHub自動化仕様.md
- 優先順位: 中央GitHub Policy > GitHub Rulesets > GitHub Actions/CI > Workspace AGENTS.md / CLAUDE.md / README
- main直接push禁止、Required Checks PASS後のSquash Merge、merge後branch削除
