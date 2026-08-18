# 📌 WebUI 配信物の統制とビルド再現性

本書は Cloudflare Workers で配信する WebUI（`webui/Civil AI Build Console.html`）の
出所・配信フロー・監査方法・再現性の現状を定める。改善計画 A11（W1/W3 対応）の成果物。

## 🗺️ 1. 構成と責任分界

| 資産 | 場所 | Git 管理 | 所有 | 役割 |
|---|---|---|---|---|
| 案件管理ダッシュボード原本 | `docs/design-prototype/`（index.html / app.js / styles.css / case-management-mock.js） | ✅ 対象 | リポジトリ | 三層検証（bats 46件）でテスト済みのプロトタイプ |
| 本番配信バンドル | `webui/Civil AI Build Console.html`（8.4MB 単一HTML） | ❌ gitignore | 👤 ユーザー | Cloudflare Workers で配信される本番 UI |
| デプロイスクリプト | `webui/deploy/deploy.sh` + `wrangler.jsonc` | ❌ gitignore | 👤 ユーザー | バンドルを無改変コピーして `wrangler deploy` |

> ⚠️ `webui/` 配下はユーザー所有・変更禁止。本リポジトリのスクリプト・CI は読み取り以外行わない。

## 🔁 2. 配信フロー（現状）

```text
webui/Civil AI Build Console.html   ← 原本（ユーザーが外部ツールで作成したバンドル）
        │ cp（無改変・sha256 表示付き）
        ▼
webui/deploy/public/index.html
        │ wrangler deploy
        ▼
Cloudflare Workers（ccabp-web）
```

`deploy.sh` はコピー前後の SHA-256 を表示するため、配信物の同一性はデプロイログで確認できる。

## 🔐 3. 配信物の監査（ハッシュ固定）

配信中バンドルの SHA-256 を記録し、変更検知の基準とする:

| 記録日 | ファイル | SHA-256 |
|---|---|---|
| 2026-08-11 | `webui/Civil AI Build Console.html` | `1fa2abc0c3874ddb7b504328bfb42a26a5b7329d30d1f2328edeab2ce4b9021d` |

検証コマンド:

```bash
sha256sum "webui/Civil AI Build Console.html"
# 上表と一致すれば、配信物は記録時点から無変更
```

バンドルを更新した場合は、この表へ新しい行を追記してから `deploy.sh` を実行する
（ハッシュは秘密情報ではないためリポジトリへ記録してよい）。

## 🔧 4. ビルド再現性の現状と制約

- ❌ **現状、バンドルはリポジトリ内のソースから再現できない。**
  `docs/design-prototype/`（約60KB）とは別系統で、外部デザインツールの
  エクスポート成果物（アセット・フォントをインライン化した 8.4MB 単一HTML）である。
- リポジトリが保証できるのは「§3 のハッシュ照合による無改変性」と
  「`deploy.sh` の無改変コピー配信」まで。生成過程の再現はユーザー側の手順に依存する。

### 👤 ユーザー側アクション（再現性確立に必要）

1. バンドルを生成した外部ツール名・プロジェクトファイル・エクスポート手順を
   本書 §5 へ追記する（ツールのプロジェクトファイルは DirectCloud 等へ退避）。
2. バンドル更新のたびに §3 のハッシュ表を更新する。
3. 将来的には `docs/design-prototype/` を正本とした配信物生成へ一本化することを推奨
   （検証済みソース＝配信物となり、本書 §4 の制約が解消される）。

## 📝 5. バンドル生成手順（ユーザー記入欄）

> 未記入。生成ツール・プロジェクトファイルの所在・エクスポート設定をここに記録してください。

## 🚨 6. 障害時の復旧

- 配信物破損時: `webui/Civil AI Build Console.html` を §3 のハッシュと照合し、
  不一致ならユーザー保管の原本から再配置して `deploy.sh` を再実行。
- Workers 側の障害: `wrangler deployments list` で直前デプロイへロールバック可能
  （`webui/deploy/` 内で実行。ユーザー認証が必要）。
