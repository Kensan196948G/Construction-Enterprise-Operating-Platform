# Changelog

All notable changes to Construction-DX-OS are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added (Loop 87-88, 2026-05-14 〜 2026-05-21)
- **GMSV0002 シリアル番号 OCR パイプライン** (Issue 0051 / PR #41)
  - `/api/v1/serial/*` 5 エンドポイント — status / scan / queue / confirm / discard
  - SMB マウント → easyocr → 展開台帳登録の完全フロー
  - HEIC (iPhone 標準形式) を pillow-heif で JPEG に変換して OCR
  - `[ocr]` optional deps で easyocr + pillow-heif を自動インストール化
  - Admin SPA に「ファイルサーバー連携」タブを追加
- **serial-scan キュー DB 永続化** (Issue 0052 / PR #43)
  - PostgreSQL `serial_scan_queue` テーブル + Alembic 0003 migration
  - `SerialScanStorage` Protocol (runtime_checkable) + PostgresStorage 実装
  - Protocol gate パターン: InMemoryStorage では in-memory dict にフォールバック
  - 再起動耐性: 確認待ちアイテムが cdx-server 再起動でも失われない
- **Prometheus メトリクス** (PR #44)
  - `cdx_serial_scan_total` counter (labels: event x backend = 6 series)
  - 確認率モニタリング用クエリ例を docstring に記載
- **Admin SPA 改善** (PR #44)
  - ファイルサーバー連携タブに「キューDB」カード追加 — PostgreSQL/In-Memory を視覚化

### Fixed (Loop 88, 2026-05-21)
- **CI workflow exitcode 隠蔽バグ** (PR #41)
  - `pytest ... | tail -N` がパイプ末尾の exit code に書き換わり、テスト失敗が CI 上で
    無視されていた。e2e + security scan ステップから `| tail` を除去
  - 隠蔽されていた ISO Builder E2E テストの 503 unsupported page 失敗 2 件を解消
    (InMemoryStorage では graceful unsupported response が正規 → 200/503 両許容)
- **conftest.py CDX_SERVER_URL 不一致** (PR #41)
  - `tests/frontend/conftest.py` のデフォルト URL が `192.168.0.185:8300` だったため、
    `test_webui_e2e.py` (`localhost:8000` デフォルト) と参照先がズレていた
  - `localhost:8000` に統一 + `server_reachable` に `service == "cdx-server"` 検証を追加
- **PYSEC-2025-183 (PyJWT) disputed CVE** (PR #41)
  - サプライヤー (PyJWT) が「鍵長はアプリ側責任」として争っている disputed CVE
  - `pip-audit --ignore-vuln PYSEC-2025-183` + pytest テスト側で除外
  - CI で `pip-audit --skip-editable --ignore-vuln PYSEC-2025-183` を採用

### Changed (Loop 88)
- ルート `pyproject.toml` 追加 (PR #45) — pytest-asyncio deprecation 警告抑止 +
  `filterwarnings = ["error", ...]` で将来の non-third-party deprecation を強制可視化

### Planned (Month 5–6 Stabilize & Release)
- E2E Playwright test suite (ISO builder UI flow) — Issue 0047 partial done
- v0.2.0: PXE Phase 4.6 実機リハーサル (5-device BIOS/UEFI validation)
- GMSV0002 実機 SMB マウント + easyocr 本番テスト (Issue 0051)
- MinIO production credentials & backup automation

---

## [0.1.0] - 2026-05-13

**MVP Release Candidate** — 全10条件クリア (Loop 84)

### Summary

建設DX OS の最初のリリース候補です。
中央管理サーバー・クライアントエージェント・ISO ビルダー・PXE 配布・Admin WebUI の
フルスタック機能を備えた建設会社向けクライアント OS 管理基盤です。

### Added

#### Core Infrastructure
- `cdx-agent`: インベントリ収集・ハートビート・ポリシー同期・HMAC署名 API クライアント
- `cdx-server`: FastAPI ベースの中央管理サーバー (asyncio + uvicorn)
- PostgreSQL ストレージ (asyncpg + Alembic マイグレーション)
- InMemoryStorage による開発環境向けゼロ依存モード
- Docker Compose + systemd ユニット (cdx-os-server on :8300)

#### Authentication & Security
- HMAC-SHA256 署名によるエージェント・サーバー間認証
- Admin HTTP Basic Auth (`CDX_ADMIN_PASSWORD`)
- OIDC Bearer Token 認証 (Keycloak 互換)
- CSP nonce ミドルウェア (`unsafe-inline` 排除)
- Redis スライディングウィンドウ + トークンバケット二重レート制限
- 監査ログ (request-id 連鎖 / actor / action)
- pip-audit: Known CVE ゼロ / bandit HIGH=0

#### Admin WebUI
- デバイス一覧・詳細・検索/フィルター・ハートビート鮮度バッジ
- ISO ビルドジョブ 一覧・詳細・SSE ライブログ・ダウンロードボタン
- PXE Rollback コンソール (6パターン切替)
- Admin SPA (React/JSX プリビルド, self-hosted, CSP準拠)
- Jinja2 SSR テンプレートベース

#### ISO Builder
- `POST /api/v1/iso-builds` — profile別ジョブ投入 (admin/standard/field/kiosk)
- Redis Queue (RQ) 非同期ワーカー (`CDX_WORKER_MOCK=1` でモック動作)
- SSE ログストリーミング (`GET /api/v1/iso-builds/{id}/log`)
- MinIO/S3 presigned URL ダウンロード (`GET /api/v1/iso-builds/{id}/download`)
- ビルド監査ログ (`iso_build_audit` テーブル)
- Prometheus メトリクス (`cdx_iso_build_total{profile,status}`)

#### PXE Distribution
- dnsmasq + TFTP + pxelinux.0 (BIOS) + grubnetx64.efi (UEFI Secure Boot)
- profile 別 preseed (field/office/lab/kiosk)
- agent-bootstrap.sh: PXE 起動後の cdx-agent 自動インストール
- 登録トークン API (ephemeral tokens + device token rotation)
- PXE ブートイベント Prometheus カウンター + ヒストグラム
- Grafana PXE ブートアラートルール
- Rollback スクリプト (6パターン: BIOS→pxe/pxe-uefi/local/…)

#### Monitoring & Operations
- Prometheus `/metrics` エンドポイント (JSON logs + request-id)
- Grafana ダッシュボード provisioning
- Grafana Unified Alerting (heartbeat停止 + ISO build失敗率)
- PostgreSQL 永続化 (systemd cdx-os-server)
- OpenAPI spec 自動生成 (`scripts/generate_openapi.py`)
- SDK 自動生成 (Python + TypeScript)

#### Testing & Quality
- **313 テスト** (unit / integration / contract / security / infra / E2E)
- **行カバレッジ 98.76%** (`--cov-fail-under=85` CI ゲート)
- pytest-benchmark: 4 パフォーマンス回帰テスト
- Playwright E2E テスト (27 シナリオ)
- test pyramid: backend / security / database / frontend / infrastructure の5カテゴリ
- ruff lint: All checks passed
- GitHub Actions: 9 jobs green

#### Documentation
- `README.md`: 6ヶ月計画・アーキテクチャ・セットアップ・API一覧
- `deployment/`: PostgreSQL・Grafana・監視・バックアップ手順
- `docs/`: 5方式配布設計・ISO Builder UI 設計・PXE 仕様
- `CONTRIBUTING.md`: 開発フロー・Issue ルール

### Changed
- ストレージバックエンドを `DATABASE_URL` による自動選択に変更 (Phase 2)
- `GET /` → `/admin` 302 リダイレクト

### Fixed
- asyncpg `env.py` の Alembic 設定 (Issue 0032)
- CSP unsafe-inline を nonce ベースに置換 (Issue 0044)
- asyncio test warning 抑制 (Issue 0034)
- ISO download 監査ログ漏れ修正 (Issue 0038)

### Security
- python-jose → python-jwt 移行 (Issue 0017)
- bcrypt パスワードハッシュ (Issue 0018)
- CSP nonce による XSS 対策強化 (Loop 77)
- Admin SPA を CDN 依存から self-hosted に移行 (PR #38)

---

## Pre-release History

### Phase 1 — Bootstrap & Core Agent/Server (2026-04-15 — 2026-04-22)

- リポジトリスケルトン + ClaudeOS v8 設定
- cdx-agent MVP (インベントリ・ハートビート・設定・CLI)
- cdx-server FastAPI MVP (HMAC 検証)
- CI: GitHub Actions (ruff + pytest)
- exponential backoff + full-jitter retry
- observability layer (request-id + JSON ログ + /metrics)
- AppArmor profile + docker-compose

### Phase 2 — Storage & Auth (2026-04-22 — 2026-04-28)

- PostgreSQL + Alembic マイグレーション
- Storage Protocol (type-safe swap)
- Admin HTTP Basic Auth
- Redis rate limiting (Phase 4a/4b)
- OIDC auth proto (Phase 5)

### Phase 3 — WebUI & Quality (2026-04-28 — 2026-05-06)

- Admin WebUI (Jinja2 SSR: devices/iso-builds/detail)
- ISO Builder API + RQ worker + SSE log + MinIO
- OpenAPI spec + SDK 自動生成
- Grafana ダッシュボード + アラートルール
- PostgreSQL systemd 永続化
- カバレッジゲート 85% + GitHub Step Summary

### Phase 4 — PXE & Security Hardening (2026-05-06 — 2026-05-13)

- PXE 配布インフラ (Phase 4.1–4.5)
- 登録トークン API
- PXE Rollback WebUI
- test pyramid (5カテゴリ × 313 tests)
- CSP nonce ミドルウェア
- Admin SPA プリビルド (esbuild, self-hosted React)
- MVP Release Candidate ✅ 全10条件クリア

---

[Unreleased]: https://github.com/Kensan196948G/Construction-DX-OS/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Kensan196948G/Construction-DX-OS/releases/tag/v0.1.0
