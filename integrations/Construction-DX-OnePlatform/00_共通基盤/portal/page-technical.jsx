/* Construction DX One Platform — Technical Knowledge & BIM Page */

function PageTechnical() {
  const [tab, setTab] = React.useState('knowledge');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'knowledge', label: '技術ナレッジ' }, { id: 'bim', label: 'BIM/CIM' }, { id: 'research', label: '研究開発' }, { id: 'standards', label: '施工標準' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'knowledge' && React.createElement(TechKnowledge, null),
      tab === 'bim' && React.createElement(TechBIM, null),
      tab === 'research' && React.createElement(TechResearch, null),
      tab === 'standards' && React.createElement(TechStandards, null)
    )
  );
}

function TechKnowledge() {
  const { TECH_KNOWLEDGE } = window.CDX_DATA;
  const [searchQ, setSearchQ] = React.useState('');
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: 'ナレッジ登録数', value: '1,842', unit: '件', icon: 'bookmark', color: 'var(--dept-05)', spark: [1200, 1400, 1600, 1750, 1842] }),
      React.createElement(KPICard, { label: '今月追加', value: 24, unit: '件', icon: 'plus', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '総閲覧数', value: '12.4K', unit: '/月', icon: 'chart', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: '技術者数', value: 68, unit: '名', icon: 'users', color: 'var(--dept-05)' })
    ),
    /* AI Search Box */
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20, padding: 20 } },
      React.createElement('div', { style: { fontSize: 14, fontWeight: 700, marginBottom: 10 } }, 'AI ナレッジ検索'),
      React.createElement('div', { style: { display: 'flex', gap: 8 } },
        React.createElement('input', { className: 'cdx-input', placeholder: '例: 「過去の港湾工事で地盤改良した事例」', value: searchQ, onChange: e => setSearchQ(e.target.value), style: { flex: 1 } }),
        React.createElement('button', { className: 'cdx-btn cdx-btn-secondary', onClick: () => searchQ && alert(`AI検索: "${searchQ}" の結果を表示します`) },
          React.createElement(CDXIcon, { name: 'search', size: 14 }), '検索'
        )
      ),
      React.createElement('div', { style: { display: 'flex', gap: 6, marginTop: 8 } },
        ['地盤改良', '鋼管杭', '水中コンクリート', 'ICT施工'].map(tag =>
          React.createElement('button', { key: tag, className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', onClick: () => setSearchQ(tag) }, tag)
        )
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: '最新ナレッジ' }),
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'id', header: 'ID', accessor: r => r.id, width: '90px', sortable: true },
          { key: 'title', header: 'タイトル', accessor: r => r.title, sortable: true },
          { key: 'category', header: 'カテゴリ', render: r => React.createElement(StatusBadge, { type: 'info', label: r.category }), width: '90px' },
          { key: 'author', header: '著者', accessor: r => r.author },
          { key: 'views', header: '閲覧数', align: 'right', sortable: true, sortValue: r => r.views, accessor: r => r.views.toLocaleString() },
          { key: 'updated', header: '更新日', accessor: r => r.updated, sortable: true },
        ],
        data: TECH_KNOWLEDGE, pageSize: 10
      })
    )
  );
}

function TechBIM() {
  const { TECH_BIM } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: 'BIM/CIMモデル数', value: '3,240', icon: 'layers', color: 'var(--dept-05)' }),
      React.createElement(KPICard, { label: '総データ量', value: '1.8', unit: 'TB', icon: 'database', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: 'IFC 4.0 対応率', value: 78, unit: '%', icon: 'check', color: 'var(--cdx-success)', spark: [55, 62, 68, 74, 78] })
    ),
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement(SectionHeader, { title: 'アクティブモデル' }),
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'id', header: 'ID', accessor: r => r.id, sortable: true },
          { key: 'name', header: 'モデル名', accessor: r => r.name, sortable: true },
          { key: 'format', header: 'フォーマット', render: r => React.createElement(StatusBadge, { type: 'info', label: r.format }) },
          { key: 'size', header: 'サイズ', accessor: r => r.size, align: 'right' },
          { key: 'updated', header: '更新日', accessor: r => r.updated, sortable: true },
          { key: 'status', header: 'ステータス', render: r => React.createElement(StatusBadge, { type: r.status === 'active' ? 'safe' : 'warning', label: r.status === 'active' ? '運用中' : 'レビュー中' }) },
        ],
        data: TECH_BIM, pageSize: 10
      })
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: 'BIM/CIM ビューア' }),
      React.createElement('div', { style: { height: 200, borderRadius: 8, background: 'linear-gradient(135deg, oklch(0.25 0.05 260), oklch(0.35 0.08 240))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 } },
        React.createElement(CDXIcon, { name: 'layers', size: 40, color: 'rgba(255,255,255,0.3)' }),
        React.createElement('span', { style: { color: 'rgba(255,255,255,0.5)', fontSize: 13 } }, '3D BIM/CIM ビューア (CesiumJS / IFC.js)'),
        React.createElement('span', { style: { color: 'rgba(255,255,255,0.3)', fontSize: 11 } }, 'モデルを選択して表示')
      )
    )
  );
}

function TechResearch() {
  const research = [
    { id: 'R-024', title: '海洋環境に配慮した新型消波ブロックの開発', lead: '技術部 佐藤', status: 'active', progress: 65, budget: 1200 },
    { id: 'R-023', title: 'AI画像解析によるコンクリートひび割れ自動検出', lead: '技術部 中村', status: 'active', progress: 82, budget: 800 },
    { id: 'R-022', title: '再生材料を活用した護岸ブロックの耐久性評価', lead: '技術部 田村', status: 'review', progress: 95, budget: 600 },
    { id: 'R-021', title: '自律型水中ドローンによる港湾構造物点検', lead: '技術部 山本', status: 'active', progress: 40, budget: 2000 },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '研究開発プロジェクト' }),
    React.createElement('div', { className: 'cdx-grid cdx-grid-2' },
      research.map((r, i) => React.createElement('div', { key: i, className: 'cdx-card' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
          React.createElement('span', { style: { fontSize: 11, color: 'var(--text-muted)' } }, r.id),
          React.createElement(StatusBadge, { type: r.status === 'active' ? 'info' : 'warning', label: r.status === 'active' ? '研究中' : 'レビュー中' })
        ),
        React.createElement('div', { style: { fontSize: 14, fontWeight: 700, marginBottom: 4 } }, r.title),
        React.createElement('div', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 } }, `担当: ${r.lead} / 予算: ¥${r.budget.toLocaleString()}万`),
        React.createElement(CDXProgressBar, { value: r.progress, color: 'var(--dept-05)' })
      ))
    )
  );
}

function TechStandards() {
  const standards = [
    { category: '基礎工', docs: 12, lastUpdate: '2026-05-15' },
    { category: '護岸工', docs: 8, lastUpdate: '2026-04-22' },
    { category: '港湾・海上工', docs: 15, lastUpdate: '2026-05-20' },
    { category: 'トンネル工', docs: 6, lastUpdate: '2026-03-10' },
    { category: '道路・舗装工', docs: 10, lastUpdate: '2026-04-18' },
    { category: '構造物（RC）', docs: 14, lastUpdate: '2026-05-08' },
    { category: '仮設工', docs: 9, lastUpdate: '2026-04-30' },
    { category: 'ICT施工', docs: 7, lastUpdate: '2026-05-18' },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '施工標準・マニュアル' }),
    React.createElement('div', { className: 'cdx-grid cdx-grid-4' },
      standards.map((s, i) => React.createElement('div', { key: i, className: 'cdx-card', style: { padding: 16, cursor: 'pointer' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } },
          React.createElement(CDXIcon, { name: 'folder', size: 18, color: 'var(--dept-05)' }),
          React.createElement('span', { style: { fontSize: 13, fontWeight: 700 } }, s.category)
        ),
        React.createElement('div', { style: { fontSize: 22, fontWeight: 800, color: 'var(--dept-05)', marginBottom: 4 } }, s.docs),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, `文書数 / 更新: ${s.lastUpdate}`)
      ))
    )
  );
}

window.PageTechnical = PageTechnical;
