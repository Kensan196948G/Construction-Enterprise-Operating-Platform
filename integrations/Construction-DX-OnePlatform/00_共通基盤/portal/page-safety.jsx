/* Construction DX One Platform — Safety Quality Environment Page */

function PageSafety() {
  const [tab, setTab] = React.useState('overview');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'overview', label: '安全概況' }, { id: 'hiyari', label: 'ヒヤリハット' }, { id: 'iso', label: 'ISO・監査' }, { id: 'env', label: '環境管理' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'overview' && React.createElement(SafetyOverview, null),
      tab === 'hiyari' && React.createElement(SafetyHiyari, null),
      tab === 'iso' && React.createElement(SafetyISO, null),
      tab === 'env' && React.createElement(SafetyEnv, null)
    )
  );
}

function SafetyOverview() {
  const { SAFETY_STATS } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '労災事故（年度累計）', value: SAFETY_STATS.totalIncidents, unit: '件', icon: 'alertTriangle', color: SAFETY_STATS.totalIncidents > 0 ? 'var(--cdx-danger)' : 'var(--cdx-success)', invertDelta: true }),
      React.createElement(KPICard, { label: 'ヒヤリハット報告', value: SAFETY_STATS.nearMisses, unit: '件', delta: 12, icon: 'shield', color: 'var(--dept-06)', caption: '前年比', spark: [52, 60, 68, 78, 89] }),
      React.createElement(KPICard, { label: 'KY活動実施', value: SAFETY_STATS.kyActivities, unit: '回', icon: 'check', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '安全パトロール', value: SAFETY_STATS.patrols, unit: '回', icon: 'shield', color: 'var(--cdx-secondary)' })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '月別事故・ヒヤリハット推移' }),
        React.createElement(CDXBarChart, {
          data: SAFETY_STATS.monthlyTrend, width: 420, height: 220,
          xKey: 'month', yKeys: ['incidents', 'nearMisses'],
          barColor: 'var(--cdx-danger)', secondaryColor: 'var(--cdx-accent)'
        })
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: 'リスクヒートマップ（影響度×発生頻度）' }),
        React.createElement(CDXHeatmap, {
          data: SAFETY_STATS.heatmap,
          rowLabels: SAFETY_STATS.heatmapLabels.rows,
          colLabels: SAFETY_STATS.heatmapLabels.cols
        })
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: '4M分類別ヒヤリハット' }),
      React.createElement('div', { className: 'cdx-grid cdx-grid-4' },
        [
          { cat: 'man', label: '人（Man）', count: 34, pct: 38 },
          { cat: 'machine', label: '機械（Machine）', count: 22, pct: 25 },
          { cat: 'material', label: '材料（Material）', count: 18, pct: 20 },
          { cat: 'method', label: '方法（Method）', count: 15, pct: 17 },
        ].map(c => React.createElement('div', { key: c.cat, style: { textAlign: 'center' } },
          React.createElement(CDXGauge, { value: c.pct, label: c.label, size: 90, color: `var(--cdx-4m-${c.cat})` }),
          React.createElement('div', { style: { fontSize: 12, fontWeight: 600, marginTop: 4 } }, `${c.count}件`)
        ))
      )
    )
  );
}

function SafetyHiyari() {
  const { NEAR_MISSES, PROJECTS } = window.CDX_DATA;
  const [showNew, setShowNew] = React.useState(false);
  const columns = [
    { key: 'id', header: '番号', accessor: r => r.id, width: '130px', sortable: true },
    { key: 'date', header: '日付', accessor: r => r.date, sortable: true },
    { key: 'project', header: '現場', accessor: r => { const p = PROJECTS.find(pp => pp.id === r.project); return p ? p.name.substring(0, 12) + '…' : r.project; } },
    { key: 'category', header: '4M分類', width: '80px', render: r => React.createElement(FourMChip, { category: r.category }) },
    { key: 'level', header: 'レベル', width: '70px', render: r => React.createElement(StatusBadge, { type: r.level }) },
    { key: 'title', header: '内容', accessor: r => r.title },
    { key: 'reporter', header: '報告者', accessor: r => r.reporter || '—' },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
      React.createElement(SectionHeader, { title: 'ヒヤリハット報告一覧' }),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary', onClick: () => setShowNew(true) },
        React.createElement(CDXIcon, { name: 'plus', size: 14 }), '新規報告'
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, { columns, data: NEAR_MISSES, pageSize: 10 })
    ),
    React.createElement(CDXModal, { open: showNew, onClose: () => setShowNew(false), title: 'ヒヤリハット新規報告', width: 600 },
      React.createElement(HiyariForm, { onClose: () => setShowNew(false) })
    )
  );
}

function HiyariForm({ onClose }) {
  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' };
  return React.createElement('div', null,
    React.createElement('div', { style: fieldStyle },
      React.createElement('label', { style: labelStyle }, '現場'),
      React.createElement('select', { className: 'cdx-input cdx-select' },
        React.createElement('option', null, '選択してください'),
        ...window.CDX_DATA.PROJECTS.filter(p => p.status === 'active').map(p => React.createElement('option', { key: p.id }, p.name))
      )
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } },
      React.createElement('div', { style: fieldStyle },
        React.createElement('label', { style: labelStyle }, '4M分類'),
        React.createElement('select', { className: 'cdx-input cdx-select' },
          ...['人（Man）', '機械（Machine）', '材料（Material）', '方法（Method）'].map(c => React.createElement('option', { key: c }, c))
        )
      ),
      React.createElement('div', { style: fieldStyle },
        React.createElement('label', { style: labelStyle }, 'リスクレベル'),
        React.createElement('select', { className: 'cdx-input cdx-select' },
          ...['注意', '警告', '危険'].map(l => React.createElement('option', { key: l }, l))
        )
      )
    ),
    React.createElement('div', { style: fieldStyle },
      React.createElement('label', { style: labelStyle }, 'タイトル'),
      React.createElement('input', { className: 'cdx-input', placeholder: 'ヒヤリハットの概要を入力' })
    ),
    React.createElement('div', { style: fieldStyle },
      React.createElement('label', { style: labelStyle }, '詳細'),
      React.createElement('textarea', { className: 'cdx-input', rows: 4, placeholder: '状況・原因・対策を記載', style: { resize: 'vertical' } })
    ),
    React.createElement('div', { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' } },
      React.createElement('button', { className: 'cdx-btn cdx-btn-ghost', onClick: onClose }, 'キャンセル'),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary', onClick: () => { alert('報告を登録しました'); onClose(); } }, '登録')
    )
  );
}

function SafetyISO() {
  const { SAFETY_STATS } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: 'ISO認証ステータス' }),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      SAFETY_STATS.isoStatus.map((iso, i) => React.createElement('div', { key: i, className: 'cdx-card', style: { textAlign: 'center' } },
        React.createElement('div', { style: { fontSize: 14, fontWeight: 700, marginBottom: 8 } }, iso.standard),
        React.createElement('div', { style: { width: 48, height: 48, borderRadius: '50%', background: 'var(--cdx-success)' + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' } },
          React.createElement(CDXIcon, { name: 'check', size: 24, color: 'var(--cdx-success)' })
        ),
        React.createElement(StatusBadge, { type: 'safe', label: iso.status }),
        React.createElement('div', { style: { marginTop: 12, fontSize: 12, color: 'var(--text-muted)' } },
          React.createElement('div', null, `前回監査: ${iso.lastAudit}`),
          React.createElement('div', null, `次回監査: ${iso.nextAudit}`)
        )
      ))
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: '法令準拠チェックリスト' }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        [
          { law: '建設業法', status: '適合', score: 100 },
          { law: '品確法', status: '適合', score: 98 },
          { law: '労働安全衛生法', status: '適合', score: 97 },
          { law: '電子帳簿保存法', status: '適合', score: 95 },
          { law: 'i-Construction 2.0', status: '一部対応中', score: 72 },
        ].map((l, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' } },
          React.createElement('span', { style: { fontSize: 13, fontWeight: 600, width: 160 } }, l.law),
          React.createElement('div', { style: { flex: 1 } }, React.createElement(CDXProgressBar, { value: l.score, color: l.score === 100 ? 'var(--cdx-success)' : l.score > 90 ? 'var(--cdx-secondary)' : 'var(--cdx-accent)' })),
          React.createElement(StatusBadge, { type: l.score === 100 ? 'safe' : l.score > 90 ? 'info' : 'warning', label: l.status })
        ))
      )
    )
  );
}

function SafetyEnv() {
  const { SAFETY_STATS } = window.CDX_DATA;
  const co2 = SAFETY_STATS.co2;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: 'CO2排出量（累計）', value: co2.current, unit: co2.unit, delta: -8.5, icon: 'globe', color: 'var(--cdx-success)', spark: co2.trend, invertDelta: false }),
      React.createElement(KPICard, { label: '産廃リサイクル率', value: '92', unit: '%', delta: 3.2, icon: 'package', color: 'var(--dept-08)' }),
      React.createElement(KPICard, { label: '排出目標達成率', value: Math.round((1 - co2.current / co2.target) * 100 + 100), unit: '%', icon: 'chart', color: 'var(--cdx-secondary)' })
    ),
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement(SectionHeader, { title: 'CO2排出量推移' }),
      React.createElement(CDXLineChart, {
        data: co2.trend.map((v, i) => ({ label: `${i + 2}月`, value: v, target: co2.target })),
        width: 600, height: 220, xKey: 'label', yKeys: ['value', 'target'],
        colors: ['var(--cdx-success)', 'var(--cdx-danger)'], area: true,
        labels: ['実績', '目標上限']
      })
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: '産業廃棄物管理' }),
      React.createElement(CDXDonutChart, {
        data: [
          { name: 'コンクリート', value: 45, color: '#64748b' },
          { name: 'アスファルト', value: 20, color: '#475569' },
          { name: '建設汚泥', value: 18, color: '#94a3b8' },
          { name: '木材', value: 10, color: '#10b981' },
          { name: 'その他', value: 7, color: '#cbd5e1' },
        ], size: 140
      })
    )
  );
}

window.PageSafety = PageSafety;
