/* Construction DX One Platform — Admin (管理本部) Page */

function PageAdmin() {
  const [tab, setTab] = React.useState('hr');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'hr', label: '人事・労務' }, { id: 'finance', label: '経理・財務' }, { id: 'workflow', label: 'ワークフロー' }, { id: 'qualifications', label: '資格管理' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'hr' && React.createElement(AdminHR, null),
      tab === 'finance' && React.createElement(AdminFinance, null),
      tab === 'workflow' && React.createElement(AdminWorkflow, null),
      tab === 'qualifications' && React.createElement(AdminQualifications, null)
    )
  );
}

function AdminHR() {
  const { ADMIN_HR } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '従業員数', value: ADMIN_HR.totalEmployees, unit: '名', icon: 'users', color: 'var(--dept-07)' }),
      React.createElement(KPICard, { label: '平均年齢', value: ADMIN_HR.avgAge, unit: '歳', icon: 'user', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: '平均勤続年数', value: ADMIN_HR.avgTenure, unit: '年', icon: 'chart', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '離職率', value: ADMIN_HR.turnoverRate, unit: '%', icon: 'trendDown', color: 'var(--cdx-accent)', invertDelta: true })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '部門別人員構成' }),
        React.createElement(CDXBarChart, {
          data: ADMIN_HR.byDept.map(d => ({ label: d.name.substring(0, 5), value: d.count })),
          width: 420, height: 240, xKey: 'label', yKeys: ['value'], barColor: 'var(--dept-07)'
        })
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '年齢分布' }),
        React.createElement(CDXBarChart, {
          data: [
            { label: '20代', value: 42 }, { label: '30代', value: 98 }, { label: '40代', value: 148 },
            { label: '50代', value: 132 }, { label: '60代', value: 67 },
          ],
          width: 420, height: 240, xKey: 'label', yKeys: ['value'], barColor: 'var(--cdx-secondary)'
        })
      )
    )
  );
}

function AdminFinance() {
  const { ADMIN_FINANCE } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '未処理請求書', value: ADMIN_FINANCE.invoicePending, unit: '件', icon: 'fileText', color: 'var(--cdx-accent)' }),
      React.createElement(KPICard, { label: '請求金額合計', value: ADMIN_FINANCE.invoiceAmount, unit: '億円', icon: 'dollarSign', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: '電子化率', value: ADMIN_FINANCE.electronicRate, unit: '%', icon: 'zap', color: 'var(--cdx-success)', spark: [72, 78, 82, 85, 87] }),
      React.createElement(KPICard, { label: 'インボイス対応', value: 94, unit: '%', icon: 'check', color: 'var(--cdx-success)' })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '月別経費推移（百万円）' }),
        React.createElement(CDXLineChart, {
          data: ADMIN_FINANCE.monthlyExpenses, width: 420, height: 220,
          xKey: 'month', yKeys: ['amount'], area: true
        })
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '電帳法・インボイス対応' }),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
          [
            { name: '電子帳簿保存法 対応', score: 95 },
            { name: 'インボイス制度 対応', score: 94 },
            { name: '請求書電子化', score: 87 },
            { name: '経費精算電子化', score: 82 },
            { name: '契約書電子化', score: 68 },
          ].map((item, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12 } },
            React.createElement('span', { style: { fontSize: 12, fontWeight: 500, width: 180 } }, item.name),
            React.createElement('div', { style: { flex: 1 } }, React.createElement(CDXProgressBar, { value: item.score, color: item.score >= 90 ? 'var(--cdx-success)' : item.score >= 75 ? 'var(--cdx-secondary)' : 'var(--cdx-accent)' }))
          ))
        )
      )
    )
  );
}

function AdminWorkflow() {
  const { ADMIN_FINANCE } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 } },
      React.createElement(SectionHeader, { title: 'ワークフロー / 稟議' }),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary' }, React.createElement(CDXIcon, { name: 'plus', size: 14 }), '新規申請')
    ),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '承認待ち', value: ADMIN_FINANCE.workflows.filter(w => w.status === 'pending').length, unit: '件', icon: 'clipboard', color: 'var(--cdx-accent)' }),
      React.createElement(KPICard, { label: '承認済（今月）', value: 28, unit: '件', icon: 'check', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '平均承認日数', value: 2.4, unit: '日', icon: 'zap', color: 'var(--cdx-secondary)' })
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'id', header: '申請番号', accessor: r => r.id, sortable: true },
          { key: 'title', header: '件名', accessor: r => r.title, sortable: true },
          { key: 'applicant', header: '申請者', accessor: r => r.applicant },
          { key: 'amount', header: '金額', accessor: r => r.amount, align: 'right' },
          { key: 'date', header: '申請日', accessor: r => r.date, sortable: true },
          { key: 'status', header: 'ステータス', render: r => React.createElement(StatusBadge, { type: r.status === 'approved' ? 'safe' : 'warning', label: r.status === 'approved' ? '承認済' : '承認待ち' }) },
        ],
        data: ADMIN_FINANCE.workflows, pageSize: 10
      })
    )
  );
}

function AdminQualifications() {
  const { ADMIN_HR } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '技能資格管理' }),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '資格保有者数', value: 428, unit: '名', icon: 'star', color: 'var(--dept-07)' }),
      React.createElement(KPICard, { label: '更新期限接近', value: ADMIN_HR.qualifications.reduce((s, q) => s + q.expiring, 0), unit: '名', icon: 'alertTriangle', color: 'var(--cdx-danger)' }),
      React.createElement(KPICard, { label: '今年度取得数', value: 34, unit: '件', icon: 'trendUp', color: 'var(--cdx-success)' })
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        ADMIN_HR.qualifications.map((q, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: i < ADMIN_HR.qualifications.length - 1 ? '1px solid var(--border-color)' : 'none' } },
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontSize: 14, fontWeight: 600 } }, q.name),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 } }, `保有者: ${q.count}名`)
          ),
          q.expiring > 0 && React.createElement('span', { className: 'cdx-badge cdx-badge-warning' }, `更新期限 ${q.expiring}名`),
          React.createElement('div', { style: { width: 120 } },
            React.createElement(CDXProgressBar, { value: q.count, max: 200, height: 6, showLabel: false, color: 'var(--dept-07)' })
          )
        ))
      )
    )
  );
}

window.PageAdmin = PageAdmin;
