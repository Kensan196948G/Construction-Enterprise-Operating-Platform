---
id: "0042"
title: "OS 配布: PXE/iPXE+HTTP / PXE+preseed 完全自動化 — 実装本工程"
status: open
priority: P2
phase: "Phase 4"
labels: [distribution, pxe, ipxe, preseed, dnsmasq, nginx, security, implementation]
created: "2026-05-06"
parent: "0041"
---

## Summary

Issue 0041 で要件定義・詳細設計仕様を確定した **OS 配布 5 方式の方式 4/5（PXE/iPXE+HTTP, PXE+preseed 完全自動化）** の本実装を行う。
Issue 0041 の Out of Scope 8 項目をそれぞれ自己完結したサブ Issue（または PR ロット）として段階的に投入する。

## Scope (8 サブタスク)

1. **dnsmasq.conf**: DHCP+TFTP+PXE 一体型サーバ設定。option 66/67、UEFI/BIOS dual menu
2. **nginx.conf**: HTTP 配布サーバ。`limit_rate 100m;` + `limit_conn addr 10;`、`/srv/pxe/` mount、SSL 不要（同一 LAN 想定）だが整合検証用に SHA256 サブパス公開
3. **systemd unit**: `dnsmasq.service` / `nginx.service` の `enable --now`、ログ rotate、再起動後の自動復帰
4. **preseed.cfg テンプレート**: `standard.cfg` / `field.cfg` / `kiosk.cfg` を 04a § preseed 仕様どおりに整備。`late_command` で `agent-bootstrap.sh` をフェッチ
5. **agent-bootstrap.sh 本実装**: mTLS で `POST /api/v1/devices/registration-tokens` を叩き、ephemeral token を取得 → cdx-agent へ wire
6. **registration token API**: `POST /api/v1/devices/registration-tokens` (mTLS、24h expire、1 端末 1 回限り)
7. **token rotation API**: `POST /api/v1/auth/rotate` (24h で rotate、agent 自動更新)
8. **Prometheus exporter + アラート**: `pxe_boot_metrics` exporter、ブート失敗率 > 5% / 配信時間 > 30 min で PagerDuty 通知
9. **6 パターン rollback 自動化**: ring 単位 / site 単位 / profile 単位 / 単一端末 / 全停止 / 旧 ISO 復帰 — 切替スクリプト + WebUI の rollback ボタン

## 実装順序（推奨）

```
Phase 4.1 (基盤): dnsmasq.conf + nginx.conf + systemd unit
Phase 4.2 (preseed): preseed.cfg 3 profile + agent-bootstrap.sh 雛形
Phase 4.3 (token): registration token API + token rotation API + agent-bootstrap.sh 完成
Phase 4.4 (監視): Prometheus exporter + アラート + Grafana dashboard
Phase 4.5 (rollback): 6 パターン rollback 自動化 + WebUI 統合
Phase 4.6 (検証): 5 台先行リハーサル (BIOS/UEFI 混在環境)
```

各 Phase は独立 PR を持ち、Issue 0041 の **§ Acceptance Criteria** の対応行を満たす。

## Acceptance Criteria

- [ ] dnsmasq + nginx で本社 PXE サーバが LAN ブート可能
- [ ] preseed 自動応答で標準/現場/キオスクの 3 profile を無人インストール可能
- [ ] registration token は ISO/preseed に直埋めしない（mTLS + 24h ephemeral）
- [ ] 5 台先行リハで BIOS/UEFI Secure Boot 互換確認
- [ ] Prometheus アラート発火 → PagerDuty 通知の E2E 動作確認
- [ ] 6 パターン rollback すべての切替スクリプトが整備されている
- [ ] 監査ログ (registration → token rotation → first boot) が request-id 連鎖で追跡可能

## 参考

- 親 Issue: `claudeos/issues/0041-os-distribution-5-methods-design.md`
- 詳細仕様: `docs/05_クライアントOS（Client-OS）/04a_配布5方式詳細仕様（Distribution-5-Methods-Detailed）.md`
