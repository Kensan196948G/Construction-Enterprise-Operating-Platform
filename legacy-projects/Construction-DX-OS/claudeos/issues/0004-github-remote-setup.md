---
id: "0004"
title: "GitHub remote 設定と Projects bootstrap"
status: closed ✅
priority: P1
phase: "Phase 0"
labels: [infra, github]
created: "2026-04-15"
closed: "2026-04-22"
blocked_by_human: true
---

## Summary

本リポジトリは現在 `git remote` 未設定のため、PR / Issue / Actions / Projects を使った
CLAUDE.md v8 の Issue 駆動運用ができない。remote 確立は本件の前提条件。

## Required user action

```bash
# 1) GitHub 上にリポジトリを作成 (gh auth login 済みの想定)
gh repo create kensan1969/construction-dx-os --private --source=. --remote=origin

# 2) ローカル commit を push
git push -u origin main

# 3) GitHub Project (v2) を初期化
gh project create --owner kensan1969 --title "Construction-DX-OS"
```

## Acceptance Criteria

- [x] `git remote -v` に `origin` が表示される
- [x] `main` ブランチが GitHub に push 済み
- [x] Actions が最低 1 回 green
- [x] Project に Backlog / In Progress / Review / Done の列が存在

## Resolution (2026-04-22, Loop 27)

- Remote: `https://github.com/Kensan196948G/Construction-DX-OS.git`
- Push: 50 commits (49 + LICENSE merge commit)
- CI run #24753466312: 全 6 ジョブ green ✅
  - cdx-agent py3.11 / py3.12
  - cdx-server py3.11 / py3.12 (Postgres 16)
  - SDK up-to-date check
  - docs hygiene
- GitHub Project #21: https://github.com/users/Kensan196948G/projects/21

## Notes

CTO 判断: この Issue は `blocked_by_human: true`。ユーザーが gh 認証情報を持つまで
ローカル commit + `claudeos/issues/` で暫定運用する。
