# Release Notes v0.1.3（プロセス役割別の本番設定検証）

公開日: 2026-08-07

## 目的

v0.1.2 の本番デプロイで、worker と scheduler が起動不能になった。原因は
v0.1.1 で追加した本番設定バリデータが、受信 HTTP リクエストを扱わない
プロセスにまで Cloudflare Access の設定を要求していたことにある。

本リリースは、この不整合を「compose に変数を足す」対症療法ではなく、
**プロセスの役割を設定検証の一部として表現する**ことで解消し、
配線ミス自体を CI で検出できるようにする。

インシデントの詳細は
[docs/assessment/2026-08-07-v0.1.2-deploy-incident-app-role.md](../assessment/2026-08-07-v0.1.2-deploy-incident-app-role.md)
を参照。

## 変更内容

### 本番設定検証（P0）

- **P0 修正: worker / scheduler / migrate が本番で起動できない**
  `Settings` へ `app_role`（既定 `"api"`）を追加。`CLOUDFLARE_ACCESS_AUD` /
  `CLOUDFLARE_ACCESS_ISSUER` / `GITHUB_WEBHOOK_SECRET` の必須判定を、
  受信リクエストを扱う `api` 役割に限定した。`SECRET_KEY` と `DATABASE_URL` の
  検証は全プロセス共通のまま維持する。

  未知の `APP_ROLE` は fail-closed とし、api 相当の検証を適用したうえで
  設定ミスとして拒否する（タイポによる検証の無効化を防ぐため）。

- **`compose.yaml`: worker / scheduler / migrate に `APP_ROLE` を明示**
  値はリテラルで記述している（`${APP_ROLE:-worker}` ではない）。役割は
  プロセスの定義であって環境ごとの設定ではなく、`.env` から上書きされて
  api が検証を緩めてしまう事故を構造的に防ぐため。

### テスト

- `tests/test_compose_config.py` を新規追加。`compose.yaml` を解析し、
  API イメージから起動する全サービスについて「`APP_ROLE` が既知」かつ
  「`api` 役割なら必須 3 変数が配線済み」であることを CI で強制する。
  今回壊れていたのは検証ロジックではなく配線であり、`config.py` の
  単体テストでは検出できないため。
- `tests/test_hardening.py` へ役割別検証の回帰テストを追加（6 ケース）。
  非 api 役割でも共通検証（`SECRET_KEY` / `DATABASE_URL`）が緩まないことを含む。
- 開発依存へ `PyYAML` を明示追加（推移的依存に頼らないため）。

### バージョン

- `__version__` および `apps/web/package.json` を `0.1.3` へ更新。

## 影響範囲

| 対象 | 影響 |
| --- | --- |
| API の動作 | なし（`app_role` 既定値 `"api"` で従来と同一の検証） |
| worker / scheduler / migrate | 本番で起動可能になる |
| DB スキーマ | 変更なし（migration ゼロ、`0003` のまま） |
| 秘密情報 | 追加・変更・ローテーションなし |
| 公開 DNS / ルート / 認証方式 | 変更なし |

## 対象外

- v0.1.2 デプロイ時に露出したリポジトリ設定の課題（default branch / auto-merge /
  Branch Protection）は引き続きユーザー判断事項。
- 本番ホストの未使用 `dx-atlas-db` コンテナの停止判断。
- 開発環境 Python 3.13 と CI / 本番 3.12 の差異。

## デプロイ方法

同一イメージから起動する 4 サービスを**まとめて**ビルド・再作成する
（一部だけの更新がコード世代の分岐を生み、今回の障害の根本要因となったため）。

```bash
DOCKER_BUILDKIT=0 docker compose build api worker scheduler web migrate
docker compose up -d api worker scheduler web
docker compose ps      # 全サービスが healthy であることを確認
```

`DOCKER_BUILDKIT=0` は本番ホストの BuildKit ビルドネットワークで名前解決が
失敗するための回避策（レガシービルダーはホストの DNS 経路を使う）。

## rollback 方法

デプロイ前に稼働中イメージをタグで固定し、異常時はそれへ戻す。

```bash
# デプロイ前（必須）
for s in api worker scheduler web; do
  docker tag "$(docker inspect -f '{{.Image}}' "$(docker compose ps -q $s)")" \
             "dx-project-atlas-$s:rollback-v0.1.2"
done

# 異常時
for s in api worker scheduler web; do
  docker tag "dx-project-atlas-$s:rollback-v0.1.2" "dx-project-atlas-$s:latest"
done
docker compose up -d --no-build --force-recreate api worker scheduler web
```

DB の rollback は不要（migration ゼロ）。
