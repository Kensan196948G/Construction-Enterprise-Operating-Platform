# Construction Hub (業務ランチャ MVP)

建設DX OS の業務導線統一画面。Phase 1 では **HTML + 軽量 Python サーバ** で
PoC を成立させ、Phase 2 で GTK / Electron 等の選択を再評価する。

## 起動方法 (PoC)

```bash
cd os/launcher/construction-hub
python3 -m construction_hub
# ブラウザが http://127.0.0.1:8765/ を開く
```

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | 業務カテゴリのカードレイアウト |
| `style.css` | XFCE 想定の落ち着いた配色 |
| `app.js` | 軽量タブ切替 (vanilla JS) |
| `construction_hub/__main__.py` | localhost で `http.server` 起動 + ブラウザ open |
| `construction-hub.desktop` | XFCE Application menu 登録用 |

## 業務導線 (PoC 段階で表示)

- 📋 日報入力
- 📷 写真アップロード
- 📐 図面ビューア
- 📦 案件 / 原価
- 📥 IT 申請
- 📚 ナレッジ

各リンクは現状ダミー。Phase 2 で URL 配信ポリシーと連動。
