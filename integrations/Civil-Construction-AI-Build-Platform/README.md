# 🏗️ Civil Construction AI Build Platform

> 土木建設DX案件を**量産・標準化**するためのメタプラットフォーム。
> 共通ドメイン知識・テンプレート・案件生成エンジンを備え、各案件を PoC / 検証用途で安全に立ち上げる。

[![CI](https://github.com/Kensan196948G/Civil-Construction-AI-Build-Platform/actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

## 📌 概要

| 項目 | 内容 |
|---|---|
| 目的 | 土木建設DX案件の立ち上げを標準化・高速化する |
| 提供物 | 案件生成エンジン / 案件管理 CLI / ポートフォリオ生成 / 案件スケルトン / 共通ドメイン用語集 / 専門エージェント |
| 技術構成 | bash（エンジン） + bats（テスト） + shellcheck（lint） + Python（mock同期）※エンジン本体はNode非依存 |
| 案件の性質 | すべて PoC / 検証用途（本番DB・実データ・外部SaaS書込は禁止） |
| ステータス | Foundation v0.7 + Issue #32 hardening（評価・統制回復: 18項目採点 57.5点 / bats 207件・8 suite） |

## 🗺️ アーキテクチャ

```
templates/project-skeleton/     ← 案件の雛形 (プレースホルダ入り・業種別対応)
             │
             │  scripts/create_project.sh  (copy-then-replace)
             ▼
projects/<YYYY-MM-DD>-<name>/   ← 生成された案件ワークスペース (gitignore対象)
             │
             └─ CLAUDE.md / README.md / docs/ / mock/ / prototype/ / tests/ / .claude/
             │
             │  scripts/manage_projects.sh  (案件横断管理)
             │
             ├─ list / status / report / check-placeholder / archive / restore / delete
             │
             │  scripts/generate_portfolio.sh (静的HTMLポートフォリオ)
             ▼
docs/portfolio/index.html       ← 全案件の一覧ポートフォリオ（gitignore）

shared-knowledge/               ← 全案件が参照する共通ドメイン知識
.claude/agents,commands/        ← プラットフォーム共通のエージェント・コマンド
```

## 🚀 使い方

### 1. 案件を生成する

```bash
# 基本（テーマなど後から編集可）
scripts/create_project.sh bridge-inspection

# 詳細指定
scripts/create_project.sh bridge-inspection \
  --theme "橋梁点検記録のDX" \
  --purpose "点検記録の電子化PoC" \
  --scope "目視点検～帳票出力" \
  --target-users "点検技術者/発注者"
```

→ `projects/<今日の日付>-bridge-inspection/` が生成されます。

Claude Code 内からはスラッシュコマンドも利用できます:

```
/create-project bridge-inspection --theme "橋梁点検記録のDX"
```

#### create_project.sh オプション

| オプション | 説明 |
|---|---|
| `--theme` | 案件テーマ（Mission に反映） |
| `--purpose` | 目的 |
| `--scope` | スコープ |
| `--target-users` | 対象ユーザー |
| `--type <業種>` | 業種テンプレート適用（省略時は汎用） |
| `--list-types` | 利用可能な業種一覧を表示して終了 |
| `--dry-run` | 生成内容をプレビュー（ファイル書き出しなし） |
| `--date YYYY-MM-DD` | 生成日（省略時は今日 / テスト用に注入可） |
| `--root <dir>` | 生成先ルート（省略時は `projects/`） |
| `-h, --help` | ヘルプ表示 |

> 💡 案件名は英小文字・数字・ハイフンのみ。生成先が既存なら**上書きせず**停止します（exit 2）。

#### 対応業種（--type）

| 業種コード | デフォルトテーマ |
|---|---|
| `bridge` | 橋梁点検DX |
| `tunnel` | トンネル点検DX |
| `road` | 道路舗装DX |
| `dam` | ダム監視DX |
| `slope` | 法面崩落検知DX |
| `water` | 上水道管理DX |
| `sewer` | 下水道管理DX |
| `river` | 河川管理DX |
| `port` | 港湾施設DX |

```bash
# 業種テンプレートで生成（テーマ自動設定）
scripts/create_project.sh water-mgmt --type water

# 生成前プレビュー
scripts/create_project.sh water-mgmt --type water --dry-run
```

### 2. 案件を管理する

```bash
# 全案件を一覧表示
scripts/manage_projects.sh list

# 特定案件の詳細確認
scripts/manage_projects.sh status bridge-inspection

# 横断サマリー統計
scripts/manage_projects.sh report

# 未記入プレースホルダを検出
scripts/manage_projects.sh check-placeholder
scripts/manage_projects.sh check-placeholder bridge-inspection

# 案件をアーカイブ（projects/.archive/ へ移動）
scripts/manage_projects.sh archive bridge-inspection

# アーカイブ済み案件を復元（projects/ へ戻す）
scripts/manage_projects.sh restore bridge-inspection

# 案件を削除（--force で確認プロンプトをスキップ）
scripts/manage_projects.sh delete bridge-inspection --force
```

### 3. ポートフォリオを生成する

```bash
# 静的HTML一覧を docs/portfolio/index.html に出力
scripts/generate_portfolio.sh

# 出力先を指定
scripts/generate_portfolio.sh --out /tmp/portfolio.html
```

→ `docs/portfolio/index.html` が生成されます。ブラウザで直接開いて確認できます。

### 4. 案件管理ダッシュボード（デザインプロトタイプ）を確認する

```bash
# ビルド不要・外部依存なし。ブラウザで直接開く
xdg-open docs/design-prototype/index.html
```

| 項目 | 内容 |
|---|---|
| 目的 | 8フェーズ進行・文書・出来形検査・承認・監査を横断で統制する画面の設計提示 |
| データ | **すべてダミー**（`case-management-mock.js`）。本番DB・実データへは接続しない |
| 認可 | `ROLE_PERMISSION`（`permissions`）のみで判定。ロール名での分岐はテストで禁止 |
| 監査 | 権限外の操作も `access_denied` として追記（append-only・セッション内のみ） |
| 承認 | `two_stage`（社内 → 発注者）。権限だけでなく**順番**も強制 |
| 検証 | `bats tests/design_prototype.bats`（46件） |

> ⚠️ プロトタイプであり本番実装ではありません。画面上の数値のうち実測値は
> `meta`（Foundation版・テスト件数・CI成功率）の3項目のみです。

### 5. WebUI（Cloudflare Workers デプロイ）

案件管理ダッシュボードの静的 HTML を Cloudflare Workers でホストしています。

```bash
# デプロイ（webui/deploy/）
cd webui/deploy && bash deploy.sh
```

| 項目 | 内容 |
|---|---|
| デプロイ先 | Cloudflare Workers (`ccabp-web`) |
| 公開URL | `https://ccabp.mirai-dx-platform.com` |
| ソース | `webui/Civil AI Build Console.html` (バンドル済み静的HTML) |
| 構成 | `wrangler.jsonc` (assets only / サーバーコードなし) |
| 管理 | `webui/` は gitignore 対象（インフラ固有・リポジトリ管理対象外） |

> ℹ️ WebUI はプラットフォームエンジン（bash）とは独立したデプロイです。
> エンジン本体の動作に Node.js / Cloudflare は不要です。

## 🔁 案件ライフサイクル (8 フェーズ)

フェーズ定義の正本は「Civil Construction AI Build Platform 設計たたき台.md」の P1〜P8（フェーズ一覧・全体対応マップ）とする。

| フェーズ | 内容 | 本基盤の対応 |
|---|---|---|
| P1 需要創出 | DXアイデアの起案・テーマ発掘・一次選別 | civil-domain-analyst |
| P2 重複確認・投資判断 | 既存資産との重複確認・企画化・承認 | （手動運用 — 支援ツール未提供） |
| P3 要件・設計 | 用語確定・要件定義・設計・セキュリティ/運用設計 | civil-domain-analyst, civil-ba, civil-solution-architect |
| P4 着手準備 | 命名・リポジトリ準備・案件スケルトン生成 | `create_project.sh`（本エンジン） |
| P5 モック・検証 | UIモック・受入検証・文書整備 | civil-ui-prototyper, civil-test-validator, civil-doc-curator |
| P6 本番移行 | 本番設計・構築・パイロット・段階展開 | （手動運用 — WebUI デプロイはユーザー実行） |
| P7 運用改善 | 運用・障害対応・改善・効果測定 | `manage_projects.sh`, `docs/operations.md` |
| P8 ポートフォリオ統制 | 四半期/年次レビュー・継続/統合/廃止判断 | `generate_portfolio.sh`, `manage_projects.sh archive` |

> ℹ️ 旧 README は P2/P4/P6/P7 を独自定義していたが、v0.7 で設計たたき台を正本として統一した。
> 文書整備（civil-doc-curator）は P5 受入前の活動、生成エンジン・CI の整備はフェーズ外の基盤活動として扱う。

## 🤖 エージェント

| エージェント | 責務 |
|---|---|
| `civil-domain-analyst` | 用語・業務前提・業務ルールの整理 |
| `civil-ba` | 要件定義・ユースケース・画面/帳票要件 |
| `civil-solution-architect` | API・データモデル・権限・監査ログ設計 |
| `civil-ui-prototyper` | ダミーデータ前提の UI モック設計 |
| `civil-test-validator` | 受入観点・検証シナリオ策定 |
| `civil-doc-curator` | P5 モック・検証の文書整備 — docs 統合・整合性確認・project-summary 作成 |

## 📁 ディレクトリ構成

| パス | 役割 |
|---|---|
| `scripts/create_project.sh` | 案件生成エンジン（--type / --list-types / --dry-run 対応） |
| `scripts/manage_projects.sh` | 案件横断管理 CLI（list / status / report / check-placeholder / archive / restore / delete） |
| `scripts/generate_portfolio.sh` | 全案件の静的HTML一覧生成 |
| `scripts/backup_projects.sh` | 案件バックアップ・検証・復元（backup / verify / restore / list） |
| `templates/project-skeleton/` | 案件スケルトン（雛形・v0.3 精緻化済み） |
| `tools/sync-mock-data.py` | mock/*.json → prototype/data.js 同期ツール |
| `shared-knowledge/domain-glossary/` | 共通ドメイン用語集 |
| `.claude/agents/` | 専門エージェント定義 |
| `.claude/commands/` | スラッシュコマンド |
| `tests/` | bats テスト（207件・8 suite） |
| `tests/helpers/dom-shim.js` | 外部依存ゼロの最小DOM（プロトタイプの統合検証用） |
| `docs/design-prototype/` | 案件管理ダッシュボードのデザインプロトタイプ |
| `docs/` | 運用・評価ドキュメントと生成物（`portfolio/index.html` は gitignore） |
| `projects/` | 生成された案件（gitignore） |
| `webui/` | WebUI デプロイ環境（gitignore / Cloudflare Workers 設定・HTML バンドル） |

## ✅ 品質ゲート

| ゲート | ツール | 実行 |
|---|---|---|
| Lint | shellcheck | CI で自動実行 |
| Test | bats (207件) | `bats tests/` / CI で自動実行 |
| CI | GitHub Actions (matrix) | push / PR で shellcheck + bats を並列実行 |

```bash
# ローカルで全チェックを実行
shellcheck scripts/*.sh
bats tests/
```

## 📦 Foundation バージョン履歴

| バージョン | 内容 | PR |
|---|---|---|
| **v0.7.1-dev** | Issue #32 P2 hardening — portfolio 制御文字/XSS防御、backup restore の traversal/absolute/symlink 拒否、create_project 置換 literal 化、非スクリプト文書の実行ビット修正、CI 対象に agent/** 追加、bats 201→207件 | 本PR |
| **v0.7** | 第1〜3段階評価・統制回復 — 18項目採点（50→56.8点）・P0統制4件修正（check_secrets fail-open / CSV injection / 報告経路 / バックアップCLI）・bats 29件追加（172→201件 / 7→8 suite）・ロードマップ Phase 0〜4 | #31 |
| **v0.6.1** | 本番運用整備 — .gitignore 整理・LICENSE 追加・webui デプロイ構成の文書化・SECURITY.md 更新・運用台帳記録 | #30 |
| **v0.6** | 案件管理ダッシュボード デザインプロトタイプ（`docs/design-prototype/`）・外部依存ゼロの DOM シムによる統合検証・bats 45件追加（127→172件 / 6→7 suite）・CodeRabbit 設定と運用コマンド取り込み | #26, #27 |
| **v0.5** | civil-doc-curator 追加 + 8フェーズ全通しドッグフーディング（dogfood_lifecycle.bats）・全テストをCIで実行（Feature I + J） | #20 |
| **v0.4** | 案件管理CLI（manage_projects.sh）・ポートフォリオ生成（generate_portfolio.sh）・業種別テンプレート（--type）・エージェント5種・コマンド2種（Feature A-H） | #13 |
| **v0.3** | テンプレ精緻化・業務本質を構造で強制（認可マトリクス・二段階承認・監査ログ網羅・prototype雛形・sync-mock-data.py） | #9 |
| **v0.2** | 専門エージェント3種追加（ba/solution-architect/test-validator）+ 設計テンプレ2種（機能仕様・データモデル） | #7 |
| **v0.1** | 案件生成エンジン・スケルトン・CI 基盤・bats テスト | #4 |

### 🔑 v0.3 主要変更点

生成スケルトンに以下が追加されました（templates/project-skeleton/ に反映済み）:

| 変更 | ファイル | 効果 |
|---|---|---|
| 認可マトリクス | `prototype/data.js` → `ROLE_PERMISSION` | ロール×アクション×スコープを構造で強制 |
| can() 参照統一 | `prototype/app.js` → `can()` | 権限チェックを単一箇所で管理 |
| esc() XSS 防御 | `prototype/app.js` → `esc()` | HTML出力を全てエスケープ |
| 二段階承認 | `mock/approvals.json` → `approval_mode: two_stage` | 社内・発注者の二段階を既定で有効化 |
| 監査ログ網羅 | `mock/audit_log.json` | update/master_change/access_denied + before/after を全網羅 |
| 出来形構造分離 | `mock/inspections.json` | measured_value/spec_value/tolerance/judgement の4属性を分離 |
| mock 同期ツール | `tools/sync-mock-data.py` | mock/*.json → prototype/data.js を冪等に一方向再生成 |

### 🔄 v0.3 mock 同期ツール

mock データを更新したら prototype/data.js に同期できます:

```bash
python3 tools/sync-mock-data.py --root projects/<案件名>/
```

## 🔐 制約（全案件共通）

- 本番DB接続禁止 / 実データ利用禁止 / 外部SaaS書込禁止。
- 実装は `mock/` `prototype/` `tests/` 配下で完結させる。
- 出来高と出来形、契約/設計/実績数量を混同しない（用語集参照）。

## 🛡️ セキュリティ・運用

| 文書 | 内容 |
|---|---|
| [SECURITY.md](SECURITY.md) | 脆弱性報告・セキュリティ方針 |
| [docs/operations.md](docs/operations.md) | リリース・ロールバック・バックアップ・復旧・監視・Runbook |
| [AGENTS.md](AGENTS.md) | AI エージェント（Codex / Claude）向けプロジェクト方針 |
