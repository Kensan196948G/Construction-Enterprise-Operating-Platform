---
id: "0055"
title: "Grafana アラート通知先 (Contact Point) + 通知ポリシー provisioning"
status: open
priority: P2
phase: "Phase 9"
labels: [monitoring, grafana, alerting, ops]
created: "2026-06-15"
related: ["0054", "0027"]
---

## Summary

Issue 0054 で Grafana アラートルール (PromQL) を正しいメトリクスに修正したが、
**Contact Point（通知先）** が設定されていないためアラートが誰にも届かない。
環境変数経由でメール / Webhook 通知先を設定できる provisioning ファイルを追加する。

## 問題点

`monitoring/grafana/provisioning/alerting/cdx-server-rules.yaml` でアラートが
`Alerting` 状態になっても受信者が設定されていないため、Grafana の "grafana-default-email"
(noreply 送信・実質ブラックホール) に届くだけで運用者への通知が飛ばない。

## 実装内容

### 追加ファイル

- `monitoring/grafana/provisioning/alerting/contact-points.yaml`
  - `CDX_ALERT_EMAIL` env var を読んで email contact point を設定
  - 未設定時は noreply fallback（起動は壊れない）
- `monitoring/grafana/provisioning/alerting/notification-policies.yaml`
  - `cdx-server` ラベルのアラートを cdx-ops contact point へルーティング
  - グループ化: `grafana_folder` + `alertname`

### 変更ファイル

- `.env.prod.example` — `CDX_ALERT_EMAIL`, `GF_SMTP_HOST` などを追記
- `docker-compose.yml` — Grafana サービスへ SMTP env vars を pass
- `deployment/monitoring/README.md` — 通知設定手順を追記

## Acceptance Criteria

- [ ] `CDX_ALERT_EMAIL=ops@example.com` 設定で `docker-compose up grafana` が正常起動
- [ ] Grafana UI > Alerting > Contact points に "cdx-ops" が表示される
- [ ] Grafana UI > Alerting > Notification policies に cdx-server ルーティングが表示される
- [ ] `CDX_ALERT_EMAIL` 未設定でも起動エラーにならない（fail-open）
- [ ] RUNBOOK.md の「通知設定」セクションが更新されている

## 参考

- Grafana provisioning contact points: https://grafana.com/docs/grafana/latest/alerting/set-up/provision-alerting-resources/file-provisioning/
- Issue 0054: サイレント監視障害修正 (アラートルール修正)
- Issue 0027: Grafana ダッシュボード設定
