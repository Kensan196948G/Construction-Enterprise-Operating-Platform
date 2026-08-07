# Smart Infrastructure Solution Platform — Frontend

## ページ
- `/dashboard` 提案 KPI
- `/catalog` ソリューションカタログ
- `/proposals` 提案案件 Kanban
- `/proposals/new`, `/proposals/:id` 提案編集
- `/feasibility` F/S スコアリング (GO/HOLD/NO_GO)
- `/assets` インフラ資産マップ
- `/partners` パートナー一覧
- `/cases` 事例ギャラリー
- `/pfi` PFI/PPP 評価 (NPV/IRR/VFM)

## セットアップ
```bash
cd 03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/frontend
npm install
npm run dev    # http://localhost:5173 (バックエンドは http://localhost:8000)
```

## 共有 UI
`@cdx/shared-ui` (`00_共通基盤/shared-ui/`) は workspace で解決します。事前に shared-ui を `npm run build` してください。
