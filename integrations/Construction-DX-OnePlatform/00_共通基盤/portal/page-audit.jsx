/* Construction DX One Platform — Audit Page (with PDF/HTML export) */

function PageAudit() {
  const { AUDIT_LOGS } = window.CDX_DATA;
  const [filterDept, setFilterDept] = React.useState('all');
  const [filterAction, setFilterAction] = React.useState('all');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  const filtered = AUDIT_LOGS.filter(log => {
    if (filterDept !== 'all' && log.dept !== filterDept) return false;
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (dateFrom && log.timestamp < dateFrom) return false;
    if (dateTo && log.timestamp > dateTo + ' 23:59') return false;
    return true;
  });

  const depts = [...new Set(AUDIT_LOGS.map(l => l.dept))];
  const actions = [...new Set(AUDIT_LOGS.map(l => l.action))];

  const exportHTML = () => {
    const rows = filtered.map(l =>
      `<tr><td>${l.timestamp}</td><td>${l.user}</td><td>${l.dept}</td><td>${l.action}</td><td>${l.target}</td><td>${l.detail}</td><td>${l.ip}</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>監査ログ — Construction DX One Platform</title>
<style>body{font-family:'M PLUS 1p',sans-serif;padding:40px;color:#0f172a}h1{font-size:20px;margin-bottom:4px}
.meta{font-size:12px;color:#64748b;margin-bottom:24px}table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;padding:8px 10px;background:#f1f5f9;border-bottom:2px solid #e2e8f0;font-size:11px;text-transform:uppercase}
td{padding:8px 10px;border-bottom:1px solid #e2e8f0}tr:hover td{background:#f8fafc}</style></head>
<body><h1>監査ログレポート</h1><p class="meta">出力日時: ${new Date().toLocaleString('ja-JP')} / 件数: ${filtered.length}件</p>
<table><thead><tr><th>日時</th><th>ユーザー</th><th>部門</th><th>操作</th><th>対象</th><th>詳細</th><th>IP</th></tr></thead>
<tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit_log_${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const printWin = window.open('', '_blank');
    const rows = filtered.map(l =>
      `<tr><td>${l.timestamp}</td><td>${l.user}</td><td>${l.dept}</td><td>${l.action}</td><td>${l.target}</td><td>${l.detail}</td></tr>`
    ).join('');
    printWin.document.write(`<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>監査ログ</title>
<style>@import url('https://fonts.googleapis.com/css2?family=M+PLUS+1p:wght@400;700&display=swap');
body{font-family:'M PLUS 1p',sans-serif;padding:32px;color:#0f172a;font-size:11px}
h1{font-size:18px;margin-bottom:4px}
.meta{font-size:11px;color:#64748b;margin-bottom:20px}
table{width:100%;border-collapse:collapse}th{text-align:left;padding:6px 8px;background:#f1f5f9;border-bottom:2px solid #cbd5e1;font-size:10px;text-transform:uppercase}
td{padding:6px 8px;border-bottom:1px solid #e2e8f0}
@media print{body{padding:16px}}</style></head>
<body><h1>Construction DX One Platform — 監査ログレポート</h1>
<p class="meta">出力日時: ${new Date().toLocaleString('ja-JP')} / 件数: ${filtered.length}件</p>
<table><thead><tr><th>日時</th><th>ユーザー</th><th>部門</th><th>操作</th><th>対象</th><th>詳細</th></tr></thead>
<tbody>${rows}</tbody></table>
<script>window.onload=function(){window.print();}<\/script></body></html>`);
    printWin.document.close();
  };

  const columns = [
    { key: 'id', header: 'ID', accessor: r => r.id, width: '90px', sortable: true },
    { key: 'timestamp', header: '日時', accessor: r => r.timestamp, width: '140px', sortable: true },
    { key: 'user', header: 'ユーザー', accessor: r => r.user, sortable: true },
    { key: 'dept', header: '部門', accessor: r => r.dept, sortable: true },
    { key: 'action', header: '操作', width: '100px', render: r => {
      const colors = { 'データ更新': 'info', 'データ作成': 'safe', '権限変更': 'warning', 'システム設定': 'warning', '障害対応': 'danger', 'ファイル更新': 'info', '資産管理': 'neutral', 'レポート出力': 'neutral' };
      return React.createElement(StatusBadge, { type: colors[r.action] || 'neutral', label: r.action });
    }},
    { key: 'target', header: '対象', accessor: r => r.target, sortable: true },
    { key: 'detail', header: '詳細', accessor: r => r.detail },
    { key: 'ip', header: 'IP', accessor: r => r.ip, width: '90px' },
  ];

  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } },
      React.createElement(SectionHeader, { title: '監査ログ' }),
      React.createElement('div', { style: { display: 'flex', gap: 8 } },
        React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-sm', onClick: exportHTML },
          React.createElement(CDXIcon, { name: 'download', size: 14 }), 'HTML出力'
        ),
        React.createElement('button', { className: 'cdx-btn cdx-btn-secondary cdx-btn-sm', onClick: exportPDF },
          React.createElement(CDXIcon, { name: 'printer', size: 14 }), 'PDF出力'
        )
      )
    ),

    /* Filters */
    React.createElement('div', { className: 'cdx-card', style: { padding: 16, marginBottom: 16 } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } },
        React.createElement(CDXIcon, { name: 'filter', size: 14, color: 'var(--text-muted)' }),
        React.createElement('select', { className: 'cdx-input cdx-select', style: { width: 160 }, value: filterDept, onChange: e => setFilterDept(e.target.value) },
          React.createElement('option', { value: 'all' }, '全部門'),
          ...depts.map(d => React.createElement('option', { key: d, value: d }, d))
        ),
        React.createElement('select', { className: 'cdx-input cdx-select', style: { width: 140 }, value: filterAction, onChange: e => setFilterAction(e.target.value) },
          React.createElement('option', { value: 'all' }, '全操作'),
          ...actions.map(a => React.createElement('option', { key: a, value: a }, a))
        ),
        React.createElement('input', { className: 'cdx-input', type: 'date', style: { width: 150 }, value: dateFrom, onChange: e => setDateFrom(e.target.value) }),
        React.createElement('span', { style: { color: 'var(--text-muted)', fontSize: 12 } }, '〜'),
        React.createElement('input', { className: 'cdx-input', type: 'date', style: { width: 150 }, value: dateTo, onChange: e => setDateTo(e.target.value) }),
        (filterDept !== 'all' || filterAction !== 'all' || dateFrom || dateTo) &&
          React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', onClick: () => { setFilterDept('all'); setFilterAction('all'); setDateFrom(''); setDateTo(''); } }, 'リセット')
      )
    ),

    /* Stats */
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '総操作件数', value: filtered.length, unit: '件', icon: 'clipboard', color: 'var(--dept-11)' }),
      React.createElement(KPICard, { label: 'ユニークユーザー', value: [...new Set(filtered.map(l => l.user))].length, unit: '名', icon: 'user', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: '権限変更', value: filtered.filter(l => l.action === '権限変更').length, unit: '件', icon: 'lock', color: 'var(--cdx-accent)' }),
      React.createElement(KPICard, { label: 'セキュリティ操作', value: filtered.filter(l => l.action === 'システム設定' || l.action === '障害対応').length, unit: '件', icon: 'shield', color: 'var(--dept-10)' })
    ),

    /* Audit Table */
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, { columns, data: filtered, pageSize: 10 })
    ),

    /* Compliance Overview */
    React.createElement('div', { className: 'cdx-card', style: { marginTop: 20 } },
      React.createElement(SectionHeader, { title: 'コンプライアンス準拠状況' }),
      React.createElement('div', { className: 'cdx-grid cdx-grid-3' },
        [
          { name: 'アクセス制御', items: ['多要素認証', '条件付きアクセス', '特権ID管理', 'セッション制御'], score: 96 },
          { name: 'データ保護', items: ['暗号化（転送中）', '暗号化（保存時）', 'DLP設定', 'バックアップ'], score: 92 },
          { name: '監査証跡', items: ['操作ログ', 'アクセスログ', '変更履歴', '保存期間遵守'], score: 100 },
        ].map((c, i) => React.createElement('div', { key: i, style: { display: 'flex', flexDirection: 'column', gap: 10 } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
            React.createElement('span', { style: { fontSize: 13, fontWeight: 700 } }, c.name),
            React.createElement('span', { style: { fontSize: 18, fontWeight: 800, color: c.score === 100 ? 'var(--cdx-success)' : 'var(--cdx-secondary)', fontVariantNumeric: 'tabular-nums' } }, `${c.score}%`)
          ),
          React.createElement(CDXProgressBar, { value: c.score, showLabel: false, color: c.score === 100 ? 'var(--cdx-success)' : 'var(--cdx-secondary)' }),
          ...c.items.map((item, j) => React.createElement('div', { key: j, style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' } },
            React.createElement(CDXIcon, { name: 'check', size: 12, color: 'var(--cdx-success)' }), item
          ))
        ))
      )
    )
  );
}

window.PageAudit = PageAudit;
