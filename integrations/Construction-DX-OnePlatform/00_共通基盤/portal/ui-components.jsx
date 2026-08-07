/* Construction DX One Platform — Shared UI Components */

/* ── SVG Icons (lightweight inline) ── */
const ICON_PATHS = {
  home: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  chart: 'M3 3v18h18M7 14l4-4 4 4 5-6',
  handshake: 'M2 14l6-6 4 4 6-6M15 8h5v5',
  globe: 'M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c3 3 4 6 4 10s-1 7-4 10M12 2c-3 3-4 6-4 10s1 7 4 10',
  crane: 'M4 21h16M10 21V3h4v18M6 7h12M14 7l4 6',
  brain: 'M12 2a7 7 0 017 7c0 3-2 5-4 7l-3 3-3-3c-2-2-4-4-4-7a7 7 0 017-7z',
  shield: 'M12 2l8 4v6c0 5-3 9-8 11-5-2-8-6-8-11V6l8-4zM9 12l2 2 4-4',
  building: 'M3 21h18M5 21V5l7-3 7 3v16M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1',
  package: 'M16.5 9.4l-9-5.2M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7L12 12l8.7-5M12 22V12',
  ship: 'M2 20l2-3h16l2 3M4 17V9l8-5 8 5v8M8 17v-4h3v4M13 17v-4h3v4',
  lock: 'M5 11h14v10H5V11zM8 11V7a4 4 0 018 0v4M12 15v2',
  clipboard: 'M9 2h6v3H9V2zM7 4H5v17h14V4h-2M9 10h6M9 14h4',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM20 12h-2M6 12H4M17.7 17.7l-1.4-1.4M7.7 7.7L6.3 6.3M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M12 4v2M12 18v2',
  database: 'M12 2C7 2 3 3.8 3 6v12c0 2.2 4 4 9 4s9-1.8 9-4V6c0-2.2-4-4-9-4zM3 6c0 2.2 4 4 9 4s9-1.8 9-4M3 12c0 2.2 4 4 9 4s9-1.8 9-4',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  server: 'M2 4h20v6H2V4zM2 14h20v6H2v-6zM6 7h.01M6 17h.01',
  link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  anchor: 'M12 8a3 3 0 100-6 3 3 0 000 6zM12 8v14M5 12H2a10 10 0 0020 0h-3',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  truck: 'M1 3h15v13H1V3zM16 8h4l3 3v5h-7V8zM5.5 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  dollarSign: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  bookmark: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z',
  folder: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  filter: 'M22 3H2l8 9.5V20l4 2v-8.5L22 3',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6L6 18M6 6l12 12',
  chevronDown: 'M6 9l6 6 6-6',
  check: 'M20 6L9 17l-5-5',
  trendUp: 'M23 6l-9.5 9.5-5-5L1 18',
  trendDown: 'M23 18l-9.5-9.5-5 5L1 6',
  alertTriangle: 'M12 2L1 21h22L12 2zM12 9v4M12 17h.01',
  menu: 'M3 12h18M3 6h18M3 18h18',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  printer: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z',
  fileText: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8',
};

function CDXIcon({ name, size = 20, color = 'currentColor', style = {} }) {
  const d = ICON_PATHS[name] || ICON_PATHS.home;
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { flexShrink: 0, ...style }
  }, React.createElement('path', { d }));
}

/* ── KPI Card ── */
function KPICard({ label, value, unit, delta, caption, icon, color, spark, invertDelta = false }) {
  const isPositive = delta > 0;
  const isGood = invertDelta ? !isPositive : isPositive;
  return React.createElement('div', { className: 'cdx-card cdx-kpi cdx-fade-in' },
    React.createElement('div', { className: 'cdx-card-header', style: { marginBottom: 8 } },
      React.createElement('span', { className: 'cdx-card-title' }, label),
      icon && React.createElement('div', { style: { width: 32, height: 32, borderRadius: 8, background: (color || 'var(--cdx-primary)') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement(CDXIcon, { name: icon, size: 16, color: color || 'var(--cdx-primary)' })
      )
    ),
    React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: 4 } },
      React.createElement('span', { className: 'cdx-kpi-value' }, value),
      unit && React.createElement('span', { className: 'cdx-kpi-unit' }, unit)
    ),
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 } },
      React.createElement('div', null,
        delta != null && React.createElement('span', { className: `cdx-kpi-delta ${isGood ? 'up' : 'down'}` },
          React.createElement(CDXIcon, { name: isPositive ? 'trendUp' : 'trendDown', size: 12 }),
          `${isPositive ? '+' : ''}${delta}%`
        ),
        caption && React.createElement('span', { style: { fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 } }, caption)
      ),
      spark && React.createElement(CDXSparkline, { data: spark, width: 64, height: 20, color: color || 'var(--cdx-primary)', fill: true })
    )
  );
}

/* ── Status Badge ── */
function StatusBadge({ type, label }) {
  const cls = {
    safe: 'cdx-badge-safe', success: 'cdx-badge-safe',
    warning: 'cdx-badge-warning', caution: 'cdx-badge-warning',
    danger: 'cdx-badge-danger', critical: 'cdx-badge-danger',
    info: 'cdx-badge-info', neutral: 'cdx-badge-neutral',
    active: 'cdx-badge-safe', completed: 'cdx-badge-info',
    delayed: 'cdx-badge-danger', draft: 'cdx-badge-neutral',
    submitted: 'cdx-badge-warning', approved: 'cdx-badge-safe',
    open: 'cdx-badge-danger', in_progress: 'cdx-badge-warning',
    resolved: 'cdx-badge-safe',
    high: 'cdx-badge-danger', medium: 'cdx-badge-warning', low: 'cdx-badge-info',
  }[type] || 'cdx-badge-neutral';
  const text = label || { active: '進行中', completed: '完了', delayed: '遅延', draft: '下書き', submitted: '提出済', approved: '承認済', open: 'オープン', in_progress: '対応中', resolved: '解決済', safe: '安全', warning: '注意', danger: '危険', caution: '注意', high: '高', medium: '中', low: '低', critical: '緊急', info: '情報', success: '正常' }[type] || type;
  return React.createElement('span', { className: `cdx-badge ${cls}` }, text);
}

/* ── Phase Badge ── */
function PhaseBadge({ phase }) {
  return React.createElement('span', { className: `cdx-phase cdx-phase-${phase}` }, `Phase ${phase}`);
}

/* ── 4M Category Chip ── */
function FourMChip({ category }) {
  const cfg = { man: { label: '人', color: 'var(--cdx-4m-man)' }, machine: { label: '機械', color: 'var(--cdx-4m-machine)' }, material: { label: '材料', color: 'var(--cdx-4m-material)' }, method: { label: '方法', color: 'var(--cdx-4m-method)' } };
  const c = cfg[category] || cfg.man;
  return React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: c.color + '18', color: c.color, borderLeft: `3px solid ${c.color}` } }, c.label);
}

/* ── Data Table with sort/filter ── */
function DataTableCDX({ columns, data, pageSize = 10, onRowClick }) {
  const [sortKey, setSortKey] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const [page, setPage] = React.useState(0);
  const [filterText, setFilterText] = React.useState('');

  const filtered = data.filter(row => {
    if (!filterText) return true;
    return columns.some(c => {
      const v = typeof c.accessor === 'function' ? c.accessor(row) : row[c.key];
      return String(v).toLowerCase().includes(filterText.toLowerCase());
    });
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const col = columns.find(c => c.key === sortKey);
    const va = col && col.sortValue ? col.sortValue(a) : (typeof col.accessor === 'function' ? col.accessor(a) : a[col.key]);
    const vb = col && col.sortValue ? col.sortValue(b) : (typeof col.accessor === 'function' ? col.accessor(b) : b[col.key]);
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'ja');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return React.createElement('div', null,
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } },
      React.createElement('div', { style: { position: 'relative', flex: '0 0 260px' } },
        React.createElement('input', { className: 'cdx-input', placeholder: '検索...', value: filterText, onChange: e => { setFilterText(e.target.value); setPage(0); }, style: { paddingLeft: 32 } }),
        React.createElement('div', { style: { position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' } },
          React.createElement(CDXIcon, { name: 'search', size: 14, color: 'var(--text-muted)' })
        )
      ),
      React.createElement('span', { style: { fontSize: 12, color: 'var(--text-muted)' } }, `${sorted.length}件`)
    ),
    React.createElement('div', { className: 'cdx-table-wrap' },
      React.createElement('table', { className: 'cdx-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            ...columns.map(c => React.createElement('th', { key: c.key, onClick: () => c.sortable !== false && toggleSort(c.key), style: c.width ? { width: c.width } : {} },
              React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4 } },
                c.header,
                sortKey === c.key && React.createElement('span', { style: { fontSize: 10 } }, sortDir === 'asc' ? '▲' : '▼')
              )
            ))
          )
        ),
        React.createElement('tbody', null,
          paged.length === 0
            ? React.createElement('tr', null, React.createElement('td', { colSpan: columns.length, style: { textAlign: 'center', padding: 32, color: 'var(--text-muted)' } }, 'データがありません'))
            : paged.map((row, ri) => React.createElement('tr', { key: ri, onClick: () => onRowClick && onRowClick(row), style: onRowClick ? { cursor: 'pointer' } : {} },
                ...columns.map(c => React.createElement('td', { key: c.key, style: c.align === 'right' ? { textAlign: 'right' } : {} },
                  c.render ? c.render(row) : (typeof c.accessor === 'function' ? c.accessor(row) : row[c.key])
                ))
              ))
        )
      )
    ),
    totalPages > 1 && React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 12 } },
      React.createElement('span', { style: { color: 'var(--text-muted)' } }, `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, sorted.length)} / ${sorted.length}件`),
      React.createElement('div', { style: { display: 'flex', gap: 4 } },
        React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', disabled: page === 0, onClick: () => setPage(p => p - 1) }, '← 前へ'),
        React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', disabled: page >= totalPages - 1, onClick: () => setPage(p => p + 1) }, '次へ →')
      )
    )
  );
}

/* ── Alert Row ── */
function AlertRow({ alert }) {
  const iconColor = { danger: 'var(--cdx-danger)', warning: 'var(--cdx-accent)', info: 'var(--cdx-secondary)' }[alert.severity] || 'var(--text-muted)';
  return React.createElement('div', { style: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-color)' } },
    React.createElement('div', { style: { width: 8, height: 8, borderRadius: '50%', background: iconColor, marginTop: 5, flexShrink: 0 } }),
    React.createElement('div', { style: { flex: 1, minWidth: 0 } },
      React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' } }, alert.title),
      React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 } }, alert.desc)
    ),
    React.createElement('span', { style: { fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' } }, alert.time)
  );
}

/* ── Section Header ── */
function SectionHeader({ title, action, children }) {
  return React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } },
    React.createElement('h2', { style: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' } }, title),
    action || children || null
  );
}

/* ── Modal ── */
function CDXModal({ open, onClose, title, children, width }) {
  if (!open) return null;
  return React.createElement('div', { className: 'cdx-modal-overlay', onClick: onClose },
    React.createElement('div', { className: 'cdx-modal cdx-fade-in', onClick: e => e.stopPropagation(), style: width ? { maxWidth: width } : {} },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } },
        React.createElement('h3', { style: { fontSize: 16, fontWeight: 700 } }, title),
        React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', onClick: onClose }, React.createElement(CDXIcon, { name: 'x', size: 16 }))
      ),
      children
    )
  );
}

/* ── Tabs ── */
function CDXTabs({ tabs, active, onChange }) {
  return React.createElement('div', { className: 'cdx-tabs' },
    tabs.map(t => React.createElement('button', {
      key: t.id, className: `cdx-tab ${active === t.id ? 'active' : ''}`,
      onClick: () => onChange(t.id)
    }, t.label))
  );
}

/* ── Theme Toggle Button ── */
function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return React.createElement('button', {
    className: 'cdx-btn cdx-btn-ghost cdx-btn-xs',
    onClick: onToggle,
    title: isDark ? 'ライトモードに切替' : 'ダークモードに切替',
    style: { padding: '5px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }
  },
    React.createElement('div', { style: { position: 'relative', width: 36, height: 20, borderRadius: 10, background: isDark ? 'var(--cdx-secondary)' : 'var(--border-color)', transition: 'background .3s', cursor: 'pointer' } },
      React.createElement('div', { style: { position: 'absolute', top: 2, left: isDark ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: isDark ? '#1e293b' : '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .3s', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        isDark
          ? React.createElement('svg', { width: 10, height: 10, viewBox: '0 0 24 24', fill: '#facc15', stroke: 'none' },
              React.createElement('path', { d: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' }))
          : React.createElement('svg', { width: 10, height: 10, viewBox: '0 0 24 24', fill: '#f59e0b', stroke: 'none' },
              React.createElement('circle', { cx: 12, cy: 12, r: 5 }),
              React.createElement('path', { d: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' }))
      )
    )
  );
}

Object.assign(window, { CDXIcon, KPICard, StatusBadge, PhaseBadge, FourMChip, DataTableCDX, AlertRow, SectionHeader, CDXModal, CDXTabs, ThemeToggle });
