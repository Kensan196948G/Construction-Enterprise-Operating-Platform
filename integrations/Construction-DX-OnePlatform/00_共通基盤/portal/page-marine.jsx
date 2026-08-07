/* Construction DX One Platform — Marine Fleet Management Page */

function PageMarine() {
  const [tab, setTab] = React.useState('fleet');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'fleet', label: '船団管理' }, { id: 'operations', label: '運航状況' }, { id: 'fuel', label: '燃料管理' }, { id: 'maintenance', label: '保守点検' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'fleet' && React.createElement(MarineFleet, null),
      tab === 'operations' && React.createElement(MarineOps, null),
      tab === 'fuel' && React.createElement(MarineFuel, null),
      tab === 'maintenance' && React.createElement(MarineMaint, null)
    )
  );
}

function MarineFleet() {
  const { MARINE } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '保有船舶', value: MARINE.fleet.length, unit: '隻', icon: 'anchor', color: 'var(--dept-09)' }),
      React.createElement(KPICard, { label: '稼働中', value: MARINE.fleet.filter(f => f.status === 'operating').length, unit: '隻', icon: 'ship', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '稼働率', value: MARINE.operationRate, unit: '%', icon: 'chart', color: 'var(--cdx-secondary)', spark: [72, 74, 75, 77, 78.4] }),
      React.createElement(KPICard, { label: '乗組員', value: MARINE.fleet.reduce((s, f) => s + f.crew, 0), unit: '名', icon: 'users', color: 'var(--dept-09)' })
    ),
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement(SectionHeader, { title: '船舶位置情報（AIS連携）' }),
      React.createElement('div', { style: { height: 220, borderRadius: 8, background: 'linear-gradient(135deg, oklch(0.35 0.08 220), oklch(0.45 0.1 200))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' } },
        /* Stylized map */
        React.createElement('svg', { viewBox: '0 0 500 200', width: '100%', height: '100%', style: { position: 'absolute', opacity: 0.15 } },
          React.createElement('path', { d: 'M100 80 C120 60, 160 50, 180 70 C200 90, 220 60, 250 80 C280 100, 300 70, 340 90 C360 100, 380 80, 400 90', fill: 'none', stroke: '#fff', strokeWidth: 2 }),
          React.createElement('path', { d: 'M80 120 C120 100, 160 110, 200 100 C240 90, 280 110, 320 100 C360 90, 400 110, 440 100', fill: 'none', stroke: '#fff', strokeWidth: 1 })
        ),
        MARINE.fleet.filter(f => f.status === 'operating').map((f, i) => {
          const positions = [[25, 40], [55, 55], [75, 35]];
          const [x, y] = positions[i] || [50, 50];
          return React.createElement('div', { key: f.id, style: { position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' } },
            React.createElement('div', { style: { width: 12, height: 12, borderRadius: '50%', background: '#4ade80', border: '2px solid #fff', boxShadow: '0 0 8px rgba(74,222,128,0.5)' } }),
            React.createElement('div', { style: { position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 10, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '1px 6px', borderRadius: 3 } }, f.name)
          );
        }),
        React.createElement('div', { style: { position: 'absolute', bottom: 8, right: 12, fontSize: 10, color: 'rgba(255,255,255,0.4)' } }, 'AIS / GPS リアルタイム表示')
      )
    ),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3' },
      MARINE.fleet.map((f, i) => React.createElement('div', { key: i, className: 'cdx-card', style: { borderLeft: `3px solid ${f.status === 'operating' ? 'var(--cdx-success)' : f.status === 'maintenance' ? 'var(--cdx-accent)' : 'var(--cdx-secondary)'}` } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 15, fontWeight: 700 } }, f.name),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, `${f.type} / ${f.id}`)
          ),
          React.createElement(StatusBadge, { type: f.status === 'operating' ? 'safe' : f.status === 'maintenance' ? 'warning' : 'neutral', label: f.status === 'operating' ? '稼働中' : f.status === 'maintenance' ? '整備中' : '待機' })
        ),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 8 } },
          React.createElement('div', null,
            React.createElement('span', { style: { color: 'var(--text-muted)' } }, '位置: '),
            React.createElement('span', { style: { fontWeight: 500 } }, f.location)
          ),
          React.createElement('div', null,
            React.createElement('span', { style: { color: 'var(--text-muted)' } }, '乗員: '),
            React.createElement('span', { style: { fontWeight: 500 } }, `${f.crew}名`)
          )
        ),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 } }, `燃料残量: ${f.fuel}%`),
          React.createElement(CDXProgressBar, { value: f.fuel, height: 6, color: f.fuel > 60 ? 'var(--cdx-success)' : f.fuel > 30 ? 'var(--cdx-accent)' : 'var(--cdx-danger)' })
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', marginTop: 8 } }, `次回点検: ${f.nextMaint}`)
      ))
    )
  );
}

function MarineOps() {
  const opLog = [
    { date: '2026-05-23', ship: 'みらい丸', operation: '東京湾岸橋梁 アンカー打設', duration: '08:00-17:00', weather: '晴れ 風速3m/s 波高0.5m' },
    { date: '2026-05-23', ship: 'みらいクレーン', operation: '東京湾岸橋梁 鋼桁架設', duration: '06:00-18:00', weather: '晴れ 風速4m/s 波高0.8m' },
    { date: '2026-05-23', ship: '第二みらい', operation: '横浜港 捨石投入', duration: '07:00-16:00', weather: '曇り 風速5m/s 波高1.0m' },
    { date: '2026-05-22', ship: 'みらい丸', operation: '東京湾岸橋梁 アンカー打設', duration: '08:00-17:00', weather: '晴れ 風速2m/s 波高0.3m' },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '運航記録' }),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'date', header: '日付', accessor: r => r.date, sortable: true },
          { key: 'ship', header: '船舶', accessor: r => r.ship, sortable: true },
          { key: 'operation', header: '作業内容', accessor: r => r.operation },
          { key: 'duration', header: '時間', accessor: r => r.duration },
          { key: 'weather', header: '気象・海象', accessor: r => r.weather },
        ],
        data: opLog, pageSize: 10
      })
    )
  );
}

function MarineFuel() {
  const { MARINE } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '今月燃料消費', value: 138, unit: 'kL', icon: 'truck', color: 'var(--dept-09)', spark: [124, 118, 156, 142, 138] }),
      React.createElement(KPICard, { label: '前月比', value: '-2.8', unit: '%', delta: -2.8, icon: 'trendDown', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '燃料費', value: '1,840', unit: '万円', icon: 'dollarSign', color: 'var(--cdx-accent)' })
    ),
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement(SectionHeader, { title: '月別燃料消費量（kL）' }),
      React.createElement(CDXBarChart, { data: MARINE.fuelConsumption, width: 500, height: 220, xKey: 'month', yKeys: ['amount'], barColor: 'var(--dept-09)' })
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: '船舶別燃料残量' }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        MARINE.fleet.map((f, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12 } },
          React.createElement('span', { style: { fontSize: 13, fontWeight: 600, width: 140 } }, f.name),
          React.createElement('div', { style: { flex: 1 } }, React.createElement(CDXProgressBar, { value: f.fuel, color: f.fuel > 60 ? 'var(--cdx-success)' : f.fuel > 30 ? 'var(--cdx-accent)' : 'var(--cdx-danger)' }))
        ))
      )
    )
  );
}

function MarineMaint() {
  const maintLog = [
    { ship: 'みらいドラグ', type: '定期検査', item: 'エンジンオーバーホール', status: 'in_progress', start: '2026-05-15', end: '2026-06-15' },
    { ship: 'みらい丸', type: '日常点検', item: '係留索点検・交換', status: 'completed', start: '2026-05-20', end: '2026-05-20' },
    { ship: 'みらいクレーン', type: '定期検査', item: 'クレーンワイヤー検査', status: 'scheduled', start: '2026-06-20', end: '2026-06-22' },
    { ship: '第二みらい', type: '日常点検', item: '航海灯・信号灯点検', status: 'completed', start: '2026-05-18', end: '2026-05-18' },
    { ship: '第三みらい', type: '定期検査', item: '船底塗装', status: 'scheduled', start: '2026-08-10', end: '2026-08-20' },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '保守点検スケジュール' }),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'ship', header: '船舶', accessor: r => r.ship, sortable: true },
          { key: 'type', header: '種別', render: r => React.createElement(StatusBadge, { type: r.type === '定期検査' ? 'info' : 'neutral', label: r.type }) },
          { key: 'item', header: '点検項目', accessor: r => r.item },
          { key: 'start', header: '開始日', accessor: r => r.start, sortable: true },
          { key: 'end', header: '終了日', accessor: r => r.end },
          { key: 'status', header: 'ステータス', render: r => React.createElement(StatusBadge, { type: r.status === 'completed' ? 'safe' : r.status === 'in_progress' ? 'warning' : 'neutral', label: r.status === 'completed' ? '完了' : r.status === 'in_progress' ? '作業中' : '予定' }) },
        ],
        data: maintLog, pageSize: 10
      })
    )
  );
}

window.PageMarine = PageMarine;
