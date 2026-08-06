# CEOP バックアップ・復元

## バックアップ

SQLite は WAL モードのため、ファイルコピーだけでは最新状態を保証できません。
`scripts/sqlite-backup.ts`（VACUUM INTO）で一貫性のあるスナップショットを取得します。

```bash
# 手動
node --experimental-strip-types scripts/sqlite-backup.ts /data/ceop.db /backup/ceop-$(date -u +%Y%m%dT%H%M%SZ).db

# cron（例: 毎日 02:00 JST）
0 2 * * * cd /opt/ceop && node --experimental-strip-types scripts/sqlite-backup.ts \
  /data/ceop.db /backup/ceop-$(date -u +\%Y\%m\%dT\%H\%M\%SZ).db >> /var/log/ceop-backup.log 2>&1
```

保持: 日次 14 世代、週次 8 世代、月次 12 世代（外部ストレージへオフサイトコピー推奨）

## 復元

```bash
# 1. アプリ停止
docker compose -f docker-compose.prod.yml stop
# 2. 現行 DB を待避（例: /data/ceop.db.broken）
# 3. バックアップを /data/ceop.db へコピー（パーミッション ceop:ceop 1001:1001 に注意）
# 4. 起動
docker compose -f docker-compose.prod.yml up -d
# 5. 検証
curl -fsS http://localhost:3000/health/ready
```

## 目標値

- RPO: 24 時間（日次バックアップ）。重要業務フェーズでは 6 時間に短縮
- RTO: 1 時間以内（リストア手順の年 2 回訓練で維持）
- 復元試験: 四半期 1 回実施し、運用台帳に記録
