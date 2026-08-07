/* Construction DX One Platform — Sales CRM & Bid Management Page */

function PageSales() {
  const [tab, setTab] = React.useState('pipeline');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'pipeline', label: 'パイプライン' }, { id: 'bids', label: '入札管理' }, { id: 'analysis', label: '分析' }, { id: 'reports', label: '営業日報' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'pipeline' && React.createElement(SalesPipeline, null),
      tab === 'bids' && React.createElement(SalesBids, null),
      tab === 'analysis' && React.createElement(SalesAnalysis, null),
      tab === 'reports' && React.createElement(SalesReports, null)
    )
  );
}

function SalesPipeline() {
  const { SALES_PIPELINE, SALES_STATS } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: 'パイプライン総額', value: SALES_STATS.pipelineTotal, unit: '億円', icon: 'dollarSign', color: 'var(--dept-02)', spark: [12.2, 13.5, 14.0, 14.8, 15.5] }),
      React.createElement(KPICard, { label: '今月受注', value: SALES_STATS.wonThisMonth, unit: '件', icon: 'check', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '平均受注率', value: SALES_STATS.avgWinRate, unit: '%', icon: 'chart', color: 'var(--cdx-secondary)', spark: [28, 30, 32, 33, 34.2] }),
      React.createElement(KPICard, { label: '失注', value: SALES_STATS.lostThisMonth, unit: '件', icon: 'x', color: 'var(--cdx-danger)', invertDelta: true })
    ),
    /* Stage funnel */
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement(SectionHeader, { title: 'ステージ別パイプライン' }),
      React.createElement('div', { style: { display: 'flex', gap: 4 } },
        SALES_STATS.stageBreakdown.map((s, i) => {
          const w = Math.max(s.amount / 6 * 100, 15);
          return React.createElement('div', { key: i, style: { flex: `0 0 ${w}%`, padding: 12, borderRadius: 8, background: s.color + '18', borderLeft: `3px solid ${s.color}` } },
            React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: s.color } }, s.name),
            React.createElement('div', { style: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 } }, `${s.amount}億`),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, `${s.count}件`)
          );
        })
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: '案件一覧' }),
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'id', header: 'ID', accessor: r => r.id, width: '120px', sortable: true },
          { key: 'name', header: '案件名', accessor: r => r.name, sortable: true },
          { key: 'client', header: '発注者', accessor: r => r.client },
          { key: 'amount', header: '金額(百万)', align: 'right', sortable: true, sortValue: r => r.amount, render: r => `¥${r.amount.toLocaleString()}` },
          { key: 'stage', header: 'ステージ', render: r => {
            const colors = { '情報収集': 'neutral', '提案中': 'info', '入札準備': 'warning', '見積提出': 'info', '落札候補': 'safe', '失注': 'danger' };
            return React.createElement(StatusBadge, { type: colors[r.stage] || 'neutral', label: r.stage });
          }},
          { key: 'probability', header: '確度', align: 'right', sortable: true, sortValue: r => r.probability, render: r => React.createElement('span', { style: { fontWeight: 600, color: r.probability >= 70 ? 'var(--cdx-success)' : r.probability >= 40 ? 'var(--cdx-accent)' : 'var(--text-muted)' } }, `${r.probability}%`) },
          { key: 'dueDate', header: '期限', accessor: r => r.dueDate, sortable: true },
        ],
        data: SALES_PIPELINE, pageSize: 10
      })
    )
  );
}

function SalesBids() {
  const bids = [
    { id: 'T-2026-045', name: '総合評価（技術+価格）', project: '東京都港区 橋梁補修', evalScore: 82.5, priceScore: 91.2, totalScore: 86.4, rank: 1, deadline: '2026-06-15' },
    { id: 'T-2026-044', name: '総合評価（技術+価格）', project: '神奈川県 河川護岸', evalScore: 78.0, priceScore: 85.4, totalScore: 81.2, rank: 2, deadline: '2026-06-30' },
    { id: 'T-2026-043', name: '一般競争入札', project: '千葉港 浚渫工事', evalScore: null, priceScore: 88.7, totalScore: 88.7, rank: 1, deadline: '2026-07-10' },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '入札・評価管理' }),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '進行中入札', value: 3, unit: '件', icon: 'fileText', color: 'var(--dept-02)' }),
      React.createElement(KPICard, { label: '平均技術評価点', value: '80.3', unit: '点', icon: 'star', color: 'var(--cdx-accent)' }),
      React.createElement(KPICard, { label: '落札率（年度）', value: '34.2', unit: '%', icon: 'chart', color: 'var(--cdx-success)' })
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'id', header: '入札ID', accessor: r => r.id, sortable: true },
          { key: 'project', header: '工事名', accessor: r => r.project },
          { key: 'name', header: '入札方式', accessor: r => r.name },
          { key: 'evalScore', header: '技術点', align: 'right', render: r => r.evalScore ? r.evalScore.toFixed(1) : '—' },
          { key: 'priceScore', header: '価格点', align: 'right', render: r => r.priceScore.toFixed(1) },
          { key: 'totalScore', header: '合計', align: 'right', sortable: true, sortValue: r => r.totalScore, render: r => React.createElement('span', { style: { fontWeight: 700, color: 'var(--cdx-secondary)' } }, r.totalScore.toFixed(1)) },
          { key: 'rank', header: '順位', render: r => React.createElement('span', { style: { fontWeight: 700, color: r.rank === 1 ? 'var(--cdx-success)' : 'var(--text-secondary)' } }, `${r.rank}位`) },
          { key: 'deadline', header: '入札日', accessor: r => r.deadline, sortable: true },
        ],
        data: bids, pageSize: 10
      })
    )
  );
}

function SalesAnalysis() {
  const { SALES_STATS } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '月別受注額推移（億円）' }),
        React.createElement(CDXBarChart, { data: SALES_STATS.monthlyWon, width: 400, height: 220, xKey: 'month', yKeys: ['amount'], barColor: 'var(--dept-02)' })
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '発注機関別受注分析' }),
        React.createElement(CDXDonutChart, {
          data: [
            { name: '国土交通省', value: 45, color: '#1e40af' },
            { name: '都道府県', value: 25, color: '#3b82f6' },
            { name: '市区町村', value: 18, color: '#60a5fa' },
            { name: '民間', value: 12, color: '#93c5fd' },
          ], size: 140
        })
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: '工種別受注実績' }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        [
          { name: '港湾・海上工事', amount: 48.2, count: 12 },
          { name: '道路・橋梁', amount: 32.5, count: 8 },
          { name: '河川・護岸', amount: 24.1, count: 15 },
          { name: 'トンネル', amount: 18.0, count: 3 },
          { name: 'その他', amount: 5.6, count: 7 },
        ].map((w, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12 } },
          React.createElement('span', { style: { fontSize: 13, fontWeight: 500, width: 140 } }, w.name),
          React.createElement('div', { style: { flex: 1 } }, React.createElement(CDXProgressBar, { value: w.amount, max: 50, color: 'var(--dept-02)' })),
          React.createElement('span', { style: { fontSize: 12, fontWeight: 600, width: 60, textAlign: 'right' } }, `${w.amount}億`),
          React.createElement('span', { style: { fontSize: 11, color: 'var(--text-muted)', width: 40, textAlign: 'right' } }, `${w.count}件`)
        ))
      )
    )
  );
}

function SalesReports() {
  const reports = [
    { date: '2026-05-23', author: '鈴木一郎', client: '東京都建設局', type: '訪問', summary: '橋梁補修工事の技術提案について協議。次回6/1に技術者同行予定。' },
    { date: '2026-05-23', author: '山田太郎', client: '神奈川県', type: '電話', summary: '河川護岸工事の入札スケジュール確認。公告は6月上旬予定。' },
    { date: '2026-05-22', author: '鈴木一郎', client: '国交省港湾局', type: '訪問', summary: '防波堤改修工事の落札候補者として通知あり。契約協議日程調整。' },
    { date: '2026-05-22', author: '高田優子', client: '千葉県', type: 'Web面談', summary: '浚渫工事の見積条件について質疑回答。追加資料を5/24送付予定。' },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 } },
      React.createElement(SectionHeader, { title: '営業日報' }),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary' }, React.createElement(CDXIcon, { name: 'plus', size: 14 }), '新規日報')
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'date', header: '日付', accessor: r => r.date, sortable: true },
          { key: 'author', header: '担当者', accessor: r => r.author },
          { key: 'client', header: '訪問先', accessor: r => r.client },
          { key: 'type', header: '種別', render: r => React.createElement(StatusBadge, { type: r.type === '訪問' ? 'info' : r.type === '電話' ? 'neutral' : 'warning', label: r.type }) },
          { key: 'summary', header: '概要', accessor: r => r.summary },
        ],
        data: reports, pageSize: 10
      })
    )
  );
}

window.PageSales = PageSales;
