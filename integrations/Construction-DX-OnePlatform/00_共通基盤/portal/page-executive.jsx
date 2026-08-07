/* Construction DX One Platform — Executive Dashboard */

function PageExecutive() {
  const { EXEC_REVENUE, EXEC_PROFIT_TREND, EXEC_COST_BREAKDOWN, EXEC_AI_PREDICTIONS } = window.CDX_DATA;
  const [tab, setTab] = React.useState('overview');

  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'overview', label: '経営概況' }, { id: 'finance', label: '財務分析' }, { id: 'ai', label: 'AI予測' }, { id: 'esg', label: 'ESG/SDGs' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'overview' && React.createElement(ExecOverview, null),
      tab === 'finance' && React.createElement(ExecFinance, null),
      tab === 'ai' && React.createElement(ExecAI, null),
      tab === 'esg' && React.createElement(ExecESG, null)
    )
  );
}

function ExecOverview() {
  const { EXEC_REVENUE, EXEC_PROFIT_TREND, EXEC_COST_BREAKDOWN } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '受注高（累計）', value: '128.4', unit: '億円', delta: 5.2, icon: 'chart', color: 'var(--cdx-secondary)', spark: [98, 105, 112, 120, 128.4] }),
      React.createElement(KPICard, { label: '完工高（累計）', value: '94.7', unit: '億円', delta: 3.8, icon: 'chart', color: 'var(--dept-04)', spark: [72, 78, 84, 90, 94.7] }),
      React.createElement(KPICard, { label: '工事利益率', value: '8.7', unit: '%', delta: 0.3, icon: 'chart', color: 'var(--cdx-success)', spark: [7.8, 8.1, 8.5, 8.2, 8.7] }),
      React.createElement(KPICard, { label: '手持工事高', value: '312.6', unit: '億円', delta: -2.1, icon: 'package', color: 'var(--dept-01)', spark: [325, 318, 315, 314, 312.6] })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '受注高推移（計画 vs 実績）' }),
        React.createElement(CDXBarChart, { data: EXEC_REVENUE, width: 460, height: 220, xKey: 'month', yKeys: ['plan', 'actual'], barColor: 'var(--border-hover)', secondaryColor: 'var(--cdx-secondary)' })
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '工事利益率推移' }),
        React.createElement(CDXLineChart, { data: EXEC_PROFIT_TREND, width: 460, height: 220, xKey: 'month', yKeys: ['rate'], area: true })
      )
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '原価構成比' }),
        React.createElement(CDXDonutChart, { data: EXEC_COST_BREAKDOWN, size: 140, thickness: 24 })
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '工事進捗サマリー' }),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } },
          React.createElement(CDXGauge, { value: 92.3, label: '工程遵守率', color: 'var(--cdx-success)' }),
          React.createElement(CDXGauge, { value: 68, label: '全体出来高', color: 'var(--cdx-secondary)' }),
          React.createElement(CDXGauge, { value: 94.1, label: '安全スコア', color: 'var(--dept-06)' }),
          React.createElement(CDXGauge, { value: 87.5, label: '品質スコア', color: 'var(--dept-05)' })
        )
      )
    )
  );
}

function ExecFinance() {
  const costData = [
    { month: '1月', material: 380, labor: 180, outsource: 250, machine: 80 },
    { month: '2月', material: 420, labor: 190, outsource: 280, machine: 85 },
    { month: '3月', material: 510, labor: 210, outsource: 320, machine: 95 },
    { month: '4月', material: 390, labor: 185, outsource: 260, machine: 82 },
    { month: '5月', material: 440, labor: 195, outsource: 290, machine: 88 },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '売上総利益', value: '11.2', unit: '億円', delta: 4.1, icon: 'chart', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '営業利益率', value: '6.2', unit: '%', delta: 0.5, icon: 'chart', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: '原価超過案件', value: '2', unit: '件', delta: -1, icon: 'alertTriangle', color: 'var(--cdx-danger)', invertDelta: true })
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: '原価内訳推移（百万円）' }),
      React.createElement(CDXBarChart, { data: costData, width: 800, height: 260, xKey: 'month', yKeys: ['material', 'labor', 'outsource', 'machine'] })
    )
  );
}

function ExecAI() {
  const { EXEC_AI_PREDICTIONS } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: 'AI予測分析' }),
    React.createElement('div', { className: 'cdx-grid cdx-grid-2', style: { marginBottom: 20 } },
      EXEC_AI_PREDICTIONS.map((p, i) => React.createElement('div', { key: i, className: 'cdx-card', style: { padding: 20 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } },
          React.createElement('span', { style: { fontSize: 14, fontWeight: 700 } }, p.title),
          React.createElement(StatusBadge, { type: p.severity })
        ),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 20 } },
          React.createElement(CDXGauge, { value: p.probability, label: '発生確率', size: 100,
            color: p.severity === 'danger' ? 'var(--cdx-danger)' : p.severity === 'warning' ? 'var(--cdx-accent)' : 'var(--cdx-success)' }),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('p', { style: { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 } }, p.detail),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' } },
              React.createElement(CDXIcon, { name: p.trend === 'up' ? 'trendUp' : p.trend === 'down' ? 'trendDown' : 'chart', size: 14 }),
              p.trend === 'up' ? '上昇傾向' : p.trend === 'down' ? '低下傾向' : '安定'
            )
          )
        )
      ))
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: 'AI推奨アクション' }),
      ...['横浜港湾工事の原価管理を強化（週次レビュー実施を推奨）', '7月の技能者不足に備え、協力会社への早期発注を推奨', '北海道トンネル工事の工程見直し検討（クリティカルパス分析）'].map((a, i) =>
        React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none' } },
          React.createElement('div', { style: { width: 24, height: 24, borderRadius: 6, background: 'var(--cdx-secondary)' + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
            React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: 'var(--cdx-secondary)' } }, i + 1)
          ),
          React.createElement('span', { style: { fontSize: 13 } }, a)
        )
      )
    )
  );
}

function ExecESG() {
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-3', style: { marginBottom: 20 } },
      [
        { label: 'E（環境）', score: 78, color: 'var(--cdx-success)', items: ['CO2排出量: 284 tCO2', '産廃リサイクル率: 92%', '再エネ利用率: 15%'] },
        { label: 'S（社会）', score: 85, color: 'var(--cdx-secondary)', items: ['労災度数率: 0.42', '女性管理職比率: 8.2%', '育休取得率: 72%'] },
        { label: 'G（ガバナンス）', score: 91, color: 'var(--dept-05)', items: ['内部監査適合率: 98%', 'コンプライアンス研修: 100%', '情報セキュリティ: A'] },
      ].map((esg, i) => React.createElement('div', { key: i, className: 'cdx-card', style: { textAlign: 'center' } },
        React.createElement('div', { style: { fontSize: 14, fontWeight: 700, marginBottom: 12 } }, esg.label),
        React.createElement(CDXGauge, { value: esg.score, label: 'スコア', size: 110, color: esg.color }),
        React.createElement('div', { style: { textAlign: 'left', marginTop: 16 } },
          esg.items.map((item, j) => React.createElement('div', { key: j, style: { fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0', borderBottom: j < 2 ? '1px solid var(--border-color)' : 'none' } }, item))
        )
      ))
    )
  );
}

window.PageExecutive = PageExecutive;
