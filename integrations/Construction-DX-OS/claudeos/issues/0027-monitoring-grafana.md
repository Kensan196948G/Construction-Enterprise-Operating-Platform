---
id: "0027"
title: "Monitoring: Grafana ダッシュボード設定 + アラートルール"
status: done
priority: P2
phase: "Phase 9"
labels: [monitoring, observability, grafana, prometheus]
created: "2026-05-06"
---

## Summary

既存の Prometheus メトリクス (`/metrics` エンドポイント) を Grafana で可視化する。
現状は Prometheus scrape 設定が `docker-compose.yml` にあるが、Grafana ダッシュボードが未設定。
情シス・運用チームが cdx-server の状態をグラフで把握できるようにする。

## 対象メトリクス

| メトリクス | タイプ | 説明 |
|---|---|---|
| `cdx_heartbeat_total{device_id,status}` | Counter | デバイス別ハートビート受信数 |
| `cdx_inventory_total{device_id,status}` | Counter | インベントリ受信数 |
| `cdx_rate_limit_hits_total{device_id,endpoint}` | Counter | レート制限ヒット数 |
| `cdx_iso_build_total{profile,status}` | Counter | ISO ビルドジョブ数 |
| `cdx_iso_build_audit_total{action}` | Counter | 監査ログ操作数 |

## 実装内容

- `monitoring/grafana/dashboards/cdx-server.json` — Grafana ダッシュボード JSON
- `monitoring/grafana/provisioning/` — 自動プロビジョニング設定
- `docker-compose.yml` — Grafana サービス追加（port: 3000）
- README: Grafana アクセス手順追記

## Acceptance Criteria

- [ ] `docker-compose up` で Grafana が起動する
- [ ] cdx-server ダッシュボードが自動ロードされる
- [ ] ハートビート・ISO ビルド・レート制限の時系列グラフが表示される
- [ ] アラートルール: ハートビート 0/5分 → warning
