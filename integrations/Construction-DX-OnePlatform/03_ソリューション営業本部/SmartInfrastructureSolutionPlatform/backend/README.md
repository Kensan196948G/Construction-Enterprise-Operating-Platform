# Smart Infrastructure Solution Platform — Backend

ソリューション営業本部のための提案型営業 (港湾DX / 再エネ / 防災 / PFI・PPP / 環境保全 / インフラ維持管理) プラットフォーム API.

## 機能
- ソリューションカタログ管理
- 提案案件 (lead -> qualifying -> proposing -> in_negotiation -> won/lost)
- 実現可能性スタディ (F/S) : 4軸スコア + GO/HOLD/NO_GO 自動判定
- インフラ資産 (PostGIS POINT) + 老朽度分析
- パートナー組織 (技術提携先 / 大学 / 自治体 / ベンチャー)
- 実績事例集 (ROI / 顧客評価 / 関連特許)
- PFI/PPP 事業性評価 (NPV / IRR / VFM)
- 提案ダッシュボード (採択率 / カテゴリ別収益)

## セットアップ

```bash
cd 03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/backend
uv sync --all-extras
uv run alembic upgrade head
uv run uvicorn sol_api.main:app --reload --port 8000
```

## テスト

```bash
uv run pytest -q
```

## API
ベース URL: `http://localhost:8000/api/v1`

| ルート | 説明 |
|-------|------|
| `/catalog` | ソリューションカタログ |
| `/proposals` | 提案案件 |
| `/proposals/{id}/similar-cases` | AI類似事例検索 (stub) |
| `/feasibility` | 実現可能性スタディ |
| `/feasibility/score` | F/S スコア計算プレビュー |
| `/assets` | インフラ資産 |
| `/assets/{id}/age-analysis` | 老朽度評価 |
| `/partners` | パートナー組織 |
| `/cases` | 実績事例 |
| `/pfi/evaluate` | PFI/PPP 事業性評価 |
| `/dashboard/summary` | ダッシュボード集計 |
