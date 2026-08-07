# CEOP 本番運用 Runbook

## 1. 構成

- アプリ: Node.js 22+ / TypeScript（ランタイム依存ゼロ）
- 永続化: SQLite（WAL、コンテナ内 `/data/ceop.db`）
- 配布: Docker イメージ（GHCR `ghcr.io/kensan196948g/construction-eop:0.6.2` / ローカル `ceop-platform:v0.6.2`）
- ヘルス: `GET /health`（liveness）、`GET /health/ready`（readiness）
- ログ: stdout/stderr（Docker 既定の json-file。**ホストにローテーション設定なし** — 下記「既知の差分」参照）

### 本番環境（2026-08-07 現在）

| 項目 | 値 |
|---|---|
| URL | https://ceop.mirai-dx-platform.com |
| ホスト | 192.168.0.185（LAN） |
| 起動方式 | **`docker run`**（compose 管理下ではない。§6 参照） |
| コンテナ | `ceop-platform`（`--restart unless-stopped`、127.0.0.1:3120→3000） |
| イメージ | `ceop-platform:v0.6.2`（可動エイリアス `ceop-platform:current` が同一 ID を指す） |
| トンネル | Cloudflare Tunnel `ceop`（systemd: `cloudflared-ceop.service`） |
| DB | ホスト `/home/kensan/.ceop/data/ceop.db` を `/data` へ bind mount |
| 環境変数 | `/home/kensan/.ceop/.env`（chmod 600、`--env-file` で読み込み） |
| 認証情報 | `/home/kensan/.ceop/*-credential.txt`（chmod 600） |
| バックアップ | cron 02:15 JST → `/home/kensan/.ceop/backups/` |
| ヘルス確認 | cron 02:30 JST → 失敗時のみ `/home/kensan/.ceop/health.log` へ追記 |

### イメージタグの運用

| タグ | 役割 |
|---|---|
| `ceop-platform:vX.Y.Z` | 不変タグ。rollback と監査の基準。**prune しない** |
| `ceop-platform:current` | 可動エイリアス。稼働中バージョンを指す。cron などの自動処理が参照する |

デプロイのたびに `docker tag ceop-platform:vX.Y.Z ceop-platform:current` を実行する（§3 手順に含む）。これにより、バックアップ cron がリリースごとのタグ更新を必要としなくなる。

## 2. デプロイ手順（初回）

```bash
# 1. シークレット生成（値は Secrets 管理へ。画面・ログ・Git へ出さない）
openssl rand -hex 32   # CEOP_JWT_SECRET

# 2. 環境変数ファイル作成（chmod 600）
#    .env.example を複製し CEOP_JWT_SECRET / CEOP_SQLITE_FILE 等を設定
install -m 600 /dev/null /home/kensan/.ceop/.env

# 3. データディレクトリ作成（コンテナの ceop ユーザー uid/gid 1001 が書けること）
mkdir -p /home/kensan/.ceop/data

# 4. イメージ取得
docker pull ghcr.io/kensan196948g/construction-eop:0.6.2
docker tag  ghcr.io/kensan196948g/construction-eop:0.6.2 ceop-platform:v0.6.2

# 5. マイグレーション（bind mount に対して実行）
docker run --rm -v /home/kensan/.ceop/data:/data \
  --env-file /home/kensan/.ceop/.env \
  ceop-platform:v0.6.2 \
  node --experimental-strip-types scripts/migrate.ts

# 6. API キー発行（出力は Secrets 管理へ。標準出力を残さない）
docker run --rm -v /home/kensan/.ceop/data:/data \
  --env-file /home/kensan/.ceop/.env \
  ceop-platform:v0.6.2 \
  node --experimental-strip-types scripts/provision-api-key.ts \
  --subject admin --permissions "*:*"

# 7. 起動
docker tag ceop-platform:v0.6.2 ceop-platform:current
docker run -d \
  --name ceop-platform \
  --restart unless-stopped \
  -p 127.0.0.1:3120:3000 \
  --env-file /home/kensan/.ceop/.env \
  -v /home/kensan/.ceop/data:/data \
  ceop-platform:v0.6.2

# 8. 確認（コンテナは loopback:3120 のみで listen。公開は Tunnel 経由）
docker inspect ceop-platform --format '{{.State.Health.Status}}'
curl -fsS https://ceop.mirai-dx-platform.com/health
curl -fsS https://ceop.mirai-dx-platform.com/health/ready
```

`-p 127.0.0.1:3120:3000` の loopback 指定は必須。`0.0.0.0` で公開すると Cloudflare Tunnel を迂回した LAN 直アクセスが可能になり、Cloudflare 側のアクセス制御が効かなくなる。

## 3. 更新手順

```bash
NEW=v0.6.3   # 例

# 1. バックアップ（VACUUM INTO。手順は BACKUP_RESTORE.md）
docker run --rm -v /home/kensan/.ceop/data:/data -v /home/kensan/.ceop/backups:/backups \
  ceop-platform:current node --experimental-strip-types scripts/sqlite-backup.ts \
  /data/ceop.db "/backups/ceop-predeploy-${NEW}-$(date -u +%Y%m%dT%H%M%SZ).db"

# 2. 新イメージ取得（またはローカルビルド）
docker pull ghcr.io/kensan196948g/construction-eop:${NEW#v}
docker tag  ghcr.io/kensan196948g/construction-eop:${NEW#v} ceop-platform:${NEW}

# 3. migration（スキーマ変更を含むリリースのみ。冪等なので実行して差し支えない）
docker run --rm -v /home/kensan/.ceop/data:/data --env-file /home/kensan/.ceop/.env \
  ceop-platform:${NEW} node --experimental-strip-types scripts/migrate.ts

# 4. 旧コンテナを停止し、rollback 用に rename して残す（削除しない）
docker stop ceop-platform
docker rename ceop-platform ceop-platform-prev

# 5. 新バージョン起動
docker run -d --name ceop-platform --restart unless-stopped \
  -p 127.0.0.1:3120:3000 --env-file /home/kensan/.ceop/.env \
  -v /home/kensan/.ceop/data:/data ceop-platform:${NEW}
docker tag ceop-platform:${NEW} ceop-platform:current

# 6. 確認
docker inspect ceop-platform --format '{{.State.Health.Status}}'   # healthy になるまで待つ
curl -fsS https://ceop.mirai-dx-platform.com/api/v1/info           # version が ${NEW#v} であること
```

7. スモークテスト（トークン取得 → 監査ログ取得 → 主要 CRUD 一覧 → SSR 画面）を実施。異常があれば §4 の rollback へ。
8. 正常確認後、`docker rm ceop-platform-prev` で旧コンテナを片付ける。**旧イメージ `ceop-platform:vX.Y.Z` は消さない。**

ダウンタイムは手順 4〜5 の数秒。無停止が必要になった段階で、別ポートに新バージョンを立ててから Tunnel の向き先を切り替える方式へ変更する（現時点では未実装）。

## 4. Rollback

コンテナ差し替えのみで戻せる。DB は bind mount で共有しており、migration は additive・後方互換方針のため、通常はデータ操作を伴わない。

```bash
OLD=v0.6.1

# 直前コンテナが残っている場合（最速・数秒）
docker rm -f ceop-platform
docker rename ceop-platform-prev ceop-platform
docker start ceop-platform

# 残っていない場合はイメージから再作成
docker rm -f ceop-platform
docker run -d --name ceop-platform --restart unless-stopped \
  -p 127.0.0.1:3120:3000 --env-file /home/kensan/.ceop/.env \
  -v /home/kensan/.ceop/data:/data ceop-platform:${OLD}
docker tag ceop-platform:${OLD} ceop-platform:current

curl -fsS https://ceop.mirai-dx-platform.com/api/v1/info
```

- DB を戻す必要がある場合のみ `BACKUP_RESTORE.md` の復元手順を使う（コンテナ停止が前提）
- 判断基準: `/health/ready` 5xx が 3 回以上、エラー率 > 5%、認証不能、監査ログ異常
- rollback 後の自動再デプロイを無制限に繰り返さない。原因・影響・再開条件を運用台帳へ記録する

## 5. インシデント対応

1. 影響確認（ヘルス、ログ、DB、ネットワーク）
2. 切り分け（アプリ / DB / ネットワーク / 設定 / Tunnel）
3. 対応（rollback / 再起動 / リストア）— 作業ログを運用台帳へ記録
4. 復旧確認（health/ready + スモーク）
5. 事後報告（原因、影響範囲、再発防止、対応時刻）

重大（P0）: データ漏えい・破損・認証全停止 → `SECURITY_RESPONSE.md` の手順を最優先。

Tunnel 側の切り分け:

```bash
systemctl status cloudflared-ceop.service
journalctl -u cloudflared-ceop.service -n 50 --no-pager
```

## 6. compose への切替（未実施）

`docker-compose.prod.yml` は、実運用中のコンテナと同一のトポロジ（`container_name` / bind mount / loopback bind / ポート）を再現するよう合わせてある。加えて `read_only` / `cap_drop: ALL` / `no-new-privileges` / memory・cpu・pids 制限 / ログローテーションのハードニングを含む（2026-08-07 に v0.6.2 イメージで起動検証済み）。

現在の本番コンテナは compose 管理下にない。確認方法:

```bash
docker inspect ceop-platform --format '{{json .Config.Labels}}'
# com.docker.compose.project / .service / .config-hash が無ければ compose 管理外
```

このため `docker compose -f docker-compose.prod.yml stop` は一致するコンテナを見つけられず、静かに no-op で終わる。**実機は止まらない。**

切替手順（実施時は別途 PR で計画・承認を得る）:

```bash
# 1. バックアップ取得（§3 手順 1）
# 2. 既存コンテナを停止・rename（削除しない）
docker stop ceop-platform && docker rename ceop-platform ceop-platform-prev
# 3. compose で起動（必須変数は未設定ならエラー停止する）
cd <repo>
CEOP_IMAGE=ceop-platform:v0.6.2 CEOP_DATA_DIR=/home/kensan/.ceop/data \
  docker compose -f docker-compose.prod.yml --env-file /home/kensan/.ceop/.env up -d
# 4. 検証後、labels に com.docker.compose.* が付いていることを確認
docker inspect ceop-platform --format '{{index .Config.Labels "com.docker.compose.project"}}'
```

切替後は本 Runbook の §3 / §4 を compose 版へ差し替える。

### 既知の差分（compose 未適用のため本番に効いていない設定）

| 設定 | compose | 実運用（docker run） |
|---|---|---|
| `read_only` rootfs | 有効 | **無効** |
| `cap_drop: ALL` | 有効 | **無効** |
| `no-new-privileges` | 有効 | **無効** |
| memory / cpu / pids 制限 | 有効 | **無制限** |
| ログローテーション | 10 MiB × 3 | **無制限**（`/etc/docker/daemon.json` 未設定） |

これらは compose 切替、または `docker run` に同等オプションを追加することで解消する。切替まではリスクとして受容している（単一ホスト・LAN 内・Tunnel 経由のみの公開のため）。
