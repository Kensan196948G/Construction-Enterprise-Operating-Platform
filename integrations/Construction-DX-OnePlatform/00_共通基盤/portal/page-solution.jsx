/* Construction DX One Platform — Solution Sales Page */

function PageSolution() {
  const { SOLUTION_PROJECTS } = window.CDX_DATA;
  const [tab, setTab] = React.useState('projects');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'projects', label: 'プロジェクト' }, { id: 'categories', label: 'ソリューション分類' }, { id: 'pipeline', label: '提案パイプライン' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'projects' && React.createElement(SolProjects, null),
      tab === 'categories' && React.createElement(SolCategories, null),
      tab === 'pipeline' && React.createElement(SolPipeline, null)
    )
  );
}

function SolProjects() {
  const { SOLUTION_PROJECTS } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '進行中案件', value: SOLUTION_PROJECTS.filter(p => p.status === 'active').length, unit: '件', icon: 'globe', color: 'var(--dept-03)' }),
      React.createElement(KPICard, { label: '提案中', value: SOLUTION_PROJECTS.filter(p => p.status === 'proposal').length, unit: '件', icon: 'fileText', color: 'var(--cdx-accent)' }),
      React.createElement(KPICard, { label: '総予算規模', value: '2.97', unit: '億円', icon: 'dollarSign', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: 'ソリューション種別', value: 5, unit: '分野', icon: 'layers', color: 'var(--dept-05)' })
    ),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3' },
      SOLUTION_PROJECTS.map((p, i) => {
        const catColors = { IoT: '#10b981', 'BIM/CIM': '#8b5cf6', AI: '#3b82f6', Drone: '#f59e0b', 'Digital Twin': '#0891b2' };
        return React.createElement('div', { key: i, className: 'cdx-card', style: { borderTop: `3px solid ${catColors[p.category] || 'var(--border-color)'}` } },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
            React.createElement('span', { className: 'cdx-badge', style: { background: (catColors[p.category] || '#888') + '18', color: catColors[p.category] } }, p.category),
            React.createElement(StatusBadge, { type: p.status === 'active' ? 'safe' : p.status === 'proposal' ? 'warning' : 'neutral', label: p.status === 'active' ? '進行中' : p.status === 'proposal' ? '提案中' : '企画中' })
          ),
          React.createElement('div', { style: { fontSize: 14, fontWeight: 700, marginBottom: 4 } }, p.name),
          React.createElement('div', { style: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 } }, p.client),
          React.createElement(CDXProgressBar, { value: p.progress, color: catColors[p.category] }),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' } },
            React.createElement('span', null, `¥${(p.budget / 100).toFixed(1)}億`),
            React.createElement('span', null, p.id)
          )
        );
      })
    )
  );
}

function SolCategories() {
  const categories = [
    { name: 'BIM/CIM', desc: '3Dモデリング・設計統合', projects: 4, revenue: 1.2, icon: 'layers', color: '#8b5cf6', features: ['IFC 4.0対応', 'CDE連携', 'VR/AR現場可視化', '自動数量算出'] },
    { name: 'IoT/センサー', desc: '現場IoT・環境モニタリング', projects: 6, revenue: 0.8, icon: 'activity', color: '#10b981', features: ['河川水位監視', '構造物ヘルスモニタリング', '環境センサー', 'エッジコンピューティング'] },
    { name: 'AI解析', desc: 'AIによる自動解析・予測', projects: 3, revenue: 0.6, icon: 'brain', color: '#3b82f6', features: ['地盤解析AI', '画像解析（ひび割れ検知）', '工程最適化', '安全予測'] },
    { name: 'ドローン測量', desc: '3D測量・点群処理', projects: 5, revenue: 0.9, icon: 'globe', color: '#f59e0b', features: ['写真測量', 'LiDAR測量', '差分解析', '出来形管理'] },
    { name: 'デジタルツイン', desc: 'インフラデジタルツイン', projects: 2, revenue: 1.8, icon: 'database', color: '#0891b2', features: ['港湾デジタルツイン', 'リアルタイム可視化', 'シミュレーション', '維持管理DX'] },
    { name: '防災DX', desc: '防災・災害対策DX', projects: 2, revenue: 0.5, icon: 'shield', color: '#dc2626', features: ['災害シミュレーション', '避難経路最適化', '被害予測AI', '早期警戒システム'] },
  ];
  return React.createElement('div', { className: 'cdx-grid cdx-grid-3' },
    categories.map((c, i) => React.createElement('div', { key: i, className: 'cdx-card' },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } },
        React.createElement('div', { style: { width: 36, height: 36, borderRadius: 8, background: c.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          React.createElement(CDXIcon, { name: c.icon, size: 18, color: c.color })
        ),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 14, fontWeight: 700 } }, c.name),
          React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, c.desc)
        )
      ),
      React.createElement('div', { style: { display: 'flex', gap: 16, marginBottom: 12 } },
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 20, fontWeight: 800, color: c.color } }, c.projects),
          React.createElement('div', { style: { fontSize: 10, color: 'var(--text-muted)' } }, '案件')
        ),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 20, fontWeight: 800 } }, `${c.revenue}億`),
          React.createElement('div', { style: { fontSize: 10, color: 'var(--text-muted)' } }, '売上')
        )
      ),
      React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 4 } },
        c.features.map((f, j) => React.createElement('span', { key: j, style: { fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-badge)', color: 'var(--text-secondary)' } }, f))
      )
    ))
  );
}

function SolPipeline() {
  const pipeData = [
    { stage: '調査・ヒアリング', count: 8, value: 4.2 },
    { stage: '企画提案', count: 5, value: 3.1 },
    { stage: 'PoC/実証', count: 3, value: 2.4 },
    { stage: '本格導入', count: 2, value: 1.8 },
    { stage: '運用・保守', count: 4, value: 3.6 },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement(SectionHeader, { title: 'ソリューション提案ファネル' }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        pipeData.map((s, i) => {
          const maxW = 100 - i * 12;
          return React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12 } },
            React.createElement('span', { style: { fontSize: 12, fontWeight: 500, width: 140, textAlign: 'right' } }, s.stage),
            React.createElement('div', { style: { flex: 1, position: 'relative' } },
              React.createElement('div', { style: { width: `${maxW}%`, height: 36, borderRadius: 6, background: `var(--dept-03)`, opacity: 0.15 + i * 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' } },
                React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' } }, `${s.count}件 / ${s.value}億円`)
              )
            )
          );
        })
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: 'i-Construction 2.0 対応状況' }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        [
          { name: 'ICT土工', score: 92 }, { name: 'BIM/CIM活用', score: 78 },
          { name: '3D測量', score: 88 }, { name: '遠隔臨場', score: 72 },
          { name: 'デジタルデータ納品', score: 85 },
        ].map((ic, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12 } },
          React.createElement('span', { style: { fontSize: 13, fontWeight: 500, width: 180 } }, ic.name),
          React.createElement('div', { style: { flex: 1 } }, React.createElement(CDXProgressBar, { value: ic.score, color: ic.score >= 85 ? 'var(--cdx-success)' : ic.score >= 70 ? 'var(--cdx-secondary)' : 'var(--cdx-accent)' }))
        ))
      )
    )
  );
}

window.PageSolution = PageSolution;
