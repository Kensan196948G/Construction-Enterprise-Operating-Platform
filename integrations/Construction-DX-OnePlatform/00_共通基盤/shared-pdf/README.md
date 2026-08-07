# cdx-shared-pdf

Construction DX One Platform — 共通PDF生成モジュール。
全部門の PDF サービス (見積書 / 提案書 / 発注書 / 財務諸表 / 取締役会報告書) で
日本語 PDF を生成するための統一基盤を提供します。

## 機能

- `JaPDF` : fpdf2.FPDF サブクラス。IPAex フォントを自動取得して `gothic` / `mincho` を登録。
  - フォント取得失敗時は Helvetica + ASCII fallback に縮退 (PDF 生成は停止しない)。
- `register_ja_fonts(pdf)` : 既存の FPDF インスタンスに IPAex を登録するヘルパ。
- `render_table(pdf, headers, rows)` : 共通の表ヘルパ。
- ヘッダ (会社名)、フッタ (ページ番号 `n / total`)、印影プレースホルダの共通スタイル。

## フォント解決順

1. 環境変数 `CDX_PDF_FONT_DIR` 配下に `IPAexGothic.ttf` / `IPAexMincho.ttf` (または `ipaexg.ttf` / `ipaexm.ttf`)
2. ユーザー キャッシュ `~/.cache/cdx_pdf/fonts`
3. (1, 2 に無ければ) IPA 公式 ZIP (`https://moji.or.jp/wp-content/ipafont/IPAexfont/IPAexfont00401.zip`) をダウンロードして 2. に展開
4. すべて失敗時は `FontAcquisitionError` → `JaPDF` は Helvetica fallback に切替

IPAex フォントは IPA フォントライセンス v1.1 (再配布可) でリリースされています。
オフライン環境では `CDX_PDF_FONT_DIR` に事前配置することを推奨します。

## 使い方

```python
from cdx_pdf import JaPDF, render_table

pdf = JaPDF(company_name="株式会社 Construction DX")
pdf.set_company_header("株式会社 Construction DX", show_page_number=True)
pdf.add_page()
pdf.add_jp_text("見積書", font_size=20, bold=True, align="C")
pdf.add_jp_text("お客様各位")

render_table(
    pdf,
    headers=["項目", "数量", "単価", "金額"],
    rows=[("基礎工事", "1", "5,000,000", "5,000,000")],
    widths=[80, 25, 35, 35],
)
pdf.seal_placeholder("[印]")

blob = bytes(pdf.output())
```

## 部門サービスからの利用

各部門 `pyproject.toml` の依存:

```toml
dependencies = [
    "cdx-shared-pdf",
    # ...
]

[tool.uv.sources]
cdx-shared-pdf = { path = "../../../00_共通基盤/shared-pdf", editable = true }
```
