---
id: "0040"
title: "Admin SPA: 新 Design Canvas バンドル (D7fRYOT0) 取り込み検証"
status: closed
priority: P3
phase: "Phase 3"
labels: [webui, admin, design, spa, verification]
created: "2026-05-06"
closed: "2026-05-06"
---

## Summary

Anthropic Design Canvas の新規バンドル (ハッシュ `D7fRYOT0_vawatKMQzm4dg`) を取得し、
既に PR #28 (Issue 0039) で取り込んだ前回バンドル (`NxV0inm-6ylqHbzfn2dCEA`) との差分を確認する。

ユーザー要望:
> 以下の URL にて既存 WebUI を修正してください。
> https://api.anthropic.com/v1/design/h/D7fRYOT0_vawatKMQzm4dg?open_file=建設DX+OS+管理WebUI.html

## 検証結果（Loop 73）

新バンドルは前回バンドルの**スーパーセット**であり、**配備対象 SPA 本体に変更はない**。

### proto-* + index.html: 完全一致

| ファイル | 前回バンドル | 新バンドル | 差分 |
|---|---|---|---|
| `index.html` (= 建設DX OS 管理WebUI.html) | 2,147 B | 2,147 B | なし |
| `proto-app.jsx` | 4,864 B | 4,864 B | なし |
| `proto-data.jsx` | 10,586 B | 10,586 B | なし |
| `proto-page-dashboard.jsx` | 8,552 B | 8,552 B | なし |
| `proto-page-devices.jsx` | 28,211 B | 28,211 B | なし |
| `proto-page-iso.jsx` | 67,907 B | 67,907 B | なし |
| `proto-page-rings.jsx` | 29,771 B | 29,771 B | なし |
| `proto-page-security.jsx` | 50,573 B | 50,573 B | なし |
| `proto-page-settings.jsx` | 61,552 B | 61,552 B | なし |
| `proto-page-others.jsx` | 19,707 B | 19,707 B | なし |

### 新バンドルが追加で含むファイル

| ファイル | サイズ | 用途 | 配備要否 |
|---|---|---|---|
| `Construction-DX-OS Design.html` | 1.3 KB | Canvas シェル (design-canvas.jsx + webui-designs.jsx をロード) | ❌ 開発専用 |
| `design-canvas.jsx` | 48 KB | Canvas 編集環境 | ❌ 開発専用 |
| `admin-designs.jsx` | 37 KB | 管理画面案探索版 | ❌ 開発専用 |
| `hub-designs.jsx` | 21 KB | Construction Hub 案探索版 | ❌ 開発専用 |
| `webui-designs.jsx` | 52 KB | WebUI 案探索版 | ❌ 開発専用 |
| `app-main.jsx` | 1 KB | Canvas エントリ | ❌ 開発専用 |
| `.design-canvas.state.json` | 204 B | Canvas 内部状態 | ❌ 開発専用 |
| `os/launcher/construction-hub/{index.html,style.css,app.js}` | 2 KB + 4 KB + 5 KB | Phase 1 端末ランチャ素案 | ⚠️ Phase 1 別経路で導入予定 |
| `server/api/templates/admin/*.html` (5 件) + `base.html` | 計 459 行 | **過去スナップショット** | ❌ ローカル版が新しい |

`server/api/templates/` 比較:
- `base.html`: 完全一致
- `admin/devices.html`: ローカル版が `fleet-summary` を含む拡張版（バンドル版より進化済み）
- `admin/iso_*.html`, `device_detail.html`: 軽微な差分のみ。ローカル優先

### 結論

| 判定 | 理由 |
|---|---|
| **配備対象 SPA に変更なし** | `index.html` + `proto-*` 全 9 ファイルが前回と同一 |
| **新規 jsx ファイルは取り込み不要** | Canvas 編集用イテレーション履歴で本番不要 |
| **Phase 1 hub launcher は別 Issue で扱う** | `os/launcher/construction-hub/` は Construction Hub 配下の別配備物 |

ユーザーが意図した「既存 WebUI 修正」は、**Issue 0041 (5 配布方式の要件定義・詳細設計)** として実装する。
SPA 取り込み済みの ISO 配布ページ (`proto-page-iso.jsx`) はすでに 5 方式のクリック解説を含んでおり、
バックエンド/ドキュメント側の整備が次の作業。

## Acceptance Criteria

- [x] 新バンドル取得・展開 (`/tmp/cdx-design-v2/construction-dx-os/`)
- [x] 全 proto-* と index.html の差分確認 → 完全一致を確認
- [x] 新規 jsx (Canvas 用) の用途特定
- [x] `os/launcher/construction-hub/` を別 Issue (Phase 1) に切り出し
- [x] `server/api/templates/` 差分比較 → ローカル優先で確定
- [x] 検証結果を本 Issue に記録
- [x] 後続作業を Issue 0041 として起票
