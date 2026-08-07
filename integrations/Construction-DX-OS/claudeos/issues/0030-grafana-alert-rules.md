---
id: "0030"
title: "Grafana アラートルール設定 (heartbeat 停止 + ISO build 失敗率)"
status: done
priority: P2
phase: "Phase 3"
labels: [monitoring, grafana, alerting]
created: "2026-05-06"
---

## Summary

Issue 0027 で Grafana ダッシュボードを構築した。
次のステップとしてアラートルールを追加し、問題を自動検知できるようにする。

## アラート条件

| アラート名 | 条件 | 重大度 |
|---|---|---|
| HeartbeatStopped | 特定デバイスの heartbeat_total が5分間増加しない | Warning |
| ISOBuildFailureRate | ISO build 失敗率 > 20% (5m window) | Critical |
| RateLimitSpike | rate_limit_hits_total が 10/min を超える | Warning |

## Acceptance Criteria

- [ ] Grafana Provisioning で alertrules.yaml を自動登録
- [ ] docker-compose up で自動適用
- [ ] Alert Notification Channel の設定（ログ出力のみで可）
