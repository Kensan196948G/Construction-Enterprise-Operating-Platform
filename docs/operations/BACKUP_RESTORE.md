# CEOP バックアップ・復元

## バックアップ

SQLite は WAL モードのため、ファイルコピーだけでは最新状態を保証できません。
WAL 側にしかない未チェックポイントのトランザクションが落ち、復元時に取りこぼしが発生します。
`scripts/sqlite-backup.ts`（`VACUUM INTO`）で一貫性のあるスナップショットを取得します。稼働中でも安全です。

```bash
# 手動（ホストから。コンテナ経由で実行するのでホストに Node は不要）
docker run --rm \
  -v /home/kensan/.ceop/data:/data \
  -v /home/kensan/.ceop/backups:/backups \
  ceop-platform:current \
  node --experimental-strip-types scripts/sqlite-backup.ts \
  /data/ceop.db "/backups/ceop-$(date -u +%Y%m%dT%H%M%SZ).db"
```

### 現在の cron 設定（実機）

```cron
15 2 * * * docker run --rm -v /home/kensan/.ceop/data:/data -v /home/kensan/.ceop/backups:/backups ceop-platform:current node --experimental-strip-types scripts/sqlite-backup.ts /data/ceop.db /backups/ceop-$(date +\%Y\%m\%d).db >> /home/kensan/.ceop/backup.log 2>&1
16 2 * * * docker run --rm -v /home/kensan/.ceop/backups:/backups ceop-platform:current node --experimental-strip-types scripts/backup-retention.ts /backups --keep-days 14 >> /home/kensan/.ceop/backup.log 2>&1
*/5 * * * * /home/kensan/Projects/Mirai-DX-Project/Construction-Enterprise-Operating-Platform/scripts/health-probe.sh
*/5 * * * * CEOP_HEALTH_URL=https://ceop.mirai-dx-platform.com/healthz CEOP_HEALTH_LOG=/home/kensan/.ceop/webui-health.log CEOP_HEALTH_STATE=/home/kensan/.ceop/webui-health-probe.state /home/kensan/Projects/Mirai-DX-Project/Construction-Enterprise-Operating-Platform/scripts/health-probe.sh
```

イメージは可動エイリアス `ceop-platform:current` を参照する。バージョン固定タグを直接書くと、次のリリースで旧イメージを prune した瞬間にバックアップが静かに失敗する（`backup.log` にしか出ないため気づきにくい）。

保存先: `/home/kensan/.ceop/backups/`
実行ログ: `/home/kensan/.ceop/backup.log`
ヘルスログ: `/home/kensan/.ceop/health.log`（**成功/失敗の両方を追記**。5 分間隔の外形プローブ）

### 保持世代

方針: 日次 14 世代、週次 8 世代、月次 12 世代（外部ストレージへのオフサイトコピー推奨）。

**自動削除（v0.8.0 で実装）:** `scripts/backup-retention.ts` が `ceop-*.db` の
mtime を基準に `--keep-days`（既定 14 日）より古い世代を削除します。
`predeploy` / `crontest` を含むファイル名は誤削除防止のため対象外です。

```bash
# 手動実行
docker run --rm -v /home/kensan/.ceop/backups:/backups \
  ceop-platform:current node --experimental-strip-types scripts/backup-retention.ts \
  /backups --keep-days 14
```

cron のバックアップ行に後続して実行する運用とします（RUNBOOK §3 手順 6b）。
オフサイトコピーは未設定。ホスト障害時はバックアップも同時に失われる（受容中のリスク）。

| 項目 | 担当 | 周期 | 手順 | 判定基準 |
|---|---|---|---|---|
| バックアップ生成確認 | 運用担当 | 週次 | `ls -la /home/kensan/.ceop/backups/` | 直近 7 日分が揃っている |
| バックアップログ確認 | 運用担当 | 週次 | `tail -20 /home/kensan/.ceop/backup.log` | `snapshot written` が日次で出ている |
| 保持ポリシー確認 | 運用担当 | 月次 | `ls -la /home/kensan/.ceop/backups/` と `backup-retention` のログ確認 | 14 日より古い日次分が残っていない |
| 復元試験 | 運用担当 | 四半期 | 下記「復元」を検証環境で実施 | RTO 1 時間以内で `/health/ready` 200 |

オフサイトコピーは未設定。ホスト障害時はバックアップも同時に失われる（受容中のリスク）。

## 復元

**アプリを停止してから実施する。** 稼働中の DB ファイルを上書きすると、
開いているコネクションと WAL の整合が壊れ、復元後も不整合が残ります。
WAL / SHM のサイドカーファイル（`ceop.db-wal` / `ceop.db-shm`）も必ず退避対象に含めます。

```bash
BK=/home/kensan/.ceop/backups/ceop-YYYYMMDDTHHMMSSZ.db   # 復元したい世代
D=/home/kensan/.ceop/data

# 1. アプリ停止（本番は docker run 起動。compose ではない — RUNBOOK.md §6 参照）
docker stop ceop-platform

# 2. 現行 DB と WAL/SHM を退避（削除しない）
TS=$(date -u +%Y%m%dT%H%M%SZ)
sudo mv "$D/ceop.db"     "$D/ceop.db.broken-$TS"
sudo mv "$D/ceop.db-wal" "$D/ceop.db-wal.broken-$TS" 2>/dev/null || true
sudo mv "$D/ceop.db-shm" "$D/ceop.db-shm.broken-$TS" 2>/dev/null || true

# 3. バックアップを配置し、コンテナの ceop ユーザー（uid/gid 1001）へ所有権を移す
sudo cp "$BK" "$D/ceop.db"
sudo chown 1001:1001 "$D/ceop.db"
sudo chmod 644 "$D/ceop.db"

# 4. 起動
docker start ceop-platform
docker inspect ceop-platform --format '{{.State.Health.Status}}'

# 5. 検証
curl -fsS https://ceop.mirai-dx-platform.com/health/ready
curl -fsS https://ceop.mirai-dx-platform.com/api/v1/info
#    さらに認証込みのスモーク（トークン取得 → 監査ログ取得）まで確認する
```

> 所有権について: ホスト上では uid 1001 が別アカウント名で表示されることがあるが、
> コンテナ内の `ceop` ユーザーと同じ uid/gid であり正常。数値で 1001:1001 を確認する。

## 目標値

| 指標 | 値 | 根拠 |
|---|---|---|
| RPO | 24 時間 | 日次バックアップ（02:15 JST）。重要業務フェーズでは 6 時間へ短縮 |
| RTO | 1 時間以内 | 上記復元手順。年 2 回の訓練で維持 |
| 復元試験 | 四半期 1 回 | 結果を `OPERATIONS_LEDGER.md` へ記録 |

**復元試験は未実施。** 初回は次回四半期に実施し、実測 RTO を本ファイルへ反映する。
