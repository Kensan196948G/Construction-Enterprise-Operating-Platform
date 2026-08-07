/* Construction DX One Platform — Portal Page */

function PagePortal() {
  const { PORTAL_KPIS, PHASE_PROGRESS, DEPT_KPIS, ALERTS, DEPARTMENTS } = window.CDX_DATA;
  const depts = DEPARTMENTS.filter(d => !['portal', 'audit', 'settings'].includes(d.id));

  return React.createElement('div', { className: 'cdx-fade-in' },
    /* KPI Row */
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 24 } },
      PORTAL_KPIS.map((k, i) => React.createElement(KPICard, {
        key: i, label: k.label, value: k.value, unit: k.unit,
        delta: k.delta, caption: k.caption,
        icon: ['chart', 'chart', 'shield', 'lock'][i],
        color: ['var(--cdx-secondary)', 'var(--cdx-primary)', 'var(--cdx-success)', 'var(--dept-10)'][i],
        spark: [
          [98, 102, 108, 115, 122, 128.4],
          [7.9, 8.1, 8.3, 8.5, 8.7],
          [280, 300, 310, 325, 340, 347],
          [99.2, 99.5, 99.3, 99.6, 99.7]
        ][i]
      }))
    ),

    /* Phase Progress */
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 24 } },
      React.createElement(SectionHeader, { title: 'フェーズ進捗' }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
        PHASE_PROGRESS.map(p => React.createElement('div', { key: p.phase },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              React.createElement(PhaseBadge, { phase: p.phase }),
              React.createElement('span', { style: { fontSize: 13, fontWeight: 600 } }, p.label)
            ),
            React.createElement('span', { style: { fontSize: 12, color: 'var(--text-muted)' } }, p.items.join(' / '))
          ),
          React.createElement(CDXProgressBar, { value: p.progress, color: p.color })
        ))
      )
    ),

    /* Department Grid + Alerts */
    React.createElement('div', { className: 'cdx-portal-grid' },
      /* Department Cards */
      React.createElement('div', null,
        React.createElement(SectionHeader, { title: '部門システム一覧' }),
        React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { gap: 14 } },
          depts.filter(d => d.system).map((dept, i) => {
            const kpi = DEPT_KPIS.find(k => k.dept === dept.id);
            return React.createElement('div', {
              key: dept.id, className: 'cdx-card',
              style: { padding: 16, cursor: 'pointer', borderTop: `3px solid ${dept.color}`, transition: 'transform .15s, box-shadow .15s' },
              onClick: () => window.__cdxNavigate && window.__cdxNavigate(dept.id),
              onMouseEnter: e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; },
              onMouseLeave: e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; },
            },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  React.createElement('div', { style: { width: 28, height: 28, borderRadius: 6, background: dept.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                    React.createElement(CDXIcon, { name: dept.icon, size: 14, color: dept.color })
                  ),
                  React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' } }, dept.name)
                ),
                dept.phase && React.createElement(PhaseBadge, { phase: dept.phase })
              ),
              React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 } }, dept.system),
              kpi && React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                React.createElement('div', null,
                  React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, kpi.metric),
                  React.createElement('div', { style: { fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' } }, kpi.value)
                ),
                React.createElement(CDXSparkline, { data: kpi.trend, width: 56, height: 20, color: dept.color, fill: true })
              )
            );
          })
        )
      ),

      /* Alerts Panel */
      React.createElement('div', null,
        React.createElement(SectionHeader, { title: '最新アラート' },
          React.createElement(StatusBadge, { type: 'danger', label: `${ALERTS.filter(a => a.severity === 'danger').length} 件` })
        ),
        React.createElement('div', { className: 'cdx-card', style: { padding: 16 } },
          ALERTS.map(a => React.createElement(AlertRow, { key: a.id, alert: a }))
        ),

        /* System health */
        React.createElement('div', { className: 'cdx-card', style: { marginTop: 16, padding: 16 } },
          React.createElement('div', { className: 'cdx-card-title', style: { marginBottom: 12 } }, 'システムヘルス'),
          ...[
            { name: 'API Gateway', status: 'up', latency: '12ms' },
            { name: 'PostgreSQL', status: 'up', latency: '3ms' },
            { name: 'Redis', status: 'up', latency: '1ms' },
            { name: 'Elasticsearch', status: 'up', latency: '8ms' },
            { name: 'FortiGate', status: 'up', latency: '5ms' },
          ].map((s, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              React.createElement('div', { style: { width: 6, height: 6, borderRadius: '50%', background: s.status === 'up' ? 'var(--cdx-success)' : 'var(--cdx-danger)' } }),
              React.createElement('span', { style: { fontSize: 12, color: 'var(--text-primary)' } }, s.name)
            ),
            React.createElement('span', { style: { fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' } }, s.latency)
          ))
        )
      )
    )
  );
}

window.PagePortal = PagePortal;
