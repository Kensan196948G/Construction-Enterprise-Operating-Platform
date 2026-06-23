# Contributing to 建設DX OS

ご参加ありがとうございます。このドキュメントは開発環境のセットアップからテスト実行、プルリクエスト作成までの手順をまとめています。

## 目次

- [前提条件](#前提条件)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [テストの実行](#テストの実行)
- [コードスタイル](#コードスタイル)
- [ブランチ・PR 戦略](#ブランチpr-戦略)
- [Issue の作成](#issue-の作成)
- [ディレクトリ構成](#ディレクトリ構成)

---

## 前提条件

| 必須 | バージョン |
|---|---|
| Python | ≥ 3.11 |
| Git | 任意の最新版 |
| Docker / Docker Compose | Phase 2 以降 (Postgres) |
| Java (JRE) | SDK 生成に使用 (`make sdk`) — 任意 |

---

## 開発環境のセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/<your-org>/construction-dx-os.git
cd construction-dx-os
```

### 2. 仮想環境のセットアップ (推奨: 一発コマンド)

```bash
make dev-install
```

これにより以下が作成されます:

| venv パス | 対象パッケージ | 用途 |
|---|---|---|
| `agent/.venv/` | `agent/cdx_agent[dev]` | cdx-agent 開発 |
| `server/api/.venv/` | `server/api[dev]` | cdx-server 開発 |

### 3. venv のアクティブ化

```bash
# server 開発時
source server/api/.venv/bin/activate

# agent 開発時
source agent/.venv/bin/activate
```

### 4. 手動セットアップ (個別に行う場合)

```bash
# agent venv
python3 -m venv agent/.venv
agent/.venv/bin/pip install --upgrade pip
agent/.venv/bin/pip install -e "agent/cdx_agent[dev]"

# server venv
python3 -m venv server/api/.venv
server/api/.venv/bin/pip install --upgrade pip
server/api/.venv/bin/pip install -e "server/api[dev]"
```

### 5. 環境変数の確認

```bash
cp .env.example .env
# .env を開いて以下を設定 (Docker Compose 使用時):
#   CDX_REGISTRATION_TOKEN=<python3 -c "import secrets; print(secrets.token_hex(32))">
#   POSTGRES_PASSWORD=<python3 -c "import secrets; print(secrets.token_hex(32))">
```

主要な環境変数一覧:

| 変数 | 必須 | デフォルト | 説明 |
|---|---|---|---|
| `CDX_REGISTRATION_TOKEN` | ✅ | — | デバイス登録 Bearer Token |
| `DATABASE_URL` | — | (InMemory) | PostgreSQL 接続 URL |
| `CDX_DB_POOL_SIZE` | — | 5 | PG 接続プールサイズ |
| `CDX_DB_MAX_OVERFLOW` | — | 10 | プール超過許容数 |
| `CDX_DB_POOL_RECYCLE` | — | 300 | 接続再作成間隔 (秒) |
| `CDX_DB_POOL_TIMEOUT` | — | 30 | 接続取得タイムアウト (秒) |
| `CDX_ADMIN_TOKEN` | — | (dev bypass) | Admin UI Basic Auth Token |
| `AUTH_BACKEND` | — | `basic` | `basic` / `oidc` / `ldap` |
| `REDIS_URL` | — | (InMemory) | Redis rate-limit バックエンド |

---

## テストの実行

### 全テスト (推奨)

```bash
make test
```

| パッケージ | テスト数 | 実行時間目安 |
|---|---|---|
| cdx-agent | 114 件 | < 1s |
| cdx-server | 134 件 | ~2.5s |
| **合計** | **248 件** | **~4s** |

### 個別実行

```bash
# agent
cd agent/cdx_agent && pytest tests/ -v

# server
cd server/api && pytest tests/ -v

# 特定テストのみ
cd server/api && pytest tests/test_sdk_smoke.py -v
```

### テストカバレッジ

```bash
cd server/api && pytest tests/ --cov=cdx_server --cov-report=term-missing
```

---

## コードスタイル

### Lint チェック

```bash
make lint
```

`ruff` を使用しています。設定は各パッケージの `pyproject.toml` の `[tool.ruff]` セクションを参照してください。

### 自動修正

```bash
# agent
cd agent/cdx_agent && ruff check cdx_agent tests --fix

# server
cd server/api && ruff check cdx_server tests --fix
```

### スタイル方針

- 行長: 100 文字
- ターゲット Python: 3.11+
- Import ソート: `ruff` I ルール (isort 互換)
- コード内コメントは英語可、ドキュメントは日本語

---

## ブランチ・PR 戦略

| ルール | 詳細 |
|---|---|
| `main` 直 push | **禁止** |
| ブランチ命名 | `feat/issue-NNN-short-desc` / `fix/issue-NNN-short-desc` |
| PR 必須 | CI 通過 + Codex / CodeRabbit レビュー後にマージ |
| コミットメッセージ | `feat(scope): ...` / `fix(scope): ...` / `improve(scope): ...` 形式 |

### PR 本文の最低限

```markdown
## 変更内容
- ...

## テスト結果
- pytest: NNN passed

## 影響範囲
- ...

## 残課題
- ...
```

---

## Issue の作成

| 優先度 | 対象 | 例 |
|---|---|---|
| P1 | CI / セキュリティ / データ破損 | 認証バイパス、DB 移行失敗 |
| P2 | 品質 / UX / テスト不足 | SDK drift、UI 表示崩れ |
| P3 | 軽微改善 | ドキュメント誤字、軽微リファクタ |

Issue ファイルは `claudeos/issues/NNNN-short-title.md` に作成します（GitHub remote 接続前の暫定管理）。

---

## ディレクトリ構成

```
construction-dx-os/
├── agent/
│   ├── .venv/                  # make dev-install で生成 (gitignore)
│   └── cdx_agent/
│       ├── cdx_agent/          # Python パッケージ
│       ├── tests/              # pytest テスト
│       └── pyproject.toml
├── server/
│   └── api/
│       ├── .venv/              # make dev-install で生成 (gitignore)
│       ├── cdx_server/         # FastAPI アプリ
│       ├── tests/              # pytest テスト
│       └── pyproject.toml
├── sdk/
│   ├── python/                 # 生成 Python SDK (make sdk-py)
│   └── typescript/             # 生成 TypeScript SDK (make sdk-ts)
├── claudeos/
│   ├── issues/                 # ローカル Issue 管理
│   └── state.json              # 自律開発状態管理
├── Makefile                    # dev-install / test / lint / sdk
└── CONTRIBUTING.md             # 本ファイル
```

---

## SDK の再生成

```bash
# openapi.json + 両 SDK を一括生成
make sdk

# openapi.json のみ
make openapi

# CI での整合性チェック
make sdk-check
```

生成された SDK は `sdk/python/` と `sdk/typescript/` に出力されます。Java JRE が必要です (`openapi-generator-cli`)。

---

## ご不明な点

Issue または Pull Request でお気軽にご質問ください。
