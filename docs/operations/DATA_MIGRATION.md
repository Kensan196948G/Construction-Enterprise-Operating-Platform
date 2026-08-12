# 実業務データ移行ガイド（v0.12.0）

## 1. 目的

本番 DB は migration 001〜026 が適用済みですが、業務テーブルはすべて 0 件です。
本ガイドは、既存の Excel/紙/旧システムのデータを CEOP のドメイン検証を通過した
形で投入するための手順を定めます。

## 2. 対象データと投入順序

1. **projects（案件）** — 必須。他レコードの FK 参照元
2. **dailyReports（日報）** — 案件配下
3. **safetyChecks / qualityInspections（安全・品質）** — 案件配下
4. **costRecords / workHours（原価・工数）** — 案件配下
5. **purchaseOrders（発注）** — 案件配下
6. **contracts（契約）** — 案件配下

## 3. 入力形式（JSON bundle）

```json
{
  "projects": [
    {
      "id": "project-2026-001",
      "organizationId": "org-hq",
      "projectCode": "P2026-001",
      "name": "○○橋梁補修工事",
      "clientName": "○○市",
      "siteAddress": "○○県○○市",
      "status": "in_progress",
      "startDate": "2026-04-01",
      "endDate": "2027-03-31",
      "budget": 120000000
    }
  ],
  "dailyReports": [
    {
      "organizationId": "org-hq",
      "projectId": "project-2026-001",
      "reportDate": "2026-08-12",
      "weather": "cloudy",
      "temperature": 28.5,
      "workerCount": 8,
      "workContent": "橋台コンクリート打設",
      "safetyCheck": true,
      "progressRate": 45,
      "issues": "型枠材の納品遅延を調整中"
    }
  ],
  "safetyChecks": [
    {
      "organizationId": "org-hq",
      "projectId": "project-2026-001",
      "checkDate": "2026-08-12",
      "checkType": "daily",
      "itemsTotal": 5,
      "itemsOk": 5,
      "itemsNg": 0,
      "overallResult": "ok",
      "inspectorId": "user-site-chief"
    }
  ],
  "purchaseOrders": [
    {
      "organizationId": "org-hq",
      "projectId": "project-2026-001",
      "orderNumber": "PO-2026-0001",
      "supplier": "○○建材株式会社",
      "item": "型枠材（合板）",
      "quantity": 100,
      "unitPrice": 1800,
      "status": "issued"
    }
  ]
}
```

省略できるフィールドはドメイン既定値が使われます（例: status=draft、weather=sunny、
workerCount=0、safetyCheck=false）。必須フィールド（organizationId・projectId・
日付・名称等）が欠けているレコードはエラーになり、**投入されません**。

## 4. 実行手順

```bash
# 1. 入力ファイルを準備（上記形式。Git には保存しない）
cp /path/to/export.json /home/kensan/.ceop/import/business-data.json

# 2. 事前バックアップ
#    （scripts/sqlite-backup.ts または VACUUM INTO で /home/kensan/.ceop/backups/ へ）

# 3. マイグレーション（冪等）
node --experimental-strip-types scripts/migrate.ts --db /data/ceop.db

# 4. ドライラン（--db をコピーした一時 DB で実行）
cp /home/kensan/.ceop/data/ceop.db /tmp/ceop-dryrun.db
node --experimental-strip-types scripts/import-business-data.ts /home/kensan/.ceop/import/business-data.json --db /tmp/ceop-dryrun.db

# 5. ドライラン DB の検証
node --experimental-strip-types scripts/verify-restore.ts /tmp/ceop-dryrun.db
node --experimental-strip-types scripts/verify-audit-chain.ts /tmp/ceop-dryrun.db

# 6. 問題がなければ本番 DB へ投入
node --experimental-strip-types scripts/import-business-data.ts /home/kensan/.ceop/import/business-data.json --db /home/kensan/.ceop/data/ceop.db

# 7. 本番検証（API 経由）
curl -s -H "Authorization: Bearer keyId:secret" \
  https://ceop.mirai-dx-platform.com/api/v1/projects | jq .total
```

## 5. 受入れ基準

- 全レコードが `imported=N errors=0` で投入される
- `verify-restore` が OK（監査チェーン・ISO 番号重複を含む）
- `pnpm run parity` が PASS（API プローブ）
- サンプル 3 現場分を対象に、現場監督 1 名・IT 担当 1 名が画面/API で参照できる
- 投入後、日次バックアップが 1 回成功する

## 6. 注意事項

- レコードの `id` を指定しない場合は自動生成されますが、既存システムの ID を
  保持したい場合は必ず `id` を指定してください
- 過去データを投入すると日報の状態は `draft` になります。承認済み履歴が必要な
  場合は、投入後に日報ワークフロー（submit → approve）を再現してください
- 個人情報（作業員名・連絡先等）は CEOP の入力形式に含めず、別途マスタ管理の
  整備（Phase 1）を待ってください
- 本番への投入は必ず事前バックアップ後に行い、実行ログを
  `docs/operations/OPERATIONS_LEDGER.md` に記録してください
