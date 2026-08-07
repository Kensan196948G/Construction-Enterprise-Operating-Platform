/* Construction DX One Platform — Construction Site Management Page */

function PageConstruction() {
  const { PROJECTS, DAILY_REPORTS } = window.CDX_DATA;
  const [tab, setTab] = React.useState('projects');
  const [selectedProject, setSelectedProject] = React.useState(null);
  const [showReportModal, setShowReportModal] = React.useState(false);

  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'projects', label: '工事一覧' }, { id: 'progress', label: '出来高管理' }, { id: 'reports', label: '日報' }, { id: 'photos', label: '現場写真' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'projects' && React.createElement(ConstructionProjects, { onSelect: setSelectedProject }),
      tab === 'progress' && React.createElement(ConstructionProgress, null),
      tab === 'reports' && React.createElement(ConstructionReports, { onNew: () => setShowReportModal(true) }),
      tab === 'photos' && React.createElement(ConstructionPhotos, null)
    ),
    React.createElement(CDXModal, { open: !!selectedProject, onClose: () => setSelectedProject(null), title: selectedProject ? selectedProject.name : '', width: 800 },
      selectedProject && React.createElement(ProjectDetail, { project: selectedProject })
    ),
    React.createElement(CDXModal, { open: showReportModal, onClose: () => setShowReportModal(false), title: '新規日報作成', width: 600 },
      React.createElement(DailyReportForm, { onClose: () => setShowReportModal(false) })
    )
  );
}

function ConstructionProjects({ onSelect }) {
  const { PROJECTS } = window.CDX_DATA;
  const columns = [
    { key: 'id', header: '工事番号', width: '120px', accessor: r => r.id, sortable: true },
    { key: 'name', header: '工事名', accessor: r => r.name, sortable: true },
    { key: 'client', header: '発注者', accessor: r => r.client, sortable: true },
    { key: 'progress', header: '進捗', width: '140px', sortable: true, sortValue: r => r.progress, render: r => React.createElement(CDXProgressBar, { value: r.progress, color: r.progress > 80 ? 'var(--cdx-success)' : r.progress > 40 ? 'var(--cdx-secondary)' : 'var(--cdx-accent)', height: 6 }) },
    { key: 'budget', header: '予算', width: '90px', align: 'right', sortable: true, sortValue: r => r.budget, render: r => `${(r.budget / 100).toFixed(0)}億` },
    { key: 'status', header: 'ステータス', width: '90px', render: r => React.createElement(StatusBadge, { type: r.status }) },
    { key: 'safety', header: '安全', width: '70px', align: 'right', sortable: true, sortValue: r => r.safetyScore, render: r => React.createElement('span', { style: { color: r.safetyScore >= 95 ? 'var(--cdx-success)' : r.safetyScore >= 90 ? 'var(--cdx-accent)' : 'var(--cdx-danger)', fontWeight: 600 } }, r.safetyScore) },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '進行中工事', value: PROJECTS.filter(p => p.status === 'active').length, unit: '件', icon: 'crane', color: 'var(--dept-04)' }),
      React.createElement(KPICard, { label: '総作業員数', value: PROJECTS.reduce((s, p) => s + p.workers, 0), unit: '名', icon: 'user', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: '平均進捗率', value: Math.round(PROJECTS.filter(p => p.status !== 'completed').reduce((s, p) => s + p.progress, 0) / PROJECTS.filter(p => p.status !== 'completed').length), unit: '%', icon: 'chart', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '遅延案件', value: PROJECTS.filter(p => p.status === 'delayed').length, unit: '件', icon: 'alertTriangle', color: 'var(--cdx-danger)', invertDelta: true })
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, { columns, data: PROJECTS, pageSize: 10, onRowClick: onSelect })
    )
  );
}

function ProjectDetail({ project }) {
  const p = project;
  const costPct = Math.round((p.spent / p.budget) * 100);
  return React.createElement('div', null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20, gap: 12 } },
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, '発注者'),
        React.createElement('div', { style: { fontSize: 13, fontWeight: 600 } }, p.client)
      ),
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, '現場所在地'),
        React.createElement('div', { style: { fontSize: 13, fontWeight: 600 } }, p.location)
      ),
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, 'ステータス'),
        React.createElement(StatusBadge, { type: p.status })
      )
    ),
    React.createElement('div', { className: 'cdx-grid cdx-grid-2', style: { marginBottom: 20, gap: 12 } },
      React.createElement('div', { className: 'cdx-card', style: { padding: 16 } },
        React.createElement('div', { className: 'cdx-card-title', style: { marginBottom: 8 } }, '工事進捗'),
        React.createElement(CDXProgressBar, { value: p.progress, color: 'var(--cdx-secondary)', height: 10 }),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' } },
          React.createElement('span', null, `開始: ${p.startDate}`),
          React.createElement('span', null, `完了: ${p.endDate}`)
        )
      ),
      React.createElement('div', { className: 'cdx-card', style: { padding: 16 } },
        React.createElement('div', { className: 'cdx-card-title', style: { marginBottom: 8 } }, '原価執行率'),
        React.createElement(CDXProgressBar, { value: costPct, color: costPct > 90 ? 'var(--cdx-danger)' : costPct > 70 ? 'var(--cdx-accent)' : 'var(--cdx-success)', height: 10 }),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 } },
          React.createElement('span', { style: { color: 'var(--text-muted)' } }, `執行: ${(p.spent / 100).toFixed(1)}億円`),
          React.createElement('span', { style: { fontWeight: 600 } }, `予算: ${(p.budget / 100).toFixed(1)}億円`)
        )
      )
    ),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { gap: 12 } },
      React.createElement('div', { style: { textAlign: 'center' } },
        React.createElement(CDXGauge, { value: p.safetyScore, label: '安全スコア', size: 100, color: p.safetyScore >= 95 ? 'var(--cdx-success)' : 'var(--cdx-accent)' })
      ),
      React.createElement('div', { style: { textAlign: 'center' } },
        React.createElement(CDXGauge, { value: p.workers, max: 60, label: '作業員数', size: 100, color: 'var(--cdx-secondary)' })
      ),
      React.createElement('div', { style: { textAlign: 'center' } },
        React.createElement(CDXGauge, { value: Math.round((p.endDate.replace('-', '') - p.startDate.replace('-', '')) * p.progress / 100), max: 24, label: '経過月数', size: 100, color: 'var(--dept-04)' })
      )
    )
  );
}

function ConstructionProgress() {
  const { PROJECTS } = window.CDX_DATA;
  const active = PROJECTS.filter(p => p.status !== 'completed');
  const progressData = active.map(p => ({ label: p.name.substring(0, 8) + '…', plan: Math.min(p.progress + 5, 100), actual: p.progress }));
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement(SectionHeader, { title: '出来高比較（計画 vs 実績）' }),
      React.createElement(CDXBarChart, { data: progressData, width: 800, height: 280, xKey: 'label', yKeys: ['plan', 'actual'], barColor: 'var(--border-hover)', secondaryColor: 'var(--cdx-secondary)' })
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: '工事別進捗一覧' }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        active.map(p => React.createElement('div', { key: p.id, style: { display: 'flex', alignItems: 'center', gap: 16 } },
          React.createElement('span', { style: { fontSize: 12, fontWeight: 600, width: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.name),
          React.createElement('div', { style: { flex: 1 } }, React.createElement(CDXProgressBar, { value: p.progress, color: p.status === 'delayed' ? 'var(--cdx-danger)' : 'var(--cdx-secondary)' })),
          React.createElement(StatusBadge, { type: p.status })
        ))
      )
    )
  );
}

function ConstructionReports({ onNew }) {
  const { DAILY_REPORTS, PROJECTS } = window.CDX_DATA;
  const columns = [
    { key: 'date', header: '日付', accessor: r => r.date, sortable: true },
    { key: 'project', header: '工事', accessor: r => { const p = PROJECTS.find(pp => pp.id === r.project); return p ? p.name.substring(0, 16) : r.project; }, sortable: true },
    { key: 'author', header: '作成者', accessor: r => r.author },
    { key: 'weather', header: '天候', accessor: r => r.weather },
    { key: 'workers', header: '作業員数', accessor: r => r.workers, align: 'right', sortable: true, sortValue: r => r.workers },
    { key: 'summary', header: '概要', accessor: r => r.summary },
    { key: 'status', header: 'ステータス', render: r => React.createElement(StatusBadge, { type: r.status }) },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 } },
      React.createElement(SectionHeader, { title: '工事日報' }),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary', onClick: onNew },
        React.createElement(CDXIcon, { name: 'plus', size: 14 }), '新規日報'
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, { columns, data: DAILY_REPORTS, pageSize: 10 })
    )
  );
}

function DailyReportForm({ onClose }) {
  const [form, setForm] = React.useState({ project: '', weather: '晴れ', workers: '', summary: '' });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' };
  return React.createElement('div', null,
    React.createElement('div', { style: fieldStyle },
      React.createElement('label', { style: labelStyle }, '工事'),
      React.createElement('select', { className: 'cdx-input cdx-select', value: form.project, onChange: e => update('project', e.target.value) },
        React.createElement('option', { value: '' }, '選択してください'),
        ...window.CDX_DATA.PROJECTS.filter(p => p.status === 'active').map(p => React.createElement('option', { key: p.id, value: p.id }, p.name))
      )
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } },
      React.createElement('div', { style: fieldStyle },
        React.createElement('label', { style: labelStyle }, '天候'),
        React.createElement('select', { className: 'cdx-input cdx-select', value: form.weather, onChange: e => update('weather', e.target.value) },
          ...['晴れ', '曇り', '雨', '雪'].map(w => React.createElement('option', { key: w, value: w }, w))
        )
      ),
      React.createElement('div', { style: fieldStyle },
        React.createElement('label', { style: labelStyle }, '作業員数'),
        React.createElement('input', { className: 'cdx-input', type: 'number', placeholder: '0', value: form.workers, onChange: e => update('workers', e.target.value) })
      )
    ),
    React.createElement('div', { style: fieldStyle },
      React.createElement('label', { style: labelStyle }, '作業概要'),
      React.createElement('textarea', { className: 'cdx-input', rows: 4, placeholder: '本日の作業内容を入力...', value: form.summary, onChange: e => update('summary', e.target.value), style: { resize: 'vertical' } })
    ),
    React.createElement('div', { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' } },
      React.createElement('button', { className: 'cdx-btn cdx-btn-ghost', onClick: onClose }, 'キャンセル'),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary', onClick: () => { alert('日報を保存しました'); onClose(); } }, '保存')
    )
  );
}

function ConstructionPhotos() {
  const photos = [
    { id: 1, title: '基礎杭打設 A1橋台', project: 'P-2026-001', date: '2026-05-23', tag: '基礎工' },
    { id: 2, title: '岸壁捨石投入', project: 'P-2026-002', date: '2026-05-23', tag: '海上工' },
    { id: 3, title: '護岸ブロック据付', project: 'P-2026-003', date: '2026-05-22', tag: '護岸工' },
    { id: 4, title: '配筋検査', project: 'P-2026-001', date: '2026-05-22', tag: '検査' },
    { id: 5, title: '覆工板補修', project: 'P-2026-005', date: '2026-05-22', tag: 'トンネル' },
    { id: 6, title: '鋼矢板打設', project: 'P-2026-004', date: '2026-05-21', tag: '仮設工' },
  ];
  const hues = [210, 30, 160, 280, 45, 190];
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '現場写真' },
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary cdx-btn-sm' }, React.createElement(CDXIcon, { name: 'plus', size: 14 }), 'アップロード')
    ),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3' },
      photos.map((ph, i) => React.createElement('div', { key: ph.id, className: 'cdx-card', style: { padding: 0, overflow: 'hidden' } },
        React.createElement('div', { style: { height: 140, background: `linear-gradient(135deg, oklch(0.55 0.12 ${hues[i]}), oklch(0.42 0.08 ${hues[i] + 40}))`, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          React.createElement(CDXIcon, { name: 'crane', size: 40, color: 'rgba(255,255,255,0.4)' })
        ),
        React.createElement('div', { style: { padding: 12 } },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 } }, ph.title),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
            React.createElement('span', { style: { fontSize: 11, color: 'var(--text-muted)' } }, ph.date),
            React.createElement('span', { className: 'cdx-badge cdx-badge-info' }, ph.tag)
          )
        )
      ))
    )
  );
}

window.PageConstruction = PageConstruction;
