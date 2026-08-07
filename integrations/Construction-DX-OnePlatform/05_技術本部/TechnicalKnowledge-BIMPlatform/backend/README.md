# cdx-tech-api — Technical Knowledge & BIM Platform Backend

技術本部 (技術部 / 研究開発部 / エンジニアリング部) 向け技術ナレッジ・BIM/CIM 基盤の FastAPI バックエンドです。

## 機能

- 技術ナレッジ記事 CRUD + 全文検索 + ベクトル類似度検索
- BIM (IFC) モデル管理 / アップロード / LOD 切替
- CIM データセット (点群 LAS, オルソ, DEM) 管理 + タイル化要求
- 標準図 / 仕様書 ライブラリ
- 技術問合せ Q&A + AI ドラフト回答 (Azure OpenAI 連携, 未設定時はフォールバック)
- ダッシュボード (利用統計, 人気記事, 寄与度)
- i-Construction 2.0 提出データ形式バリデータ (ファイル名規約, 拡張子, 必須メタ, LOD)

## ローカル開発

```bash
uv sync
uv run uvicorn tech_api.main:app --reload --port 8000
```

## テスト

```bash
uv run pytest
```

主要テスト:

- `tests/test_ifc_parser.py` — IFC SPF パーサのサマリ抽出
- `tests/test_knowledge_embedder.py` — embedding フォールバック決定論性
- `tests/test_i_construction_validator.py` — ファイル名・拡張子・必須メタ・LOD
- `tests/test_smoke.py` — エンドポイント存在 + 認証

## 共通モジュール参照

`pyproject.toml` の `[tool.uv.sources]` で `cdx-shared-auth` / `cdx-shared-db` をローカルパスから取得します。
