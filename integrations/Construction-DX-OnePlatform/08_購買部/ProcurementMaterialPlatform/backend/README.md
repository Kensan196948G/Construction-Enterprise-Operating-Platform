# cdx-proc-api — 購買・調達・資材管理 API

Construction DX One Platform — 購買部 (Procurement & Material Platform) のバックエンド。

## 機能

- 協力会社マスタ (建設業許可番号 + 適格請求書事業者番号 (T+13桁) 必須)
- 5 項目評価 (納期 / 品質 / 価格 / 安全 / 継続性) による 5 段階ランク (S/A/B/C/D)
- 購買依頼 → 承認 WF (金額閾値 100 万 / 500 万円で 1/2/3 段階)
- 発注 / 納品検収 / 在庫 (発注点・欠品予測アラート)
- 価格履歴 + 相見積比較 + 月次トレンド
- 共通モジュール: `cdx-shared-auth` (Entra ID + HENNGE SSO), `cdx-shared-db`

## セットアップ

```bash
cd 08_購買部/ProcurementMaterialPlatform/backend

# uv (推奨)
uv sync --extra dev

# or pip
pip install -e ".[dev]"
```

## 起動

```bash
uvicorn proc_api.main:app --reload --port 8000
```

## テスト

```bash
pytest -q
```

主要テスト:
- `tests/test_supplier_evaluator.py` (3 件 + 境界値)
- `tests/test_inventory_optimizer.py` (2 件)
- `tests/test_approval_workflow.py` (金額閾値分岐 + 状態遷移)
- `tests/test_price_analyzer.py`
- `tests/test_smoke.py` (FastAPI 認証/エンドポイント存在確認)

## DB マイグレーション

```bash
alembic upgrade head
```
