# 🌿 環境管理文書 (Environmental Management Document)

> Construction DX One Platform  
> 適用規格: ISO 14001:2015 / 建設工事施工における環境基準 / 環境基本法  
> 作成: 2026-06-01 | 承認: CTO  
> 改訂サイクル: 年1回（または法令改正・重大環境事故発生時）  
> 関連部門: 04*施工本部 / 06*安全品質環境本部 / 11\_統合データ基盤

---

## 📌 目次

| セクション                                                | 内容                       |
| :-------------------------------------------------------- | :------------------------- |
| [§1 適用範囲と目的](#1-適用範囲と目的)                    | 対象部門・システム         |
| [§2 関連規格・法令](#2-関連規格法令)                      | ISO 14001 / 環境基本法 等  |
| [§3 役割と責任](#3-役割と責任)                            | RACI マトリクス            |
| [§6.1 環境影響評価](#61-環境影響評価現場別)               | 環境側面登録・判定基準     |
| [§8.1 CO2排出量 月次集計](#81-co2排出量-月次集計)         | Scope 1/2/3 フロー         |
| [§9.1 環境パフォーマンス監視](#91-環境パフォーマンス監視) | KPI・Grafana 連携          |
| [§10 是正処置フロー](#10-是正処置フロー)                  | 不適合検知から再発防止まで |

---

## 📌 1. 適用範囲と目的

本文書は、Construction DX One Platform（以下「本システム」）を通じて管理される建設現場の環境活動に対して ISO 14001:2015 に基づく環境マネジメントシステム（EMS）を適用するための手順および記録様式を定める。

### 1.1 目的

- 建設現場（04\_施工本部 管轄）における環境負荷の定量把握と継続的削減
- CO2排出量・廃棄物・騒音・水使用量の可視化と報告自動化
- 法令遵守（環境基本法・建設業法・廃棄物処理法）の証跡管理
- 11\_統合データ基盤 BI との連携による環境 KPI のリアルタイム監視

### 1.2 適用範囲

| 対象         | 範囲                                                                                                                         |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **部門**     | 04*施工本部（工事現場管理）/ 06*安全品質環境本部（環境監査）/ 11\_統合データ基盤（BI・集計）                                 |
| **システム** | SVC-04（施工本部サービス、Port 5183/8004）/ SVC-06（安全品質環境、Port 5185/8006）/ SVC-11（統合データ基盤、Port 5190/8011） |
| **現場**     | 本システムで登録・管理される全建設現場                                                                                       |
| **環境側面** | CO2排出、建設廃棄物、騒音・振動、土壌汚染リスク、水使用量                                                                    |

---

## 📌 2. 関連規格・法令

| 分類     | 規格・法令                                                     | 対応条項               |
| :------- | :------------------------------------------------------------- | :--------------------- |
| 国際規格 | ISO 14001:2015 環境マネジメントシステム                        | 全条項                 |
| 国内法令 | 環境基本法（昭和46年法律第91号）                               | 第14条（環境基準）     |
| 国内法令 | 建設工事に係る資材の再資源化等に関する法律（建設リサイクル法） | 第9条・第16条          |
| 国内法令 | 廃棄物の処理及び清掃に関する法律（廃棄物処理法）               | 第12条・第19条         |
| 国内法令 | 騒音規制法                                                     | 第14条（特定建設作業） |
| 国内法令 | 振動規制法                                                     | 第14条（特定建設作業） |
| 国内法令 | 土壌汚染対策法                                                 | 第3条                  |
| 国内基準 | 建設工事施工における環境基準（国土交通省）                     | CO2算定方法            |
| 国際規格 | GHG Protocol (Scope 1/2/3)                                     | CO2排出量分類          |

---

## 📌 3. 役割と責任

| 役割           | 担当部門                 | 責任                                |
| :------------- | :----------------------- | :---------------------------------- |
| 環境管理責任者 | 06\_安全品質環境本部     | EMS 全体の維持・改善・法令遵守確認  |
| 現場環境担当   | 04\_施工本部（現場ごと） | 環境側面の日常記録・異常報告        |
| データ基盤担当 | 11\_統合データ基盤       | BI 集計・Grafana ダッシュボード管理 |
| CTO            | IT-DX 部門               | システム維持・規格準拠の最終承認    |
| 内部監査担当   | 06\_安全品質環境本部     | 年次内部監査の実施                  |

---

## 🌿 6.1 環境影響評価（現場別）

ISO 14001:2015 §6.1 に基づき、各建設現場の環境側面を特定・評価し、重要環境側面を決定する。

### 6.1.1 環境側面登録（04\_施工本部 管轄現場）

| 環境側面 ID | 環境側面             | 環境影響                  | 関連活動                     |
| :---------- | :------------------- | :------------------------ | :--------------------------- |
| ENV-01      | 建設機械の燃料燃焼   | CO2・NOx 排出（大気汚染） | 掘削・運搬・クレーン稼働     |
| ENV-02      | 電力使用             | CO2 排出（Scope 2）       | 現場事務所・照明・溶接機     |
| ENV-03      | 建設廃棄物の発生     | 最終処分地の環境負荷      | コンクリートがら・木材・金属 |
| ENV-04      | 騒音・振動の発生     | 近隣住民への生活環境影響  | 杭打ち・掘削・大型車両       |
| ENV-05      | 土壌汚染リスク       | 地下水・生態系への影響    | 油漏れ・廃液処理不備         |
| ENV-06      | 水使用量             | 地域水資源への影響        | コンクリート養生・洗浄       |
| ENV-07      | 粉じんの発生         | 大気汚染・住民健康被害    | 解体・整地作業               |
| ENV-08      | サプライチェーン調達 | CO2 排出（Scope 3）       | 資材・機械の輸送             |

### 6.1.2 重要環境側面の判定基準

重要環境側面は以下の 3 軸スコアの積（発生頻度 × 影響度 × 規制要件）で評価し、しきい値以上を「重要」と判定する。

```text
重要度スコア = 発生頻度 × 影響度 × 規制要件

スコア区分:
  各軸: 1(低) / 3(中) / 5(高)
  しきい値: 合計スコア ≥ 27 → 重要環境側面
            合計スコア 9〜26 → 管理対象環境側面
            合計スコア ≤ 8  → モニタリング対象
```

| 環境側面                | 発生頻度 | 影響度 | 規制要件 | 合計スコア | 判定     |
| :---------------------- | :------: | :----: | :------: | :--------: | :------- |
| ENV-01 建設機械燃料燃焼 |    5     |   5    |    5     |    125     | **重要** |
| ENV-02 電力使用         |    5     |   3    |    3     |     45     | **重要** |
| ENV-03 建設廃棄物       |    5     |   3    |    5     |     75     | **重要** |
| ENV-04 騒音・振動       |    3     |   3    |    5     |     45     | **重要** |
| ENV-05 土壌汚染リスク   |    1     |   5    |    5     |     25     | 管理対象 |
| ENV-06 水使用量         |    3     |   3    |    1     |     9      | 管理対象 |
| ENV-07 粉じん           |    3     |   3    |    3     |     27     | **重要** |
| ENV-08 Scope 3 排出     |    5     |   3    |    3     |     45     | **重要** |

### 6.1.3 現場別環境影響評価テンプレート

04\_施工本部 SVC-04 の環境側面登録 API（`POST /api/v1/environment/sites/{site_id}/aspects`）で使用するデータ形式。

```json
{
  "site_id": "SITE-2026-001",
  "site_name": "〇〇建設現場",
  "evaluation_date": "2026-06-01",
  "evaluator": "現場環境担当者名",
  "aspects": [
    {
      "aspect_id": "ENV-01",
      "aspect_name": "建設機械の燃料燃焼",
      "environmental_impact": "CO2・NOx 排出",
      "frequency_score": 5,
      "impact_score": 5,
      "regulation_score": 5,
      "total_score": 125,
      "significance": "重要",
      "control_measure": "低燃費機械への切替・アイドリングストップ徹底",
      "monitoring_method": "燃料消費量月次記録",
      "legal_reference": "環境基本法第14条 / GHG Protocol Scope 1"
    }
  ],
  "approved_by": "06_安全品質環境本部 環境管理責任者",
  "next_review_date": "2027-06-01"
}
```

```json
{
  "site_id": "SITE-2026-001",
  "aspect_id": "ENV-05",
  "aspect_name": "土壌汚染リスク",
  "risk_assessment": {
    "hazardous_materials": ["重機オイル", "防錆剤", "コンクリート硬化剤"],
    "storage_method": "防液堤付き専用保管庫",
    "spill_response_plan": "RUNBOOK §5 環境版準拠",
    "monitoring_frequency": "月次土壌サンプリング",
    "legal_reference": "土壌汚染対策法第3条"
  }
}
```

---

## ♻️ 8.1 CO2排出量 月次集計

ISO 14001:2015 §8.1 の運用管理として、GHG Protocol に基づく Scope 1/2/3 別の CO2排出量を月次集計する。

### 8.1.1 Scope 分類（建設業向け）

| Scope       | 区分                 | 排出源                                                | 担当部門                        |
| :---------- | :------------------- | :---------------------------------------------------- | :------------------------------ |
| **Scope 1** | 直接排出             | 建設機械燃料（軽油・ガソリン）/ 現場発電機 / 工事車両 | 04\_施工本部                    |
| **Scope 2** | 間接排出（電力）     | 現場事務所電力 / 機器稼働電力 / 仮設照明              | 04\_施工本部                    |
| **Scope 3** | バリューチェーン排出 | 資材輸送 / 建設機械製造 / 廃棄物処理 / 協力会社活動   | 08*購買部 + 06*安全品質環境本部 |

### 8.1.2 データ収集フロー

```text
[04_施工本部 SVC-04]          [06_安全品質環境本部 SVC-06]
  現場燃料消費記録 (日次)  ──→  Scope 1/2 算定・検証
  電力使用量記録 (月次)          法令適合チェック
  廃棄物処理記録 (月次)             ↓
                             [11_統合データ基盤 SVC-11]
[08_購買部 SVC-08]              BI 統合・集計
  資材調達量・輸送距離 ──→    Grafana ダッシュボード連携
  協力会社 CO2 申告              Scope 1+2+3 合算レポート
                                    ↓
                             [01_経営企画部 SVC-01]
                              経営ダッシュボード表示
                              取締役会向け月次報告
```

### 8.1.3 月次集計フォーマット

SVC-11（統合データ基盤）の集計 API レスポンス形式。

```json
{
  "report_month": "2026-06",
  "report_generated": "2026-06-20T09:00:00+09:00",
  "total_co2_tco2": 1234.5,
  "breakdown": {
    "scope1": {
      "total_tco2": 800.0,
      "fuel_consumption_liters": {
        "diesel": 280000,
        "gasoline": 15000
      },
      "emission_factor": {
        "diesel_kg_per_liter": 2.58,
        "gasoline_kg_per_liter": 2.32
      },
      "sources": ["建設機械", "工事車両", "仮設発電機"]
    },
    "scope2": {
      "total_tco2": 150.0,
      "electricity_kwh": 280000,
      "emission_factor_kg_per_kwh": 0.000486,
      "sources": ["現場事務所", "仮設照明", "溶接機・電動工具"]
    },
    "scope3": {
      "total_tco2": 284.5,
      "categories": {
        "upstream_transport": 120.0,
        "waste_disposal": 84.5,
        "subcontractor_activities": 80.0
      }
    }
  },
  "sites": [
    {
      "site_id": "SITE-2026-001",
      "site_name": "〇〇現場",
      "co2_tco2": 456.7,
      "scope1_tco2": 300.0,
      "scope2_tco2": 56.7,
      "scope3_tco2": 100.0
    }
  ],
  "yoy_change_percent": -8.5,
  "target_yoy_change_percent": -10.0,
  "status": "進行中",
  "approved_by": "06_安全品質環境本部"
}
```

### 8.1.4 集計タイムライン

| 日程                 | 作業                                               | 担当                  | システム        |
| :------------------- | :------------------------------------------------- | :-------------------- | :-------------- |
| 毎月1〜10日          | 各現場の燃料消費量・電力使用量の一次集計           | 04\_施工本部 現場担当 | SVC-04          |
| 毎月10〜14日         | 協力会社 CO2 申告データ収集 / Scope 3 算定         | 08\_購買部            | SVC-08          |
| **毎月15日（締め）** | 全データ受付締め切り / 06\_安全品質環境本部 へ提出 | 各部門                | —               |
| 毎月15〜19日         | 算定値の検証・承認・Scope 1+2+3 合算               | 06\_安全品質環境本部  | SVC-06 → SVC-11 |
| **毎月20日（報告）** | 経営ダッシュボード反映 / 取締役会用レポート出力    | 11\_統合データ基盤    | SVC-11 → SVC-01 |
| 毎月25日             | 前月比較・KPI 乖離分析・是正処置起票               | 06\_安全品質環境本部  | SVC-06          |

### 8.1.5 CO2算定方式（建設工事施工における環境基準準拠）

```python
# Scope 1: 燃料燃焼 CO2算定（国土交通省算定方式）
def calc_scope1_co2(diesel_liters: float, gasoline_liters: float) -> float:
    """
    Emission factors from Japan Ministry of Environment (2025 revision)
    Unit: tCO2
    """
    DIESEL_EF = 2.58   # kg-CO2/liter (軽油)
    GASOLINE_EF = 2.32 # kg-CO2/liter (ガソリン)
    return (diesel_liters * DIESEL_EF + gasoline_liters * GASOLINE_EF) / 1000

# Scope 2: 電力使用 CO2算定
def calc_scope2_co2(electricity_kwh: float, emission_factor: float = 0.000486) -> float:
    """
    Emission factor: 0.000486 tCO2/kWh (電気事業者平均係数 2025年度)
    """
    return electricity_kwh * emission_factor
```

---

## 📊 9.1 環境パフォーマンス監視

ISO 14001:2015 §9.1 に基づく環境パフォーマンス指標の監視・測定・分析・評価を実施する。

### 9.1.1 環境 KPI 一覧

| KPI ID  | 指標                    | 目標値          | 測定頻度               | 測定方法                 | 担当                 |
| :------ | :---------------------- | :-------------- | :--------------------- | :----------------------- | :------------------- |
| KPI-E01 | CO2 排出量（Scope 1+2） | 前年比 **-10%** | 月次                   | 燃料・電力使用量から算定 | 06\_安全品質環境本部 |
| KPI-E02 | CO2 排出量（Scope 3）   | 前年比 -5%      | 月次                   | 協力会社申告・購買データ | 08\_購買部           |
| KPI-E03 | 廃棄物リサイクル率      | **≥ 80%**       | 月次                   | 廃棄物処理伝票集計       | 04\_施工本部         |
| KPI-E04 | 最終廃棄物処分量        | 前年比 -10%     | 月次                   | 処分業者マニフェスト     | 04\_施工本部         |
| KPI-E05 | 水使用量                | 前年比 -5%      | 月次                   | 水道メーター記録         | 04\_施工本部         |
| KPI-E06 | 騒音測定値（dB）        | 近隣境界 ≤ 85dB | 週次（杭打ち等作業時） | 騒音計測定               | 04\_施工本部         |
| KPI-E07 | 環境法令違反件数        | 0件             | 随時                   | 行政指導・通知記録       | 06\_安全品質環境本部 |
| KPI-E08 | 環境インシデント件数    | 0件             | 随時                   | インシデント報告書       | 06\_安全品質環境本部 |

### 9.1.2 Grafana ダッシュボード統合計画

11\_統合データ基盤 BI（SVC-11、Port 5190/8011）と Grafana を連携し、環境 KPI をリアルタイム可視化する。

```text
データフロー:
  SVC-04 (施工本部 API) ──→ SVC-11 (統合データ基盤)
  SVC-06 (安全品質環境 API) ──→ SVC-11
        ↓
  Prometheus メトリクスエンドポイント (SVC-11 /metrics)
        ↓
  Grafana ダッシュボード: cdx-environment-kpi (新規作成予定)
```

**Grafana ダッシュボード設計（cdx-environment-kpi）:**

```json
{
  "title": "CDX Environmental KPI Dashboard",
  "uid": "cdx-environment-kpi",
  "tags": ["cdx", "environment", "iso14001", "kpi"],
  "panels": [
    {
      "type": "gauge",
      "title": "CO2排出量 前年比変化率 (%)",
      "targets": [{ "expr": "cdx_co2_yoy_change_percent" }],
      "fieldConfig": {
        "thresholds": [
          { "value": -10, "color": "green" },
          { "value": -5, "color": "orange" },
          { "value": 0, "color": "red" }
        ]
      }
    },
    {
      "type": "gauge",
      "title": "廃棄物リサイクル率 (%)",
      "targets": [{ "expr": "cdx_waste_recycle_rate_percent" }],
      "fieldConfig": {
        "thresholds": [
          { "value": 0, "color": "red" },
          { "value": 70, "color": "orange" },
          { "value": 80, "color": "green" }
        ]
      }
    },
    {
      "type": "timeseries",
      "title": "月次 CO2排出量 推移 (tCO2)",
      "targets": [
        { "expr": "cdx_co2_monthly_total_tco2", "legendFormat": "総排出量" },
        { "expr": "cdx_co2_scope1_tco2", "legendFormat": "Scope 1" },
        { "expr": "cdx_co2_scope2_tco2", "legendFormat": "Scope 2" },
        { "expr": "cdx_co2_scope3_tco2", "legendFormat": "Scope 3" }
      ]
    }
  ]
}
```

**Prometheus メトリクス定義（SVC-11 backend に実装予定）:**

```python
# environment_metrics.py
from prometheus_client import Gauge

co2_total = Gauge(
    "cdx_co2_monthly_total_tco2",
    "Monthly total CO2 emissions (tCO2)",
    ["site_id", "report_month"]
)
co2_yoy = Gauge(
    "cdx_co2_yoy_change_percent",
    "CO2 year-over-year change rate (%)"
)
waste_recycle_rate = Gauge(
    "cdx_waste_recycle_rate_percent",
    "Construction waste recycling rate (%)",
    ["site_id"]
)
water_usage = Gauge(
    "cdx_water_usage_monthly_m3",
    "Monthly water usage (m3)",
    ["site_id"]
)
env_incident_count = Gauge(
    "cdx_env_incident_total",
    "Total environmental incidents",
    ["severity"]
)
```

### 9.1.3 KPI 監視アラートルール

```yaml
# Prometheus AlertManager 設定（cdx-environment-alerts.yml）
groups:
  - name: cdx_environment
    rules:
      - alert: CO2TargetExceeded
        expr: cdx_co2_yoy_change_percent > 0
        for: 1d
        labels:
          severity: warning
          team: environment
        annotations:
          summary: "CO2排出量が前年比増加 - 是正処置を実施してください"

      - alert: WasteRecycleRateBelowTarget
        expr: cdx_waste_recycle_rate_percent < 80
        for: 7d
        labels:
          severity: warning
          team: environment
        annotations:
          summary: "廃棄物リサイクル率 80% 未達 - {{ $value }}%"

      - alert: EnvironmentalIncidentDetected
        expr: increase(cdx_env_incident_total[1h]) > 0
        labels:
          severity: critical
          team: environment
        annotations:
          summary: "環境インシデント検知 - 06_安全品質環境本部へ即時報告"
```

---

## ⚠️ 10. 是正処置フロー

ISO 14001:2015 §10.1 / §10.2 に基づく不適合・環境インシデントの是正処置手順。

```text
環境インシデント / KPI 目標未達 検知
         ↓
  [06_安全品質環境本部] 重大度判定
         ↓
  ┌──────────────────────────────────────┐
  │ 重大（法令違反・土壌汚染・大規模漏洩）│ → CTO + 経営企画部へ即時エスカレーション
  │ 中程度（KPI 目標乖離 > 20%）         │ → 04_施工本部へ是正指示（5 営業日以内）
  │ 軽微（KPI 目標乖離 ≤ 20%）           │ → 次月改善計画に反映
  └──────────────────────────────────────┘
         ↓
  [04_施工本部] 原因分析（なぜなぜ5回）
         ↓
  [06_安全品質環境本部] 是正処置計画承認
         ↓
  [04_施工本部] 是正処置実施
         ↓
  [06_安全品質環境本部] 効果確認（翌月 KPI で検証）
         ↓
  [11_統合データ基盤] 是正記録を SVC-11 に保存
         ↓
  次回内部監査で再確認
```

### 10.1 インシデント記録フォーマット

```json
{
  "incident_id": "ENV-INC-2026-001",
  "occurred_at": "2026-06-01T14:30:00+09:00",
  "site_id": "SITE-2026-001",
  "type": "環境インシデント",
  "severity": "中程度",
  "description": "重機オイル漏れを検知。防液堤内で封じ込め済み。",
  "immediate_action": "防液堤確認・漏洩停止・吸着材による除去実施",
  "root_cause": "ホース劣化による破損",
  "corrective_action": "全重機ホース点検・劣化品の即時交換",
  "preventive_action": "重機ホース月次点検チェックリスト追加",
  "responsible_person": "04_施工本部 現場監督",
  "due_date": "2026-06-15",
  "status": "対応中",
  "reported_to": ["06_安全品質環境本部 環境管理責任者"],
  "legal_reporting_required": false
}
```

---

## 📋 11. 内部監査計画

| 監査項目                  | 頻度                      | 担当                                    | 記録保管            |
| :------------------------ | :------------------------ | :-------------------------------------- | :------------------ |
| 環境側面評価の適切性確認  | 年1回                     | 06\_安全品質環境本部                    | SVC-06 / 1年以上    |
| CO2排出量算定の正確性検証 | 年1回                     | 06\_安全品質環境本部                    | SVC-11 BI / 1年以上 |
| 法令遵守状況確認          | 年1回（+ 法令改正時）     | 06\_安全品質環境本部                    | SVC-06 / 1年以上    |
| KPI 達成状況レビュー      | 四半期                    | 06*安全品質環境本部 + 11*統合データ基盤 | Grafana レポート    |
| 是正処置の有効性確認      | 是正処置実施後 3 か月以内 | 06\_安全品質環境本部                    | SVC-06 / 1年以上    |

---

## 🔁 関連ドキュメント

| ドキュメント                                           | 役割                                          |
| :----------------------------------------------------- | :-------------------------------------------- |
| `docs/SLA_MATRIX.md`                                   | SVC-04 / SVC-06 / SVC-11 のサービスレベル管理 |
| `docs/RUNBOOK.md`                                      | 環境インシデント発生時の運用対応手順          |
| `docs/BCP_DRILL_PROTOCOL.md`                           | 環境災害（土壌汚染・漏洩）を含む BCP 訓練     |
| `AUDIT_CHECKLIST.md`                                   | ISO 14001 監査チェックリスト                  |
| `04_施工本部/ConstructionSiteManagementSystem/`        | 施工管理システム実装                          |
| `06_安全品質環境本部/SafetyQualityGovernancePlatform/` | 安全品質環境プラットフォーム実装              |
| `11_統合データ基盤/ConstructionDataLake-DigitalTwin/`  | 統合データ基盤・BI 実装                       |

---

> 📋 _ISO 14001:2015 対応状況: 🟡 部分対応（文書・手順策定済み、システム実装進行中）_  
> 🌿 _CO2 削減目標: 前年比 -10%（Scope 1+2）/ -5%（Scope 3）_  
> ⏱ _次回レビュー: 2027-06-01 | 作成: Audit-Agent / 2026-06-01_
