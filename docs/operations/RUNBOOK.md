# CEOP 本番運用 Runbook

## 1. 構成

- アプリ: Node.js 22+ / TypeScript（ランタイム依存ゼロ）
- 永続化: SQLite（WAL、コンテナ内 `/data/ceop.db`）
- 配布: Docker イメージ（GHCR `ghcr.io/kensan196948g/construction-eop:0.8.1` / ローカル `ceop-platform:v0.8.1`）
- ヘルス: `GET /health`（liveness）、`GET /health/ready`（readiness）
- ログ: stdout/stderr（Docker 既定の json-file。**ホストにローテーション設定なし** — 下記「既知の差分」参照）

### 本番環境（2026-08-07 現在）

| 項目         | 値                                                                                |
| ------------ | --------------------------------------------------------------------------------- |
| URL          | https://ceop.mirai-dx-platform.com                                                |
| ホスト       | 192.168.0.185（LAN）                                                              |
| 起動方式     | **`docker run`**（compose 管理下ではない。§6 参照）                               |
| コンテナ     | `ceop-platform`（`--restart unless-stopped`、127.0.0.1:3120→3000）                |
| イメージ     | `ceop-platform:v0.8.1`（可動エイリアス `ceop-platform:current` が同一 ID を指す） |
| トンネル     | Cloudflare Tunnel `ceop`（systemd: `cloudflared-ceop.service`）                   |
| DB           | ホスト `/home/kensan/.ceop/data/ceop.db` を `/data` へ bind mount                 |
| 環境変数     | `/home/kensan/.ceop/.env`（chmod 600、`--env-file` で読み込み）                   |
| 認証情報     | `/home/kensan/.ceop/*-credential.txt`（chmod 600）                                |
| バックアップ | cron 02:15 JST → `/home/kensan/.ceop/backups/`                                    |
| ヘルス確認   | cron 5 分間隔 → `/home/kensan/.ceop/health.log` へ成功/失敗を追記                 |
| 保持ポリシー | 日次 14 世代を `scripts/backup-retention.ts` で自動削除                           |

### イメージタグの運用

| タグ                    | 役割                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `ceop-platform:vX.Y.Z`  | 不変タグ。rollback と監査の基準。**prune しない**                     |
| `ceop-platform:current` | 可動エイリアス。稼働中バージョンを指す。cron などの自動処理が参照する |

デプロイのたびに `docker tag ceop-platform:vX.Y.Z ceop-platform:current` を実行する（§3 手順に含む）。これにより、バックアップ cron がリリースごとのタグ更新を必要としなくなる。

## 2. デプロイ手順（初回）

```bash
# 1. シークレット生成（値は Secrets 管理へ。画面・ログ・Git へ出さない）
openssl rand -hex 32   # CEOP_JWT_SECRET

> 統合ゲートウェイ（P1）を有効化する場合は、起動前に `CEOP_GATEWAY_SERVICES`
> （JSON 配列）と上流トークン環境変数を設定すること。形式は README
> 「Integration Gateway API（P1）」参照。設定ミスは起動時 fail-closed となる。

# 2. 環境変数ファイル作成（chmod 600）
#    .env.example を複製し CEOP_JWT_SECRET / CEOP_SQLITE_FILE 等を設定
install -m 600 /dev/null /home/kensan/.ceop/.env

# 3. データディレクトリ作成（コンテナの ceop ユーザー uid/gid 1001 が書けること）
mkdir -p /home/kensan/.ceop/data

# 4. イメージ取得
docker pull ghcr.io/kensan196948g/construction-eop:0.8.1
docker tag  ghcr.io/kensan196948g/construction-eop:0.8.1 ceop-platform:v0.8.1

# 5. マイグレーション（bind mount に対して実行）
docker run --rm -v /home/kensan/.ceop/data:/data \
  --env-file /home/kensan/.ceop/.env \
  ceop-platform:v0.8.1 \
  node --experimental-strip-types scripts/migrate.ts

# 6. API キー発行（出力は Secrets 管理へ。標準出力を残さない）
docker run --rm -v /home/kensan/.ceop/data:/data \
  --env-file /home/kensan/.ceop/.env \
  ceop-platform:v0.8.1 \
  node --experimental-strip-types scripts/provision-api-key.ts \
  --subject admin --permissions "*:*"

# 7. 起動
docker tag ceop-platform:v0.8.1 ceop-platform:current
docker run -d \
  --name ceop-platform \
  --restart unless-stopped \
  -p 127.0.0.1:3120:3000 \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=32m \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --cpus 1.0 \
  --memory 256m \
  --memory-reservation 64m \
  --pids-limit 128 \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  --env-file /home/kensan/.ceop/.env \
  -v /home/kensan/.ceop/data:/data \
  ceop-platform:v0.8.1

# 8. 確認（コンテナは loopback:3120 のみで listen。公開は Tunnel 経由）
docker inspect ceop-platform --format '{{.State.Health.Status}}'
curl -fsS https://ceop.mirai-dx-platform.com/health
curl -fsS https://ceop.mirai-dx-platform.com/health/ready
```

`-p 127.0.0.1:3120:3000` の loopback 指定は必須。`0.0.0.0` で公開すると Cloudflare Tunnel を迂回した LAN 直アクセスが可能になり、Cloudflare 側のアクセス制御が効かなくなる。

## 3. 更新手順

```bash
NEW=v0.7.2   # 例

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
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=32m \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --cpus 1.0 --memory 256m --memory-reservation 64m --pids-limit 128 \
  --log-opt max-size=10m --log-opt max-file=3 \
  -v /home/kensan/.ceop/data:/data ceop-platform:${NEW}
docker tag ceop-platform:${NEW} ceop-platform:current

# 6. 保持ポリシー適用（バックアップ cron と併設）
docker run --rm -v /home/kensan/.ceop/backups:/backups \
  ceop-platform:current node --experimental-strip-types scripts/backup-retention.ts \
  /backups --keep-days 14

# 7. 確認
docker inspect ceop-platform --format '{{.State.Health.Status}}'   # healthy になるまで待つ
curl -fsS https://ceop.mirai-dx-platform.com/api/v1/info           # version が ${NEW#v} であること
```

8. スモークテスト（トークン取得 → 監査ログ取得 → 主要 CRUD 一覧 → SSR 画面）を実施。異常があれば §4 の rollback へ。
9. 正常確認後、`docker rm ceop-platform-prev` で旧コンテナを片付ける。**旧イメージ `ceop-platform:vX.Y.Z` は消さない。**

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
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=32m \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --cpus 1.0 --memory 256m --memory-reservation 64m --pids-limit 128 \
  --log-opt max-size=10m --log-opt max-file=3 \
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

`docker-compose.prod.yml` は、実運用中のコンテナと同一のトポロジ（`container_name` / bind mount / loopback bind / ポート）を再現するよう合わせてある。ハードニング（`read_only` / `cap_drop: ALL` / `no-new-privileges` / memory・cpu・pids 制限 / ログローテーション）は v0.8.0 以降の **`docker run` オプションでも同等に適用済み**。compose 切替は管理性の向上のみが目的で、未実施。

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
CEOP_IMAGE=ceop-platform:v0.8.1 CEOP_DATA_DIR=/home/kensan/.ceop/data \
  docker compose -f docker-compose.prod.yml --env-file /home/kensan/.ceop/.env up -d
# 4. 検証後、labels に com.docker.compose.* が付いていることを確認
docker inspect ceop-platform --format '{{index .Config.Labels "com.docker.compose.project"}}'
```

切替後は本 Runbook の §3 / §4 を compose 版へ差し替える。

### 既知の差分（v0.8.0 以降はハードニング適用済み）

| 項目                     | 状態                                                                    |
| ------------------------ | ----------------------------------------------------------------------- |
| rootfs 読取専用          | ✅ `docker run --read-only` + tmpfs で適用                              |
| capabilities             | ✅ `--cap-drop ALL` で適用                                              |
| no-new-privileges        | ✅ `--security-opt no-new-privileges:true` で適用                       |
| CPU / memory / pids 制限 | ✅ `--cpus 1.0 --memory 256m --memory-reservation 64m --pids-limit 128` |
| ログローテーション       | ✅ `--log-opt max-size=10m --log-opt max-file=3` で適用                 |
| compose 管理             | 未切替（`docker run` のまま。切替は任意）                               |

## 7. WebUI（ceop-webui.service / port 3130）

デザインバンドル配信専用の systemd サービス。API コンテナ（3120）とは独立しており、片方の障害はもう片方に波及しない。

| 項目         | 値                                                                             |
| ------------ | ------------------------------------------------------------------------------ |
| unit         | `ceop-webui.service`（正本: `deploy/systemd/ceop-webui.service`）              |
| listen       | `127.0.0.1:3130`（loopback のみ。公開は Tunnel 経由）                          |
| 環境変数     | `/home/kensan/.ceop/webui.env`（chmod 600・git 管理外・Neon 接続文字列を含む） |
| 配信ルート   | `/home/kensan/.ceop/webui/current/webui-dist`                                  |
| アプリ本体   | `/home/kensan/.ceop/webui/current/app`（rsync 反映）                           |
| ヘルス       | `GET http://127.0.0.1:3130/healthz`                                            |
| アクセスログ | Neon `ceop-production` / `webui_access_log`（ページヒットのみ）                |

### 日常操作

```bash
systemctl status ceop-webui.service
journalctl -u ceop-webui.service -n 50 --no-pager
sudo systemctl restart ceop-webui.service
```

### 更新デプロイ

```bash
cd <repo>
bash scripts/webui-deploy.sh
# verify → rsync → バンドル展開（510 assets）→ unit 更新 → restart → /healthz 確認 まで自動
```

### 注意事項

- ExecStart は nvm 管理の Node を**絶対パスで固定**している
  （`/home/kensan/.nvm/versions/node/v25.2.1/bin/node`）。`nvm install` で
  バージョンを上げた場合は unit の ExecStart も更新して `daemon-reload` が必要。
- Neon 側障害時もアクセスログは fire-and-forget で破棄されるだけで、配信自体は継続する。
- デザイン正本は `webui/CEOP Platform.html`。差し替え時はファイルを置き換えて
  `webui-deploy.sh` を再実行する（展開先は再生成されるため手編集しない）。
- `https://ceop.mirai-dx-platform.com` 配下への公開（Tunnel ingress パス分割）は
  production route 変更のため Approval PR での承認後に実施する。

## 8. Tunnel ingress パス分割（WebUI 公開・適用済み）

`ceop.mirai-dx-platform.com` を API（3120）と WebUI（3130）へパスで振り分ける。
実適用は PR #14 で実施済み。**今後の production route 変更は、承認済み Approval PR がない状態で実施しない。**

| パス                                                                          | 振り分け先                |
| ----------------------------------------------------------------------------- | ------------------------- |
| `/api/*` `/health*`（`/health` `/health/ready`） `/dashboard*` `/governance*` | `localhost:3120`（API）   |
| 上記以外すべて（`/` `/assets/*` `/healthz` など）                             | `localhost:3130`（WebUI） |

正本: `deploy/cloudflared/ceop-config.yml`

### 切替手順

```bash
# 1. 事前確認（両バックエンドが健全であること）
curl -fsS http://127.0.0.1:3120/health >/dev/null && echo api-ok
curl -fsS http://127.0.0.1:3130/healthz >/dev/null && echo webui-ok

# 2. 現行設定の退避（復旧地点）
cp /home/kensan/.cloudflared/ceop-config.yml /home/kensan/.cloudflared/ceop-config.yml.bak

# 3. 新設定を配置
cp <repo>/deploy/cloudflared/ceop-config.yml /home/kensan/.cloudflared/ceop-config.yml

# 4. 設定検証と反映
cloudflared tunnel ingress validate --config /home/kensan/.cloudflared/ceop-config.yml
sudo systemctl restart cloudflared-ceop.service

# 5. 事後確認（外部経路）
curl -fsS https://ceop.mirai-dx-platform.com/health/ready   # API に到達
curl -fsS https://ceop.mirai-dx-platform.com/healthz        # WebUI に到達
curl -fsS -o /dev/null -w '%{http_code}\n' https://ceop.mirai-dx-platform.com/   # 200 (WebUI)
```

### Rollback

```bash
cp /home/kensan/.cloudflared/ceop-config.yml.bak /home/kensan/.cloudflared/ceop-config.yml
sudo systemctl restart cloudflared-ceop.service
curl -fsS https://ceop.mirai-dx-platform.com/health/ready   # 従来経路の復旧確認
```

DNS・証明書・Tunnel 自体（UUID / credentials）には一切触れない。変更は ingress ルールのみで、rollback は設定ファイルの復元 + サービス再起動で完結する（所要 10 秒程度）。

> マイグレーション 007（`ai_actions`）: AI ゲートウェイ統制（Y-09）で追加。
> 本番 DB へは `node --experimental-strip-types scripts/migrate.ts --db <CEOP_SQLITE_FILE>` で適用（既存 006 まで適用済みの場合は 007 のみ実行）。

> マイグレーション 008（projects）・009（daily_reports）: ServiceHub S-01/S-02 移植で追加。
> 本番適用は `scripts/migrate.ts` で 007 と同様（既存 DB は 008/009 のみ追加実行）。

> マイグレーション 010〜015: S-03 photos / S-04 safety_checks+quality_inspections / S-05 cost_records+work_hours / S-09 notification_deliveries。
> 本番適用は `scripts/migrate.ts`（既存 DB は 010〜015 のみ追加実行）。

> マイグレーション 016/017: S-06 knowledge_articles / S-07 legal_contracts。
> 本番適用は `scripts/migrate.ts`（既存 DB は 016/017 のみ追加実行）。

> マイグレーション 018〜021: E-03 documents / E-02 work_schedules / E-05 purchase_orders / E-11 notification_preferences。
> 通知ディスパッチャー: `node --experimental-strip-types scripts/run-notification-dispatcher.ts`（cron 登録推奨・5分間隔目安）。

> マイグレーション 022〜024: S-07 compliance_checks / legal_evidence / E-11 notification_templates。
> email 送信はディスパッチャー実行前に CEOP_SMTP_* を設定（未設定は not-configured 記録）。

## P4 監視スタック（Prometheus / Grafana）

- `GET /metrics` は loopback 3120 で公開済み（`CEOP_METRICS_TOKEN` 任意）。
- 実機導入: `docker compose --profile monitoring up -d`（`GRAFANA_ADMIN_PASSWORD` 必須・host network・loopback 19090/13001）。
- Tunnel ingress は `/metrics` を公開しないよう分割すること（`/api/*` のみ API へ）。
- 確認: `curl http://127.0.0.1:19090/api/v1/targets`・Grafana `http://127.0.0.1:13001`（CEOP Platform ダッシュボード）。

## 統合イベント自動配送（v0.11.1）

`scripts/run-integration-dispatcher.ts` が pending/retrying の outbound 連携イベントを
契約ポリシー（タイムアウト・再試行・冪等性ヘッダ）で自動送信します。
systemd 資産は `deploy/systemd/ceop-integration-dispatcher.{service,timer}`。

```bash
sudo cp deploy/systemd/ceop-integration-dispatcher.service deploy/systemd/ceop-integration-dispatcher.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ceop-integration-dispatcher.timer
systemctl list-timers ceop-integration-dispatcher.timer
```

手動実行:
```bash
docker run --rm -u 0 -v /home/kensan/.ceop/data:/data --env-file /home/kensan/.ceop/.env \
  ceop-platform:current node --experimental-strip-types scripts/run-integration-dispatcher.ts --db /data/ceop.db
```

送信先 URL は `CEOP_INTEGRATION_URL_<SYSTEM>`、共有シークレットは
`CEOP_INTEGRATION_SHARED_SECRET`（`X-Integration-Token` と `X-CEOP-Signature`（HMAC-SHA256）で受信検証）。

## 9. リリース手順

### 仕組み

Git タグ `vX.Y.Z` を push すると、GitHub Actions `release.yml` が自動で以下を実行します：

1. `pnpm run verify`（typecheck + lint + test + build）
2. Docker イメージをビルドし GHCR（`ghcr.io/kensan196948g/construction-eop`）へ push
   - タグ: `X.Y.Z` / `X.Y` / `X`（semver パターン）
3. `CHANGELOG.md` から該当バージョンのセクションを抽出し GitHub Release を作成

トリガー条件: `.github/workflows/release.yml` の `on.push.tags: ["v*.*.*"]`

### 手順

```bash
# 1. src/version.ts の PLATFORM_VERSION を更新（package.json と一致させる）
#    src/version.test.ts が不一致を検出するため、両方を同時に更新すること

# 2. CHANGELOG.md に [X.Y.Z] セクションを追加（release.yml がこの見出しを抽出する）

# 3. 変更をコミット
git add src/version.ts package.json CHANGELOG.md
git commit -m "chore: bump version to vX.Y.Z"

# 4. タグを作成して push（これで release.yml が発火）
git tag vX.Y.Z
git push origin main --tags
```

### 注意事項

- **タグを push する前に `pnpm run verify` が通ることを必ず確認する。**
  release.yml 内でも verify は実行されるが、タグ push 後の CI 失敗はリカバリが面倒。
- **CHANGELOG.md の見出しは `## [X.Y.Z]` 形式（`v` 接頭辞なし）であること。**
  release.yml は `vX.Y.Z` タグから `v` を除去して CHANGELOG を検索する。
- **タグは一度 push すると削除・再作成が難しい。** 誤ったタグを push した場合は
  GitHub Release を手動で削除し、GHCR の誤イメージも手動で削除する必要がある。

### v0.11.x タグ未作成問題（2026-08-11 現在）

v0.11.0（2026-08-09）および v0.11.1（2026-08-10）は本番デプロイ済みだが、
Git タグが作成されなかったため `release.yml` が発火せず、以下が未実施：

- GHCR に `0.11.0` / `0.11.1` イメージが push されていない
- GitHub Release が作成されていない

**対応手順:**

```bash
# v0.11.0 のコミットを特定し、タグを作成
git log --oneline --all | grep -i "0.11.0"
# 該当コミットの SHA を確認し:
git tag v0.11.0 <commit-sha>
git tag v0.11.1 <commit-sha>

# タグを push（release.yml が発火し GHCR イメージ + GitHub Release が作成される）
git push origin v0.11.0 v0.11.1
```

> ⚠️ タグ push により release.yml が 2 回発火する。v0.11.0 の CHANGELOG セクションが
> 存在することを事前に確認すること（存在しない場合、release.yml はエラーで停止する）。
