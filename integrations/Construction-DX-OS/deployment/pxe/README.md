# PXE Server Deployment Guide

Construction-DX-OS の PXE ブートサーバー設定ファイル群です。
Issue 0042 Phase 4.1〜4.4 で整備しました。

> 関連: [`../README.md`](../README.md) | [`../monitoring/README.md`](../monitoring/README.md)

---

## ディレクトリ構成

```
pxe/
├── dnsmasq/
│   └── dnsmasq.conf          # DHCP/TFTP サービス設定
├── nginx/
│   └── nginx-pxe.conf        # preseed / squashfs 配信 (HTTP)
├── preseed/
│   ├── standard.cfg          # 標準オフィス向けプリセット
│   ├── kiosk.cfg             # キオスク端末向けプリセット
│   └── field.cfg             # 現場端末向けプリセット
├── srv-pxe/
│   └── agent-bootstrap.sh    # 初回起動時エージェント登録スクリプト
├── systemd/
│   └── cdx-pxe-server.service
└── tftpboot/
    └── boot.ipxe             # iPXE ブートスクリプト
```

---

## 前提

- Ubuntu 22.04 LTS / Debian 12 以降
- `dnsmasq`, `nginx`, `isc-dhcp-server` がインストール済み
- cdx-os-server が `:8300` で稼働中かつ registration token API が有効

---

## セットアップ

```bash
# 1. dnsmasq 設定
sudo cp dnsmasq/dnsmasq.conf /etc/dnsmasq.d/cdx-pxe.conf
sudo systemctl restart dnsmasq

# 2. nginx 配信設定
sudo cp nginx/nginx-pxe.conf /etc/nginx/sites-available/cdx-pxe
sudo ln -s /etc/nginx/sites-available/cdx-pxe /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 3. tftpboot 配置
sudo mkdir -p /srv/tftp
sudo cp tftpboot/boot.ipxe /srv/tftp/

# 4. preseed / bootstrap スクリプト配置
sudo mkdir -p /srv/pxe
sudo cp preseed/*.cfg /srv/pxe/
sudo cp srv-pxe/agent-bootstrap.sh /srv/pxe/
sudo chmod 755 /srv/pxe/agent-bootstrap.sh

# 5. systemd サービス
sudo cp systemd/cdx-pxe-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cdx-pxe-server
```

---

## 環境変数

| 変数 | 用途 | 既定 |
|---|---|---|
| `CDX_SERVER_URL` | cdx-os-server の URL | `http://localhost:8300` |
| `CDX_BOOTSTRAP_SECRET` | agent-bootstrap.sh 認証共有秘密 | — (必須) |

`/etc/cdx-pxe.env` に設定し、systemd の `EnvironmentFile=` で読み込む。

---

## 観測メトリクス

cdx-os-server が公開する PXE 関連 Prometheus メトリクス:

| メトリクス | 型 | 説明 |
|---|---|---|
| `cdx_pxe_boot_total{event="token_issued"}` | Counter | 発行した登録トークン数 |
| `cdx_pxe_boot_total{event="bootstrap_complete"}` | Counter | ブートストラップ成功数 |
| `cdx_pxe_boot_total{event="bootstrap_failed"}` | Counter | ブートストラップ失敗数 |
| `cdx_pxe_provisioning_seconds` | Histogram | token_issued → bootstrap_complete 所要時間 |

Grafana アラートルールは `../monitoring/grafana/alerting/pxe_alerts.yaml` を参照。

---

## Troubleshooting

### PXE Boot Failure Rate > 5%

Grafana アラート `pxe-boot-failure-rate` が発火した場合、以下の順で確認する。

1. **dnsmasq logs**: `journalctl -u dnsmasq -n 100`
2. **nginx logs**: `journalctl -u nginx -n 100`
3. **agent-bootstrap.sh logs**: `/var/log/cdx-bootstrap.log` on the target device
4. **Registration token API**: Check cdx-server logs for `registration token issued` or auth failures
5. **Bootstrap secret**: Verify `CDX_BOOTSTRAP_SECRET` env var matches in preseed.cfg and cdx-server

### PXE Provisioning Slow (P95 > 30min)

Grafana アラート `pxe-provisioning-slow` が発火した場合:

1. Check network bandwidth between PXE server and clients
2. Verify nginx `limit_rate 100m` is appropriate for your environment
3. Check cdx-server load: `systemctl status cdx-os-server`

### 端末が DHCP アドレスを取得できない

1. `ip link` で PXE サーバーの NIC が `UP` であるか確認
2. `dnsmasq.conf` の `interface=` と `dhcp-range=` がサブネットと一致しているか確認
3. `firewall-cmd --list-all` で UDP 67/68/69 が許可されているか確認

### iPXE が起動しない

1. `/srv/tftp/boot.ipxe` の存在と権限を確認: `ls -la /srv/tftp/`
2. `dnsmasq.conf` の `dhcp-boot=` に `boot.ipxe` が正しく設定されているか確認
3. BIOS / UEFI の PXE boot 順序設定を確認

### Metric Reference

| Metric | Description |
|--------|-------------|
| `cdx_pxe_boot_total{event="token_issued"}` | Registration tokens issued |
| `cdx_pxe_boot_total{event="bootstrap_complete"}` | Successful bootstraps |
| `cdx_pxe_boot_total{event="bootstrap_failed"}` | Failed bootstraps |
| `cdx_pxe_provisioning_seconds` | Time from token_issued to bootstrap_complete |
