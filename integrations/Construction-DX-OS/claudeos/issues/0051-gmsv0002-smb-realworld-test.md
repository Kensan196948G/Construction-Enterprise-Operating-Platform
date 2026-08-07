# Issue 0051: GMSV0002 実機SMBマウント + easyocr 本番テスト

**Priority**: P2 (品質 / 実機検証)
**Status**: Open
**Phase**: Verify
**Created**: 2026-05-14 (Loop 87)

## 概要

Loop 87 で実装した GMSV0002 SMB→easyocr OCRパイプライン (`serial_scan.py`) を、
実際のファイルサーバーとeasyocrで動作確認する。

## 前提条件

- GMSV0002 SMBサーバーが社内ネットワーク上で稼働している
- cdx-server ホストに `/etc/cdx-smb.creds` が設定されている
- `pip install easyocr` が cdx-server 環境に完了している
- SMBマウント: `/mnt/gmsv0002-serial`

## 受入れ条件

- [ ] `SERIAL_SCAN_MOCK=0 SERIAL_SCAN_PATH=/mnt/gmsv0002-serial` で起動
- [ ] `GET /api/v1/serial/status` → `mounted: true`
- [ ] iPhone から GMSV0002 に画像を転送
- [ ] `POST /api/v1/serial/scan` → OCR結果がキューに追加される
- [ ] OCR精度: 80%以上 (6〜20文字英数字シリアル番号)
- [ ] `POST /api/v1/serial/confirm/{id}` → 展開台帳に登録される

## 環境変数

```bash
SERIAL_SCAN_PATH=/mnt/gmsv0002-serial
SERIAL_SCAN_MOCK=0
```

## /etc/fstab 設定例

```
//GMSV0002/cdx-serial-scans /mnt/gmsv0002-serial cifs credentials=/etc/cdx-smb.creds,uid=www-data,gid=www-data,ro,_netdev 0 0
```

## /etc/cdx-smb.creds 設定例（chmod 600 必須）

```
username=cdxadmin
password=<password>
domain=MIRAI
```

## 依存 Issue

- Issue 0042: PXE Phase 4.6 (実機リハーサル)
- Loop 87: serial_scan.py 実装完了

## 将来の改善

インメモリキュー (`_ocr_queue`) を PostgreSQL に移行して再起動耐性を持たせる。
