# Release Notes v0.1.2（DR 復旧性・リリース衛生）

公開日: 2026-08-07

## 目的

v0.1.1 まで「文書上は整備済み」とされていた災害復旧（DR）が、実際には
**バックアップから復元できない状態**であったことが実復元試験で判明した。
本リリースはこれを解消し、以後同じ状態へ戻らないよう検証を自動化する。
併せて、稼働中のバージョンをリリースと突き合わせられない問題を解消する。

## 変更内容

### DR・バックアップ（P0）

- **P0 修正: バックアップから復元できない**
  `pg_dump` に `--no-owner --no-acl` が付いていなかったため、Neon 固有ロール
  （`neondb_owner` / `cloud_admin` / `neon_superuser`）への `ALTER ... OWNER TO` /
  `GRANT` がダンプへ埋め込まれ、同名ロールを持たない復元先で `ON_ERROR_STOP` により
  復元が中断していた。`backup.sh` へオプションを追加し、`restore.sh` 側にも
  旧ダンプ救済用の除去処理（`ALTER DEFAULT PRIVILEGES` を含む）を実装。

- **P0 修正: 空・途中切断バックアップの黙殺**
  `pg_dump` が失敗しても `gzip` が空入力を圧縮し、20 バイトの「バックアップ」が
  正規名で残っていた。保持期間削除は良否を区別しないため、気付かないまま
  空ファイルだけが蓄積し得た。一時ファイル（`.partial`）へ書き、
  (1) `gzip -t` (2) `-- PostgreSQL database dump complete` マーカー
  (3) `COPY public.` 行の存在 — の 3 点を満たした場合のみ原子的に採用する方式へ変更。
  未達時は非ゼロ終了しファイルを残さない。

- **P1 修正: 停止済みコンテナへの `docker compose exec`**
  `docker compose ps -q db` は停止済みコンテナにも一致するため、`--status running` を追加。
  併せて `PG_DUMP_CMD` を明示指定した場合はそれを優先。

- **P1 修正: `--dry-run` の誤った安心**
  gzip 整合性のみを見ており「壊れていないが復元できない」ダンプを通していた。
  完了マーカー検証を追加し、復元可否は別スクリプトで確認する旨を出力。

- **追加: `scripts/restore-verify.sh`（実復元試験）**
  使い捨ての `postgres:17-alpine` へ実際に復元し、テーブル数・`alembic_version`・
  中核テーブルの行数を検証して所要時間を出力する。本番 DB へは接続しない。

- **P1 修正: 復元先接続文字列の平文出力**
  `restore.sh` が資格情報を含む URL をそのまま表示していたためマスク処理を追加。

- **P1 修正: `.env` が注入済み環境変数を上書き**
  systemd / CI / Secrets 経由で注入した値をディスク上の `.env` が黙って上書きし、
  preview と production の取り違えを招き得た。dotenv 慣行どおり
  「既存の環境変数を優先」へ反転（強制上書きは `ENV_FILE_OVERRIDE=1`）。
  `restore.sh` の `.env` 探索がカレントディレクトリ依存だった点も修正。

### リリース衛生（P1）

- **稼働バージョンが識別できない問題を解消**
  v0.1.1 のタグと GitHub Release を公開したにもかかわらずコード側が `0.1.0` のままで、
  `/api/v1/health` の返すバージョンで稼働リリースを特定できなかった。
  `apps/api/app/__init__.py` の `__version__` を唯一の情報源とし、
  `pyproject.toml` は hatchling の dynamic version で参照、
  `apps/web/package.json` を一致させた（本リリースで `0.1.2`）。
- 回帰防止として `tests/test_version.py`（5 件）を追加。semver 形式、
  pyproject の dynamic 設定、web/API のバージョン一致、health エンドポイントと
  OpenAPI の返却値を検証する。

### CI（P1）

- **e2e ジョブが恒常的に失敗していた問題を解消**
  Playwright は `5 passed` で成功していたにもかかわらず、`astral-sh/setup-uv@v5` の
  後処理（`uv cache prune`）が 300 秒で `exit 2` となり job 全体が失敗していた
  （2026-08-06、08-07 の 2 回で再現）。背景起動した dev サーバを明示的に停止する
  ステップを追加し、併せて e2e ジョブでは `prune-cache: false` として、成果物に
  影響しない後処理が成否判定へ波及しないようにした。

### 文書（P2）

- `.env.example` に実装で参照している未記載変数を追加
  （`APP_NAME` / `DB_PORT` / `ATLAS_DB_URL` / `API_PORT` / `WEB_PORT` / `WEB_BIND` /
  `GITHUB_TOKEN` / `WEBHOOK_MAX_BODY_BYTES`）。
  CI のみが使う `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` は
  「アプリサーバへ置かない変数」として除外理由を明記。
- バックアップ・リストア手順書を全面改訂（スクリプトの役割分担、採用前検証の仕組み、
  復元試験の実施記録、RPO/RTO 達成状況）。
- README の既知の問題を実態へ更新（OI-003 を解消済みへ、OI-005 に実測値を反映）。

## 検証

| 項目 | 結果 |
| --- | --- |
| Backend ruff check / ruff format / mypy | PASS |
| Backend pytest | PASS（61 passed, 3 skipped） |
| Frontend eslint / vitest / vite build | PASS（19 tests） |
| pip-audit（CI と同一手順） | PASS（既知脆弱性なし） |
| pnpm audit --prod / --audit-level=critical | PASS |
| Secret scan（CI と同一パターン） | PASS |
| 復元試験（`restore-verify.sh`） | PASS（17 テーブル / 版数 0003 / 復元 1s） |
| バックアップ失敗時の挙動（接続不能・途中切断の 2 系統を注入） | PASS（非ゼロ終了・ファイル残存なし） |
| CI（GitHub Actions） | マージ前後に確認 |

## 対象外・残課題

- Neon PITR 契約内容の確認と保持期間の文書化（OI-005 の残り）
- リポジトリ設定（default branch が `phase1-mvp`、`allow_auto_merge` 無効、
  `master` の Branch Protection 未設定）は設定変更としてユーザー判断が必要
- 開発環境の Python が 3.13、CI / Dockerfile が 3.12 という差異（実害未確認）
- 本番ホストで `dx-atlas-db` コンテナが稼働しているが API は Neon を参照しており未使用
- `APP_ACCESS_TOKEN` の無効化、GitHub App 導入（OI-001）、Private 閲覧ポリシー（OI-002）は
  従来どおり保留
