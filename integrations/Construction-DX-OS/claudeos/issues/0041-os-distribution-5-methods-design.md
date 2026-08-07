---
id: "0041"
title: "OS 配布: 5 方式 要件定義 + 詳細設計仕様 (PXE 重点)"
status: closed
priority: P1
phase: "Phase 3"
labels: [distribution, pxe, ipxe, preseed, security, iso, design, requirements]
created: "2026-05-06"
closed: "2026-05-06"
---

## Summary

Construction-DX-OS の本番展開で利用する **OS 配布 5 方式** について、要件定義・詳細設計仕様を整備する。
ユーザー指定により、PXE 関連 (PXE+iPXE+HTTP / PXE+preseed 完全自動) は多くの設定事項に留意して詳細化する。

成果物の正本: `docs/05_クライアントOS（Client-OS）/04a_配布5方式詳細仕様（Distribution-5-Methods-Detailed）.md`

## 5 配布方式（導入順序）

| 順 | 方式 | 用途 | 規模 | スピード |
|---|---|---|---|---|
| 1 | **WebUI / S3 ダウンロード** | 情シス検証用 | 1〜数台 | 即時 |
| 2 | **VM ISO マウント** | 検証 / オンボーディング VM 量産 | 1〜数十台 | 中 |
| 3 | **USB メモリ配布** | 拠点キッティング、現場ノート | 数台〜数十台 | 中 |
| 4 | **PXE / iPXE + HTTP** | 本社・支店・同一 LAN 内の複数台展開 | 数十〜数百台 | 高 |
| 5 | **PXE + preseed 完全自動化** | 大規模一斉キッティング | 100 台超 | 最高 |

## 各方式 詳細手順（要件）

### 方式 1: WebUI / S3 ダウンロード（情シス検証用）

1. 管理 WebUI の ISO Builder UI で profile を選択 (standard/field/kiosk)
2. ビルドキューイング (`POST /api/v1/iso-builds`)
3. build-worker 完了通知を SSE で受信
4. WebUI から「⬇️ ISO ダウンロード」（presigned URL）
5. 検証端末でローカルに保存
6. SHA256 を WebUI と突合
7. VM (qemu/VirtualBox/VMware) または物理機にマウント
8. 起動 → preseed 自動応答 → 自動インストール
9. cdx-agent 自動登録（端末側 `agent-bootstrap.sh` が安全経路で token 取得）

### 方式 2: VM ISO マウント

1. ISO 取得（方式 1 のステップ 1〜6）
2. VM プラットフォーム選択 (Hyper-V / VMware ESXi / Proxmox)
3. テンプレート VM 作成 (vCPU=2, RAM=4 GB, Disk=40 GB)
4. ISO を仮想 CD/DVD ドライブにアタッチ
5. ブート順序を CD 優先に変更
6. VM 電源 ON → preseed 自動応答
7. cdx-agent 自動登録 → ring=ring1 に配置
8. テンプレート化（リネージ用 base image として保存）
9. リネージ複製で N 台展開
10. 各クローンの hostname / fingerprint を更新後、registration token で再登録

### 方式 3: USB メモリ配布

1. ISO 取得（方式 1 のステップ 1〜6）
2. USB メモリを準備 (8 GB 以上、USB 3.0 推奨)
3. 起動可能 USB 化 (Linux: `sudo dd if=*.iso of=/dev/sdX bs=4M conv=fsync` / Windows: Rufus)
4. 拠点責任者へ物理配送 (郵便 / 宅配 / 持参)
5. 受領拠点で対象端末に挿入 → BIOS で USB 起動を選択
6. 自動インストール開始 (preseed)
7. ネットワーク到達確認後、cdx-agent が `agent-bootstrap.sh` を実行
8. registration token 取得 → 端末登録 → ring 配置
9. 拠点担当者が WebUI から登録完了を確認

### 方式 4: PXE / iPXE + HTTP（本社・支店・同一 LAN 内の複数台展開）

1. **PXE サーバ準備**: dnsmasq (DHCP+TFTP+PXE 一体型) または ISC DHCP + tftpd-hpa
2. **HTTP 配布サーバ準備**: nginx に `/srv/pxe/` をマウント、ISO の `vmlinuz` / `initrd.img` / squashfs を配置
3. **iPXE chainload**: pxelinux.0 (Legacy BIOS) + grubnetx64.efi.signed (UEFI Secure Boot) → iPXE → HTTP boot
4. **DHCP option 設定**: option 66 (TFTP server) + option 67 (boot file = ipxe.efi/undionly.kpxe)
5. **DHCP Relay** (マルチサブネット): Cisco `ip helper-address` / YAMAHA `dhcp scope` で本社 PXE サーバへ転送
6. **Firewall**: 本社 PXE サーバへ DHCP/67-68 + TFTP/69 + HTTP/80 を許可
7. **ISO 展開**: `mount -o loop *.iso /mnt && cp -r /mnt/{vmlinuz,initrd.img,live/filesystem.squashfs} /srv/pxe/`
8. **systemd unit 管理**: `systemd-tftpd.service` + `nginx.service` を `enable --now`
9. **帯域制御**: nginx `limit_rate 100m;` + `limit_conn addr 10;` で同時配信を制限（1 GbE 8 並列 / 10 GbE 30 並列）
10. **監視**: Prometheus exporter (nginx_exporter / pxe_boot_metrics) でブート進捗・失敗率を可視化
11. **Rollback**: 失敗時に旧 ISO へ symlink 切替 (6 パターン: full/profile/ring/site/single/abort)

### 方式 5: PXE + preseed 完全自動化（大規模一斉キッティング）

方式 4 の PXE インフラを土台に、**preseed.cfg で完全無人化**する。

1. 方式 4 の PXE/iPXE+HTTP 配信基盤を完成させる
2. **preseed テンプレート整備**: `/srv/pxe/preseed/{standard,field,kiosk}.cfg` で profile 別に用意
3. **BIOS/UEFI dual menu**: pxelinux.cfg/default + grub.cfg で BIOS/UEFI 両対応の preseed メニュー
4. **kernel command line**: `auto=true priority=critical preseed/url=http://pxe.example.local/preseed/standard.cfg locale=ja_JP keymap=jp`
5. **post-install hook**: preseed の `late_command` で `/usr/local/bin/agent-bootstrap.sh` を取得・実行
6. **registration token 取得**: ISO/preseed には**埋め込まない**。post-install で `POST /api/v1/devices/registration-tokens` を mTLS で叩き、ephemeral token を取得
7. **token rotation**: 取得した token は 24 時間で expire、agent は `POST /api/v1/auth/rotate` で更新
8. **5 台先行リハーサル必須**: BIOS/UEFI 混在環境で必ず 5 台の事前検証を実施
9. **帯域・並列制御**: nginx limit_rate + QoS で他業務影響を抑制（昼休み/夜間配信推奨）
10. **Prometheus アラート**: ブート失敗率 > 5% / 配信時間 > 30 min で PagerDuty 通知
11. **6 パターン rollback**: ring 単位 / site 単位 / profile 単位 / 単一端末 / 全停止 / 旧 ISO 復帰
12. **監査ログ**: 各端末の registration / token rotation / first boot を `audit_logs` に request-id 連鎖で記録

## セキュリティ要件（全方式共通 + PXE 強化）

| 項目 | 要件 | 適用方式 |
|---|---|---|
| token 直埋め込み禁止 | ISO/preseed/USB image に CDX_REGISTRATION_TOKEN を含めない | 全方式 |
| ephemeral token | 24 h で expire、1 端末 1 回限り | 4, 5 |
| mTLS 必須 | post-install から token API 取得時 | 4, 5 |
| SHA256 検証 | ISO/preseed の整合性を WebUI で表示・突合 | 全方式 |
| BIOS/UEFI 混在検証 | 5 台事前検証で UEFI Secure Boot 互換確認 | 4, 5 |
| 帯域制御 | nginx limit_rate / QoS で業務影響を遮断 | 4, 5 |
| 監査ログ | request-id 連鎖で registration → boot → registration 完了まで追跡 | 全方式 |

## Acceptance Criteria

- [x] 5 配布方式すべての詳細手順を 9〜12 ステップで明示
- [x] PXE 関連の設定事項（DHCP relay, UEFI/BIOS dual, 帯域, rollback）を 11+ ステップで明示
- [x] preseed 完全自動化の token 直埋め込み禁止を明記
- [x] 5 台先行リハーサル要件を明記
- [x] `docs/05_クライアントOS（Client-OS）/04a_配布5方式詳細仕様...md` 作成
- [x] `docs/05_クライアントOS（Client-OS）/04_インストール・配布設計...md` から 04a へ参照リンク追加
- [x] README.md に「OS 配布 5 方式」サマリ追加
- [x] テスト追加（最小: 詳細設計ファイル存在チェック — `tests/test_distribution_doc.py`、6 テスト）

## Out of Scope (Issue 0042 で扱う)

- DHCP/TFTP/HTTP の実サーバ構築 (dnsmasq.conf, nginx.conf, systemd unit)
- preseed.cfg テンプレート (standard/field/kiosk)
- agent-bootstrap.sh の本実装
- registration token API (`POST /api/v1/devices/registration-tokens`)
- token rotation API (`POST /api/v1/auth/rotate`)
- Prometheus exporter / アラート定義
- 6 パターン rollback の自動化スクリプト

## 参考

- 設計バンドル: D7fRYOT0_vawatKMQzm4dg (proto-page-iso.jsx に 5 方式クリック解説あり)
- chat 履歴: `/tmp/cdx-design-v2/construction-dx-os/chats/chat1.md` (1156 行、設計確定の経緯)
- 既存ドキュメント: `docs/05_クライアントOS（Client-OS）/04_インストール・配布設計（Installation-and-Distribution）.md`
