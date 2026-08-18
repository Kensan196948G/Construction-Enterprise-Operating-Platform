# 統合元 4 リポジトリ 削除チェックリスト（v0.14.0・2026-08-18）

> ユーザー指示: 「全機能のみを移行、統合元、統合後はレポジトリを完全削除（既に削除されていたらスキップ）」
> 移行完了（PR #59 マージ）後に GitHub から削除する。削除は Human Gate の不可逆操作のため、
> 保全を完了させてから実施する（本チェックリストで確認）。

## 1. 移行完了確認

- [x] 全機能が CEOP へ移行（9 ドメイン・CRUD API・監査・`/mvp-app`・ダミーデータ・テスト）
- [x] `pnpm run verify` PASS（test 627 / parity 44/65）
- [x] `pnpm run test:e2e` 18 PASS
- [x] 公開検証: `https://ceop-mvp.mirai-dx-platform.com` で全機能動作確認
- [x] PR #59 マージ（2026-08-18・CI 全必須チェック PASS・Squash Merge）

## 2. 保全確認（削除前に必須）

| リポジトリ | GitHub zip アーカイブ | git bundle（全履歴） | integrations/ 設計文書 | ローカル clone |
|---|---|---|---|---|
| Civil-Construction-Management-Platform | ✅ | ✅ | ✅ | ✅ |
| Civil-Construction-AI-Build-Platform | ✅ | ✅ | ✅ | ✅ |
| DX-Project-Portfolio-Atlas | ✅ | ✅ | ✅ | ✅ |
| Civil-Material-Photo-Logger | ✅ | ✅ | ✅ | ✅ |

保全先: `/home/kensan/Projects/Mirai-DX-Project/.ceop-absorption-archive-20260818/`

## 3. 削除手順

```bash
# 削除前に保全整合性を再確認してから
gh repo delete Kensan196948G/Civil-Construction-Management-Platform --yes
gh repo delete Kensan196948G/Civil-Construction-AI-Build-Platform --yes
gh repo delete Kensan196948G/DX-Project-Portfolio-Atlas --yes
gh repo delete Kensan196948G/Civil-Material-Photo-Logger --yes
```

## 4. 削除後確認

- [x] `gh repo view` が 404 になること（4 リポジトリ・2026-08-18 実測）
- [ ] 削除記録を `OPERATIONS_LEDGER.md`・`state.json`・`CHANGELOG.md` に追記

## 5. 削除実施記録（2026-08-18）

| リポジトリ | 削除日時 | GitHub 確認 |
|---|---|---|
| Civil-Construction-Management-Platform | 2026-08-18 | ✅ 404（削除済み） |
| Civil-Construction-AI-Build-Platform | 2026-08-18 | ✅ 404（削除済み） |
| DX-Project-Portfolio-Atlas | 2026-08-18 | ✅ 404（削除済み） |
| Civil-Material-Photo-Logger | 2026-08-18 | ✅ 404（削除済み） |

削除後も参照は以下で可能:
- 保全アーカイブ: `/home/kensan/Projects/Mirai-DX-Project/.ceop-absorption-archive-20260818/`（GitHub zip + git bundle 全履歴）
- 設計文書: `integrations/<リポジトリ名>/docs/`（CEOP リポジトリ内）
- ローカル clone: `/home/kensan/Projects/Mirai-DX-Project/<リポジトリ名>/`
