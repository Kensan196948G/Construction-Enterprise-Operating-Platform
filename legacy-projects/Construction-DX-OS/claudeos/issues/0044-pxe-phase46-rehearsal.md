---
id: "0044"
title: "PXE Phase 4.6 — 5台先行リハーサル (BIOS/UEFI Secure Boot 互換確認)"
status: open
priority: P2
phase: "Phase 4.6"
labels: [distribution, pxe, testing, hardware, rehearsal]
created: "2026-05-13"
parent: "0042"
---

## Summary

Issue 0042 Phase 4.1-4.5 で PXE インフラ・preseed・トークン API・Prometheus・rollback スクリプト・WebUI を完成させた。
Phase 4.6 として残る **実機を使った 5 台先行リハーサル** を実施する。

## Scope

Issue 0041 の Acceptance Criteria の最終項:

> 5 台先行リハで BIOS/UEFI Secure Boot 互換確認

1. **BIOS デバイス 2 台**: PXE → preseed → agent-bootstrap.sh → cdx-agent 起動 を End-to-End 確認
2. **UEFI Secure Boot デバイス 2 台**: iPXE chainload (grubnetx64.efi) → preseed → cdx-agent 起動
3. **ハイブリッド 1 台**: DHCP option 93 (client-arch) による BIOS/UEFI 自動判別

## Acceptance Criteria

- [ ] BIOS デバイスが dnsmasq → TFTP → pxelinux.0 → kernel/initrd → preseed の全フロー完走
- [ ] UEFI Secure Boot デバイスが dnsmasq → grubnetx64.efi → iPXE chain → preseed 完走
- [ ] agent-bootstrap.sh が `POST /api/v1/devices/registration-tokens` を成功させ、cdx-agent が起動
- [ ] Prometheus に `cdx_pxe_boot_total{event="bootstrap_complete"}` が記録される
- [ ] 失敗ケースで `cdx_pxe_boot_total{event="bootstrap_failed"}` が記録される
- [ ] 全 5 台の監査ログが request-id 連鎖で追跡可能

## 前提条件

- Phase 4.1-4.5 が main にマージ済み (PR #35)
- 実機 LAN 環境 (dnsmasq + nginx が稼働可能な物理/仮想サーバ)
- BIOS/UEFI 混在の x86 デバイス 5 台以上
- cdx-server が `CDX_BOOTSTRAP_SECRET` 設定済みで稼働中

## 実施メモ

- 本 Issue は実機環境なしには完結できないため、Phase 4.5 のコード完成を待って別タスクとして計画する
- 実機リハの記録 (ログ, journalctl, Prometheus スクリーンショット) を `docs/05_クライアントOS/04b_PXE実機リハーサル記録.md` に保存する

## 参考

- 親 Issue: `0042-pxe-distribution-implementation.md`
- 詳細仕様: `docs/05_クライアントOS（Client-OS）/04a_配布5方式詳細仕様.md`
- Rollback スクリプト: `deployment/pxe/rollback/`
