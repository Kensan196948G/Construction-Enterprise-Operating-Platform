# Dockerfile Audit Report (Loop #7)

- 実行日時: 2026-05-22T22:48:20+09:00
- リポジトリ: Construction DX One Platform
- 対象 Dockerfile 数: 25
- 問題のあるファイル: 25
- 検出 issue 件数 (合計): 43

## サマリ表

| File | Base | WORKDIR | EXPOSE | HEALTHCHECK | USER | Issues |
| --- | --- | :---: | :---: | :---: | :---: | ---: |
| `00_共通基盤\api-gateway\Dockerfile` | python:3.12-slim | OK | OK | OK | - | **1** |
| `00_共通基盤\shared-ui\Dockerfile` | node:20-alpine, deps, alpine:3.20 | OK | - | - | - | **2** |
| `01_経営企画部\ConstructionExecutiveDashboard\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `01_経営企画部\ConstructionExecutiveDashboard\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **1** |
| `02_営業本部\ConstructionCRM-BidManagement\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `02_営業本部\ConstructionCRM-BidManagement\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **1** |
| `03_ソリューション営業本部\SmartInfrastructureSolutionPlatform\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `03_ソリューション営業本部\SmartInfrastructureSolutionPlatform\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **2** |
| `04_施工本部\ConstructionSiteManagementSystem\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `04_施工本部\ConstructionSiteManagementSystem\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **1** |
| `05_技術本部\TechnicalKnowledge-BIMPlatform\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `05_技術本部\TechnicalKnowledge-BIMPlatform\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **2** |
| `06_安全品質環境本部\SafetyQualityGovernancePlatform\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `06_安全品質環境本部\SafetyQualityGovernancePlatform\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **2** |
| `07_管理本部\CorporateOperationPlatform\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `07_管理本部\CorporateOperationPlatform\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **2** |
| `08_購買部\ProcurementMaterialPlatform\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `08_購買部\ProcurementMaterialPlatform\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **1** |
| `09_船舶事業部\MarineFleetManagement\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `09_船舶事業部\MarineFleetManagement\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **1** |
| `10_IT-DX部門\ConstructionITSM-ZeroTrustPlatform\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `10_IT-DX部門\ConstructionITSM-ZeroTrustPlatform\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **2** |
| `11_統合データ基盤\ConstructionDataLake-DigitalTwin\backend\Dockerfile` | python:3.12-slim | OK | OK | - | - | **2** |
| `11_統合データ基盤\ConstructionDataLake-DigitalTwin\frontend\Dockerfile` | node:20-alpine, shared-ui, nginx:1.27-alpine | OK | OK | - | - | **2** |
| `mocks\Dockerfile` | python:3.12-slim | OK | OK | OK | - | **1** |

## 詳細 (issue があるファイルのみ)

### `00_共通基盤\api-gateway\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)

### `00_共通基盤\shared-ui\Dockerfile`

- EXPOSE 未指定
- USER 未指定 (root 実行: 本番では非推奨)

### `01_経営企画部\ConstructionExecutiveDashboard\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `01_経営企画部\ConstructionExecutiveDashboard\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)

### `02_営業本部\ConstructionCRM-BidManagement\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `02_営業本部\ConstructionCRM-BidManagement\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)

### `03_ソリューション営業本部\SmartInfrastructureSolutionPlatform\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `03_ソリューション営業本部\SmartInfrastructureSolutionPlatform\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)
- nginx.conf 未配置 (SPA fallback が無いと React Router で 404)

### `04_施工本部\ConstructionSiteManagementSystem\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `04_施工本部\ConstructionSiteManagementSystem\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)

### `05_技術本部\TechnicalKnowledge-BIMPlatform\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `05_技術本部\TechnicalKnowledge-BIMPlatform\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)
- nginx.conf 未配置 (SPA fallback が無いと React Router で 404)

### `06_安全品質環境本部\SafetyQualityGovernancePlatform\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `06_安全品質環境本部\SafetyQualityGovernancePlatform\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)
- nginx.conf 未配置 (SPA fallback が無いと React Router で 404)

### `07_管理本部\CorporateOperationPlatform\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `07_管理本部\CorporateOperationPlatform\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)
- nginx.conf 未配置 (SPA fallback が無いと React Router で 404)

### `08_購買部\ProcurementMaterialPlatform\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `08_購買部\ProcurementMaterialPlatform\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)

### `09_船舶事業部\MarineFleetManagement\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `09_船舶事業部\MarineFleetManagement\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)

### `10_IT-DX部門\ConstructionITSM-ZeroTrustPlatform\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `10_IT-DX部門\ConstructionITSM-ZeroTrustPlatform\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)
- nginx.conf 未配置 (SPA fallback が無いと React Router で 404)

### `11_統合データ基盤\ConstructionDataLake-DigitalTwin\backend\Dockerfile`

- HEALTHCHECK 未指定 (backend/gateway は推奨)
- USER 未指定 (root 実行: 本番では非推奨)

### `11_統合データ基盤\ConstructionDataLake-DigitalTwin\frontend\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)
- nginx.conf 未配置 (SPA fallback が無いと React Router で 404)

### `mocks\Dockerfile`

- USER 未指定 (root 実行: 本番では非推奨)

## 観点メモ

- WORKDIR / EXPOSE / HEALTHCHECK / USER は static lint のみで、
  実 build は `scripts/build-all.ps1` で別途検証する。
- `USER 未指定` は本番では root 緩和のために non-root user を追加する候補。
  Phase 1 (開発フェーズ) ではブロッカー扱いしない。
- COPY の親階層参照 (`../`) は build.context=. の compose 設定と非整合なため即修正対象。
- frontend で `nginx.conf` 未配置の場合、React Router の SPA fallback が効かない (要 `try_files`)。

