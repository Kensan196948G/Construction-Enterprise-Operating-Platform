/* Construction DX One Platform — Common Platform Page */

function PageCommon() {
  const { COMMON } = window.CDX_DATA;
  const [tab, setTab] = React.useState('services');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'services', label: 'サービス状態' }, { id: 'api', label: 'APIメトリクス' }, { id: 'auth', label: '認証管理' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'services' && React.createElement(CommonServices, null),
      tab === 'api' && React.createElement(CommonAPI, null),
      tab === 'auth' && React.createElement(CommonAuth, null)
    )
  );
}

function CommonServices() {
  const { COMMON } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: 'サービス稼働率', value: '99.98', unit: '%', icon: 'server', color: 'var(--cdx-success)', spark: [99.92, 99.95, 99.97, 99.98] }),
      React.createElement(KPICard, { label: '平均応答時間', value: '12', unit: 'ms', icon: 'zap', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: 'エラー率', value: '0.02', unit: '%', icon: 'activity', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: 'アクティブ接続', value: '847', icon: 'link', color: 'var(--dept-00)' })
    ),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3' },
      COMMON.services.map((svc, i) => React.createElement('div', { key: i, className: 'cdx-card' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 14, fontWeight: 700 } }, svc.name),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, svc.desc)
          ),
          React.createElement('div', { style: { width: 10, height: 10, borderRadius: '50%', background: svc.status === 'healthy' ? 'var(--cdx-success)' : 'var(--cdx-danger)' } })
        ),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 10, color: 'var(--text-muted)' } }, 'CPU'),
            React.createElement(CDXProgressBar, { value: svc.cpu, height: 4, showLabel: true, color: svc.cpu > 70 ? 'var(--cdx-danger)' : svc.cpu > 50 ? 'var(--cdx-accent)' : 'var(--cdx-success)' })
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 10, color: 'var(--text-muted)' } }, 'メモリ'),
            React.createElement(CDXProgressBar, { value: svc.mem, height: 4, showLabel: true, color: svc.mem > 80 ? 'var(--cdx-danger)' : svc.mem > 60 ? 'var(--cdx-accent)' : 'var(--cdx-success)' })
          )
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' } },
          React.createElement('span', null, `稼働率: ${svc.uptime}%`),
          React.createElement('span', null, svc.version)
        )
      ))
    )
  );
}

function CommonAPI() {
  const { COMMON } = window.CDX_DATA;
  const apiData = [
    { label: '00:00', req: 800, err: 2 }, { label: '04:00', req: 200, err: 0 }, { label: '08:00', req: 1800, err: 3 },
    { label: '09:00', req: 3200, err: 5 }, { label: '10:00', req: 2800, err: 4 }, { label: '12:00', req: 2200, err: 2 },
    { label: '14:00', req: 2600, err: 3 }, { label: '16:00', req: 2400, err: 2 }, { label: '18:00', req: 1200, err: 1 },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '総リクエスト', value: '2.4M', unit: '/日', icon: 'activity', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: '平均レイテンシ', value: '12', unit: 'ms', icon: 'zap', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: 'エラー率', value: '0.02', unit: '%', icon: 'alertTriangle', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: 'アクティブ接続', value: '847', icon: 'link', color: 'var(--dept-00)' })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '時間帯別リクエスト数' }),
        React.createElement(CDXBarChart, { data: apiData, width: 420, height: 220, xKey: 'label', yKeys: ['req'], barColor: 'var(--cdx-secondary)' })
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: 'エンドポイント別レイテンシ' }),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
          [
            { path: '/api/v1/projects', latency: 8, calls: '420K' },
            { path: '/api/v1/safety', latency: 11, calls: '280K' },
            { path: '/api/v1/auth/token', latency: 15, calls: '890K' },
            { path: '/api/v1/documents', latency: 22, calls: '180K' },
            { path: '/api/v1/iot/stream', latency: 5, calls: '1.2M' },
          ].map((ep, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12 } },
            React.createElement('code', { style: { fontSize: 11, color: 'var(--cdx-secondary)', width: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, ep.path),
            React.createElement('div', { style: { flex: 1 } }, React.createElement(CDXProgressBar, { value: ep.latency, max: 30, height: 6, color: ep.latency > 20 ? 'var(--cdx-accent)' : 'var(--cdx-success)' })),
            React.createElement('span', { style: { fontSize: 11, color: 'var(--text-muted)', width: 60, textAlign: 'right' } }, ep.calls)
          ))
        )
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: 'レート制限設定' }),
      React.createElement('div', { className: 'cdx-grid cdx-grid-3' },
        [
          { role: '管理者', limit: '10,000/min', usage: 12 },
          { role: '一般ユーザー', limit: '1,000/min', usage: 34 },
          { role: 'API連携', limit: '5,000/min', usage: 45 },
        ].map((r, i) => React.createElement('div', { key: i, style: { padding: 12, borderRadius: 8, background: 'var(--bg-body)' } },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 } }, r.role),
          React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 } }, `上限: ${r.limit}`),
          React.createElement(CDXProgressBar, { value: r.usage, height: 4, color: 'var(--cdx-secondary)' })
        ))
      )
    )
  );
}

function CommonAuth() {
  const { COMMON } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: 'アクティブセッション', value: COMMON.authSessions.active, icon: 'users', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: '本日ログイン数', value: COMMON.authSessions.today, icon: 'user', color: 'var(--dept-00)' }),
      React.createElement(KPICard, { label: 'MFA適用率', value: COMMON.authSessions.mfa, unit: '%', icon: 'lock', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: 'SSO有効', value: COMMON.authSessions.ssoProviders.length, unit: 'プロバイダ', icon: 'shield', color: 'var(--dept-10)' })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: 'SSO プロバイダ' }),
        COMMON.authSessions.ssoProviders.map((p, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 1 ? '1px solid var(--border-color)' : 'none' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            React.createElement('div', { style: { width: 36, height: 36, borderRadius: 8, background: 'var(--cdx-secondary)' + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
              React.createElement(CDXIcon, { name: 'lock', size: 16, color: 'var(--cdx-secondary)' })
            ),
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 13, fontWeight: 600 } }, p),
              React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, 'OIDC / OAuth 2.0')
            )
          ),
          React.createElement(StatusBadge, { type: 'safe', label: '接続中' })
        ))
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: 'RBAC ロール一覧' }),
        ...['システム管理者', '部門管理者', '施工管理者', '安全管理者', '営業', '閲覧者'].map((role, i) =>
          React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border-color)' : 'none', fontSize: 13 } },
            React.createElement('span', { style: { fontWeight: 500 } }, role),
            React.createElement('span', { style: { fontSize: 11, color: 'var(--text-muted)' } }, `${[3, 8, 12, 6, 15, 42][i]}名`)
          )
        )
      )
    )
  );
}

window.PageCommon = PageCommon;
