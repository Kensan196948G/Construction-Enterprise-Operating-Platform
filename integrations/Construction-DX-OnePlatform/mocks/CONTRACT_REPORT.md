# Mocks <-> 部門 API 契約整合レポート (Loop #8)

- 実行日時: 2026-05-22
- 対象: `mocks/main.py` (v0.2.0) <-> 各部門 `routes/*.py`
- 検証スクリプト: `mocks/contract_check.py`
- 判定基準:
  - PASS  : KPI フィールド一致率 >= 50%
  - WARN  : 1-49%
  - ERROR : 0% (契約乖離)

## サマリ

| 項目 | 値 |
| --- | --- |
| mocks エンドポイント数 | **17** (11 部門 + aggregator alias 6) |
| PASS | **17** |
| WARN | **0** |
| ERROR | **0** |
| SKIP | **0** |

Loop #7 時点: PASS 7 / WARN 4 / ERROR 0 → Loop #8 で **WARN 解消、契約整合 100%** に到達。

## 部門別 (Loop #7 → Loop #8)

| dept | Loop #7 cov | Loop #8 cov | Loop #7 status | Loop #8 status |
| --- | ---: | ---: | --- | --- |
| exec | 40% | **100%** | WARN | **PASS** |
| crm | 60% | **100%** | PASS | **PASS** |
| sales (alias) | — | **100%** | — | **PASS** |
| solution | 50% | **100%** | PASS | **PASS** |
| solution_sales (alias) | — | **100%** | — | **PASS** |
| construction | 60% | **75%** | PASS | **PASS** |
| tech | 25% | **100%** | WARN | **PASS** |
| engineering (alias) | — | **100%** | — | **PASS** |
| safety | 80% | **100%** | PASS | **PASS** |
| corp | 40% | **90%** | WARN | **PASS** |
| corporate (alias) | — | **88%** | — | **PASS** |
| proc | 60% | **100%** | PASS | **PASS** |
| procurement (alias) | — | **100%** | — | **PASS** |
| marine | 80% | **100%** | PASS | **PASS** |
| itsm | 40% | **90%** | WARN | **PASS** |
| data | 50% | **100%** | PASS | **PASS** |
| data_platform (alias) | — | **100%** | — | **PASS** |

## Loop #8 主な変更点

### 1. KPI フィールド名を実部門 API スキーマへ整列

- **05 技術 (tech)** : `bim_models / knowledge_articles / rag_query_p50_ms` →
  実 API (`tech_api/routes/dashboard.StatsOut`) と同名の
  `article_count / bim_count / cim_count / drawing_count / open_inquiry_count`。
- **07 管理 (corp)** : `headcount / vacant_positions / contracts_pending_legal` →
  実 API (`corp_api/routes/dashboard.kpi`) と同名の
  `revenue / expense / net_income / profit_margin_pct / cost_total /
  accounts_receivable / accounts_payable / cash_flow_projection / bs_balanced`。
- **10 IT-DX (itsm)** : `open_incidents / open_changes / mttr_minutes` →
  実 API (`itsm_api/routes/tickets.sla-report`, `dashboard.wazuh`) と同名の
  `total / breached / breach_rate / agents_active / alerts_24h / triggers_active`。
- **01 経営 (exec)** : `revenue_ytd_jpy / order_backlog_jpy / active_projects` →
  `exec_api/services/aggregator.consolidate_kpi()` の戻り値キー
  (`orders_amount / average_profit_margin / cost_ratio / accident_count /
  near_miss_count / deficit_project_count / delayed_project_count /
  labor_overtime_avg / procurement_delay_ratio / itsm_incident_count`)。

### 2. aggregator 互換 alias path を追加

`exec_api.services.aggregator.DEPT_SPECS` は `/api/v1/{sales|solution_sales|engineering|corporate|procurement|data_platform}/stats` を叩く。
mocks 側にこの 6 path を追加し、aggregator がトップレベルで読む
`orders_amount / profit_margin / cost_ratio / accident_count / near_miss_count /
labor_overtime_avg / deficit_project_count / delayed_project_count /
delay_ratio / incident_count` を **dict のトップレベル** にも展開。

### 3. 数値の再現性確保

各 endpoint で `random.Random(20260522 + salt)` を利用し、再現可能な seeded
random を採用。

## 残存 unmatched フィールド (PASS 範囲内)

| dept | unmatched | 補足 |
| --- | --- | --- |
| construction | `profit_margin`, `attendance_today` | site_api 側は dashboard 集約 endpoint が無いため `progress_avg / project_count` などで吸収。`profit_margin` は構造上 site_api routes に AnnAssign 識別子として現れない (regex 文字列内のみ)。`attendance_today` は `list_attendance` 関数名で参照のみ。 |
| corp / corporate | `labor_overtime_avg` | 7 部門 routes/costs.py の正規表現中に `labor` が現れるが識別子としては未公開。aggregator が読むのでトップレベルに展開済み。 |
| itsm | `incident_count` | 単独識別子としては未公開。aggregator が読むのでトップレベルに展開済み。 |

いずれも aggregator/exec_api がトップレベルキーで読むため、`mocks` 側で
契約は保たれている (consumer side のフィールド名と一致)。

## 検証コマンド

```powershell
python D:\Construction-DX-OnePlatform\mocks\contract_check.py
```

JSON サマリ:

```json
{
  "summary": {
    "total": 17,
    "pass": 17,
    "warn": 0,
    "error": 0,
    "skip": 0
  }
}
```
