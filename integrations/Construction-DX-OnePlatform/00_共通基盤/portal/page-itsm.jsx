/* Construction DX One Platform — ITSM & Zero Trust Page */

function PageITSM() {
  const [tab, setTab] = React.useState('dashboard');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'dashboard', label: 'ダッシュボード' }, { id: 'tickets', label: 'チケット' }, { id: 'security', label: 'セキュリティ' }, { id: 'assets', label: '資産管理' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'dashboard' && React.createElement(ITSMDashboard, null),
      tab === 'tickets' && React.createElement(ITSMTickets, null),
      tab === 'security' && React.createElement(ITSMSecurity, null),
      tab === 'assets' && React.createElement(ITSMAssets, null)
    )
  );
}

function ITSMDashboard() {
  const { ITSM_STATS } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: 'オープンチケット', value: ITSM_STATS.openTickets, unit: '件', icon: 'clipboard', color: 'var(--cdx-accent)', spark: [32, 28, 26, 25, 24] }),
      React.createElement(KPICard, { label: '本日解決', value: ITSM_STATS.resolvedToday, unit: '件', icon: 'check', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '平均解決時間', value: ITSM_STATS.avgResolution, icon: 'chart', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: 'SLA遵守率', value: ITSM_STATS.slaCompliance, unit: '%', icon: 'shield', color: 'var(--dept-10)', spark: [96.5, 97.2, 97.8, 98.0, 98.2] })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: 'カテゴリ別チケット' }),
        React.createElement(CDXDonutChart, { data: ITSM_STATS.byCategory.map(c => ({ name: c.name, value: c.count, color: c.color })), size: 130 })
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '週間チケット推移' }),
        React.createElement(CDXLineChart, {
          data: [
            { label: '月', open: 28, resolved: 25 }, { label: '火', open: 24, resolved: 22 },
            { label: '水', open: 30, resolved: 27 }, { label: '木', open: 26, resolved: 24 },
            { label: '金', open: 24, resolved: 20 },
          ],
          width: 400, height: 200, xKey: 'label', yKeys: ['open', 'resolved'],
          colors: ['var(--cdx-accent)', 'var(--cdx-success)'], labels: ['起票', '解決']
        })
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: 'サービスヘルス' }),
      React.createElement('div', { className: 'cdx-grid cdx-grid-5' },
        [
          { name: 'Entra ID / SSO', up: 99.99, status: 'up' },
          { name: 'SharePoint Online', up: 99.95, status: 'up' },
          { name: 'Exchange Online', up: 99.98, status: 'up' },
          { name: 'FortiGate VPN', up: 99.80, status: 'degraded' },
          { name: 'DeskNet\'s NEO', up: 99.92, status: 'up' },
        ].map((svc, i) => React.createElement('div', { key: i, style: { textAlign: 'center' } },
          React.createElement(CDXGauge, { value: svc.up, max: 100, label: '', size: 80, color: svc.status === 'up' ? 'var(--cdx-success)' : 'var(--cdx-accent)' }),
          React.createElement('div', { style: { fontSize: 11, fontWeight: 600, marginTop: 4 } }, svc.name),
          React.createElement('div', { style: { fontSize: 10, color: 'var(--text-muted)' } }, `${svc.up}%`)
        ))
      )
    )
  );
}

function ITSMTickets() {
  const { ITSM_TICKETS } = window.CDX_DATA;
  const [showNew, setShowNew] = React.useState(false);
  const columns = [
    { key: 'id', header: 'チケットID', accessor: r => r.id, width: '100px', sortable: true },
    { key: 'priority', header: '優先度', width: '70px', render: r => React.createElement(StatusBadge, { type: r.priority }), sortable: true, sortValue: r => ({ critical: 0, high: 1, medium: 2, low: 3 })[r.priority] },
    { key: 'title', header: 'タイトル', accessor: r => r.title, sortable: true },
    { key: 'assignee', header: '担当者', accessor: r => r.assignee },
    { key: 'status', header: 'ステータス', width: '90px', render: r => React.createElement(StatusBadge, { type: r.status }) },
    { key: 'created', header: '起票日時', accessor: r => r.created, sortable: true, width: '140px' },
    { key: 'sla', header: 'SLA', accessor: r => r.sla, width: '60px' },
    { key: 'remaining', header: '残時間', width: '80px', render: r => React.createElement('span', { style: { fontWeight: 600, color: r.remaining === '—' ? 'var(--text-muted)' : r.remaining.includes('h') && parseInt(r.remaining) <= 1 ? 'var(--cdx-danger)' : 'var(--text-primary)' } }, r.remaining) },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
      React.createElement(SectionHeader, { title: 'インシデントチケット' }),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary', onClick: () => setShowNew(true) },
        React.createElement(CDXIcon, { name: 'plus', size: 14 }), '新規チケット'
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, { columns, data: ITSM_TICKETS, pageSize: 10 })
    ),
    React.createElement(CDXModal, { open: showNew, onClose: () => setShowNew(false), title: '新規チケット起票', width: 600 },
      React.createElement(TicketForm, { onClose: () => setShowNew(false) })
    )
  );
}

function TicketForm({ onClose }) {
  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' };
  return React.createElement('div', null,
    React.createElement('div', { style: fieldStyle },
      React.createElement('label', { style: labelStyle }, 'タイトル'),
      React.createElement('input', { className: 'cdx-input', placeholder: '障害の概要を入力' })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } },
      React.createElement('div', { style: fieldStyle },
        React.createElement('label', { style: labelStyle }, '優先度'),
        React.createElement('select', { className: 'cdx-input cdx-select' },
          ...['低', '中', '高', '緊急'].map(p => React.createElement('option', { key: p }, p))
        )
      ),
      React.createElement('div', { style: fieldStyle },
        React.createElement('label', { style: labelStyle }, 'カテゴリ'),
        React.createElement('select', { className: 'cdx-input cdx-select' },
          ...['ネットワーク', '認証/ID', 'アプリケーション', 'ハードウェア', 'その他'].map(c => React.createElement('option', { key: c }, c))
        )
      )
    ),
    React.createElement('div', { style: fieldStyle },
      React.createElement('label', { style: labelStyle }, '詳細'),
      React.createElement('textarea', { className: 'cdx-input', rows: 4, placeholder: '障害の詳細・再現手順を記載', style: { resize: 'vertical' } })
    ),
    React.createElement('div', { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' } },
      React.createElement('button', { className: 'cdx-btn cdx-btn-ghost', onClick: onClose }, 'キャンセル'),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary', onClick: () => { alert('チケットを起票しました'); onClose(); } }, '起票')
    )
  );
}

function ITSMSecurity() {
  const { ITSM_STATS } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: 'セキュリティアラート', value: 4, unit: '件/今日', icon: 'shield', color: 'var(--cdx-accent)' }),
      React.createElement(KPICard, { label: '脅威ブロック', value: 127, unit: '件/週', icon: 'lock', color: 'var(--cdx-danger)' }),
      React.createElement(KPICard, { label: 'ゼロトラスト準拠率', value: 94, unit: '%', icon: 'shield', color: 'var(--cdx-success)', spark: [88, 90, 91, 93, 94] })
    ),
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement(SectionHeader, { title: 'セキュリティイベントフィード' }),
      ITSM_STATS.securityAlerts.map((a, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < ITSM_STATS.securityAlerts.length - 1 ? '1px solid var(--border-color)' : 'none' } },
        React.createElement('span', { style: { fontSize: 11, color: 'var(--text-muted)', width: 80, flexShrink: 0, fontVariantNumeric: 'tabular-nums' } }, a.time),
        React.createElement('div', { style: { width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: a.type === 'warning' ? 'var(--cdx-accent)' : 'var(--cdx-secondary)' } }),
        React.createElement('span', { style: { fontSize: 13 } }, a.message)
      ))
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: 'ゼロトラスト対策状況' }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        [
          { name: 'Entra ID 条件付きアクセス', score: 100 },
          { name: 'HENNGE SSO 多要素認証', score: 98 },
          { name: 'FortiGate ZTNA', score: 92 },
          { name: 'Intune デバイスコンプライアンス', score: 88 },
          { name: 'Wazuh SIEM 監視', score: 95 },
        ].map((z, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12 } },
          React.createElement('span', { style: { fontSize: 13, fontWeight: 500, width: 240 } }, z.name),
          React.createElement('div', { style: { flex: 1 } }, React.createElement(CDXProgressBar, { value: z.score, color: z.score >= 95 ? 'var(--cdx-success)' : z.score >= 90 ? 'var(--cdx-secondary)' : 'var(--cdx-accent)' }))
        ))
      )
    )
  );
}

function ITSMAssets() {
  const { ITSM_STATS } = window.CDX_DATA;
  const a = ITSM_STATS.assets;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '管理資産（合計）', value: a.total, unit: '台', icon: 'package', color: 'var(--dept-10)' }),
      React.createElement(KPICard, { label: '管理済み', value: a.managed, unit: '台', icon: 'check', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '未管理', value: a.unmanaged, unit: '台', icon: 'alertTriangle', color: 'var(--cdx-danger)', invertDelta: true })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '資産種別' }),
        React.createElement(CDXDonutChart, {
          data: Object.entries(a.byType).map(([k, v], i) => ({
            name: { PC: 'PC', server: 'サーバー', network: 'ネットワーク機器', mobile: 'モバイル', other: 'その他' }[k],
            value: v,
            color: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#94a3b8'][i]
          })), size: 140
        })
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: 'CMDB 接続マップ' }),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
          [
            { name: 'Active Directory', count: 312, status: 'synced' },
            { name: 'Entra ID', count: 308, status: 'synced' },
            { name: 'FortiGate', count: 47, status: 'synced' },
            { name: 'Cisco Switch', count: 24, status: 'synced' },
            { name: 'Zabbix', count: 487, status: 'synced' },
            { name: 'Wazuh Agent', count: 462, status: 'partial' },
          ].map((cm, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, background: 'var(--bg-body)' } },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 12, fontWeight: 600 } }, cm.name),
              React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, `${cm.count} 台`)
            ),
            React.createElement('div', { style: { width: 8, height: 8, borderRadius: '50%', background: cm.status === 'synced' ? 'var(--cdx-success)' : 'var(--cdx-accent)' } })
          ))
        )
      )
    )
  );
}

window.PageITSM = PageITSM;
