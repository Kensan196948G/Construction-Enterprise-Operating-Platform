# 📌 運用・リリース手順書

この文書は Civil Construction AI Build Platform リポジトリの運用・リリース・障害対応・復旧手順を定めます。
対象はリポジトリ本体（スクリプト・テンプレート・CI）と、そこから生成される案件ワークスペースです。

## 🚀 1. リリース手順

1. 作業ブランチ（`feature/*` または `chore/*`）で実装し、論理単位で commit・push。
2. PR を作成し、以下が green であることを確認する:
   - shellcheck / bats（8 suite・207件）/ py_compile / secret scan / CodeRabbit
3. CTO（または担当レビュアー）が差分をレビューし、P0/P1 がゼロであることを確認。
4. `gh pr merge <n> --merge` で main へマージ（base が main であることを必ず確認）。
5. リリースタグを作成: `git tag v<major.minor.patch> && git push origin v<major.minor.patch>`
6. GitHub Release に変更点・検証結果・既知の制約を記載。

## 🔙 2. ロールバック

- リリース直後の重大異常（CI 破壊・生成エンジン誤動作）は `git revert <merge-commit>` で main を戻す。
- タグを切ってある場合は直前タグとの差分確認後に revert する。履歴改変（force push）は禁止。
- 生成済み案件はリポジトリ外（`projects/`）のため、リポジトリロールバックの影響を受けない。

## 📦 3. バックアップ

| 対象 | 方法 | 周期 | RPO |
|---|---|---|---|
| リポジトリ（コード・テンプレート・CI） | Git リモート（GitHub） + ローカル mirror | push 時 | 最終 push 時点 |
| 案件ワークスペース（`projects/`） | `scripts/backup_projects.sh backup` → 外部ストレージへ退避 | 日次〜週次 | 1日〜1週 |
| アーカイブ済み案件（`projects/.archive/`） | 上記に含む（`.archive` も同一 tar.gz へ格納） | 日次〜週次 | 1日〜1週 |
| GitHub Issues / Projects | GitHub クラウド（自動） | - | - |

具体コマンド（`tests/backup_projects.bats` で回帰テスト済み）:

```bash
# バックアップ作成（既定出力: backups/projects-YYYYMMDD-HHMMSS.tar.gz）
scripts/backup_projects.sh backup

# アーカイブの整合性検証（破損時 exit 2）
scripts/backup_projects.sh verify backups/projects-<timestamp>.tar.gz

# 保有バックアップの一覧
scripts/backup_projects.sh list
```

> `projects/` と `backups/` はともに gitignore 対象のため、Git だけではバックアップになりません。
> 作成した tar.gz は必ず外部ストレージ（DirectCloud / ファイルサーバ等）へ退避してください。

## ♻️ 4. 復元手順

1. リポジトリ: リモートから `git clone` / `git fetch` し、対象タグまたは commit を checkout。
2. 案件: `scripts/backup_projects.sh restore <archive>` で `projects/` へ復元。
   復元先が空でない場合は誤上書き防止で exit 1 となる（意図的な上書きは `--force`）。
   パーミッションは復元時に `chmod -R u+rwX` 済み。
3. アーカイブ復元: `scripts/manage_projects.sh restore <name>` で `projects/` へ戻す。
4. 復元後は `scripts/manage_projects.sh check-placeholder` と `bats tests/` で健全性を確認。
5. 復元試験（四半期）は本番 `projects/` に触れず一時ディレクトリで行う:

```bash
RESTORE_TEST="$(mktemp -d)"
CCAI_PROJECTS_DIR="${RESTORE_TEST}/projects" \
  scripts/backup_projects.sh restore backups/projects-<timestamp>.tar.gz
diff -r projects "${RESTORE_TEST}/projects" && echo "復元試験OK"
rm -rf "${RESTORE_TEST}"
```

## 📊 5. 監視・定期タスク

| タスク | 周期 | 担当 | 判定基準 |
|---|---|---|---|
| GitHub Actions 実行結果・失敗率 | 週次 | 運用担当 | 失敗 0 / 連続成功 |
| Issues / PR 滞留確認 | 週次 | 運用担当 | P1 未解決 0 |
| secret scan・secrets 有効期限確認 | 月次 | セキュリティ担当 | 検出 0・期限切れ 0 |
| 脆弱性・依存関係・EOL・ライセンス棚卸し | 四半期 | CTO / セキュリティ担当 | Critical/High 0 |
| バックアップ・復元試験 | 四半期 | 運用担当 | 復元完了確認 |
| 容量・利用状況（Actions 分・生成案件数） | 四半期 | 運用担当 | 予算/上限内 |
| 権限棚卸し（GitHub コラボレーター・トークン） | 四半期 | セキュリティ担当 | 最小権限維持 |

## 🚨 6. 障害対応 Runbook

### ❌ CI 失敗
1. `gh run list` とログで失敗ジョブを特定。
2. 同一原因の修復は最大3回。超えたら Issue 化して原因を記録。
3. 修正は最小差分で行い、再検証後に PR を作成。

### 🔑 gh / git が `HTTP 401: Bad credentials` を返す
症状: `gh` の全コマンドが 401、`git fetch` が `Invalid username or token` で失敗する。
`gh auth status` は「The token in GITHUB_TOKEN is invalid」と表示する。

原因: `gh` は **`GH_TOKEN` → `GITHUB_TOKEN` → `~/.config/gh/hosts.yml`** の順に
資格情報を採用する。環境に無効な `GITHUB_TOKEN` が設定されていると、
`gh auth login` 済みの正しいトークンが**上書きされて使われない**。
`gh auth login` をやり直しても環境変数が優先されるため解消しない。

対処:
1. 値は表示せず、変数が設定されているかだけを確認する
   （`[ -n "${GITHUB_TOKEN:-}" ] && echo set || echo unset`）。
2. 当該コマンドだけ環境変数を外して実行する。

```bash
env -u GITHUB_TOKEN gh pr list
env -u GITHUB_TOKEN git fetch origin --prune
```

3. 恒久対処として、無効なトークンをシェル起動ファイル・cron 環境から削除するか、
   有効なトークンへローテーションする。**トークン値をログ・PR・Issue へ出力しない。**

> ⚠️ cron / CI の非対話実行は同じ理由で無音のまま失敗する。
> 自律実行を仕込む際は `env -u GITHUB_TOKEN` を前置するか、環境を明示的に整える。

### ⚙️ 案件生成エンジンの誤動作
1. `scripts/create_project.sh <name> --dry-run` で入力検証・生成先を確認。
2. 既存案件を壊さない（上書き拒否 exit 2 が効いていること）。
3. テンプレート変更が原因なら `git diff main -- templates/` で差分を特定し revert。

### 🗑️ 誤削除・紛失
1. `projects/.archive/` を確認し、あれば `manage_projects.sh restore <name>` で復元。
2. バックアップから該当案件を復元（§4）。
3. 根本対策として delete は `--force` 必須 + スラッグ検証済みであることを確認。

## 📋 7. 運用台帳

運用台帳は本節の表へ直接記録する（別ファイル `operations-log.md` は存在しない。
行数が増えて分離する場合は、この一文を新ファイルへのリンクに置き換える）:

| 日時 | 種別（リリース/障害/復旧/定期） | 内容 | 担当 | 結果 | 次回アクション |
|---|---|---|---|---|---|
| 2026-08-11 | 定期（初回） | 案件バックアップ初回実行・復元試験 — `backup_projects.sh` で projects/ 全体（2ディレクトリ・30エントリ）を tar.gz 化、verify 後に一時ディレクトリへ復元し `diff -r` 差分ゼロを確認 | CTO | ✅ backup / verify / restore すべて成功 | tar.gz の外部ストレージ退避（ユーザー実施）・四半期試験の継続 |
| 2026-08-09 | リリース | v0.6.1 本番運用整備 — .gitignore 整理・LICENSE(MIT)追加・webui デプロイ文書化・SECURITY.md 更新 | CTO | ✅ test 172/172・shellcheck/py_compile/secret scan すべてgreen | PR review → merge → 保守フェーズ継続 |
| 2026-08-07 | リリース | v0.6.0 — 案件管理ダッシュボード プロトタイプ + 三層検証 | CTO | ✅ bats 127→172件 / 6→7 suite・CI green | 実ブラウザ検証（BLOCKED）・CodeRabbit re-review |
| 2026-08-06 | リリース | v0.5.0 Production Ready — 全機能統合・security review 0件 | CTO | ✅ 全テストpass・Branch Protection 有効 | — |

台帳は README と同様に真実として維持し、月次レビューで更新する。

## 📈 8. SLI/SLO 目安

| 指標 | 目標 |
|---|---|
| CI 成功率（直近30日） | ≥ 99% |
| テスト成功率 | 100%（全 suite） |
| P0/P1 未解決数 | 0 |
| 復旧目標（RTO） | リポジトリ: 1時間以内 / 案件: 1日以内 |
| データ損失許容（RPO） | リポジトリ: 最終 push / 案件: 最終バックアップ時点 |
