/* Construction DX One Platform — DataLake & Digital Twin Page */

function PageDataLake() {
  const { DATALAKE } = window.CDX_DATA;
  const [tab, setTab] = React.useState('overview');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'overview', label: '概要' }, { id: 'sources', label: 'データソース' }, { id: 'pipelines', label: 'ETLパイプライン' }, { id: 'ai', label: 'AI/MLモデル' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'overview' && React.createElement(DLOverview, null),
      tab === 'sources' && React.createElement(DLSources, null),
      tab === 'pipelines' && React.createElement(DLPipelines, null),
      tab === 'ai' && React.createElement(DLAIModels, null)
    )
  );
}

function DLOverview() {
  const { DATALAKE } = window.CDX_DATA;
  const usedPct = Math.round((DATALAKE.storage.used / DATALAKE.storage.total) * 100);
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: 'ストレージ使用量', value: DATALAKE.storage.used, unit: DATALAKE.storage.unit, icon: 'database', color: 'var(--dept-11)', spark: [5.2, 6.1, 7.0, 7.8, 8.7] }),
      React.createElement(KPICard, { label: 'データソース', value: DATALAKE.sources.length, unit: '接続', icon: 'link', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: 'ETLパイプライン', value: DATALAKE.pipelines.length, unit: '本', icon: 'activity', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: 'AIモデル稼働中', value: DATALAKE.aiModels.filter(m => m.status === 'deployed').length, unit: 'モデル', icon: 'brain', color: 'var(--dept-05)' })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 } },
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: 'ストレージ使用率' }),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 24 } },
          React.createElement(CDXGauge, { value: usedPct, label: `${DATALAKE.storage.used}/${DATALAKE.storage.total} TB`, size: 120, color: usedPct > 80 ? 'var(--cdx-danger)' : 'var(--cdx-secondary)' }),
          React.createElement('div', { style: { flex: 1 } },
            ...['施工データ: 2.8 TB', 'IoT/センサー: 2.4 TB', 'BIM/CIMモデル: 1.8 TB', '写真・文書: 1.2 TB', 'その他: 0.5 TB'].map((item, i) =>
              React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 } },
                React.createElement('div', { style: { width: 8, height: 8, borderRadius: 2, background: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#94a3b8'][i] } }),
                React.createElement('span', { style: { color: 'var(--text-secondary)' } }, item)
              )
            )
          )
        )
      ),
      React.createElement('div', { className: 'cdx-card' },
        React.createElement(SectionHeader, { title: '日別データ取込量（TB）' }),
        React.createElement(CDXBarChart, { data: DATALAKE.ingestionTrend, width: 400, height: 200, xKey: 'label', yKeys: ['volume'], barColor: 'var(--dept-11)' })
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: 'データフロー' }),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '20px 0', flexWrap: 'wrap' } },
        ['現場/IoT', 'API Gateway', 'ETL処理', 'Data Lake', 'AI/ML', '経営分析'].map((step, i) =>
          React.createElement(React.Fragment, { key: i },
            React.createElement('div', { style: { padding: '12px 20px', borderRadius: 8, background: i === 3 ? 'var(--dept-11)' : 'var(--bg-badge)', color: i === 3 ? '#fff' : 'var(--text-primary)', fontSize: 12, fontWeight: 600, textAlign: 'center', minWidth: 90 } }, step),
            i < 5 && React.createElement('div', { style: { width: 32, height: 2, background: 'var(--border-color)', position: 'relative' } },
              React.createElement('div', { style: { position: 'absolute', right: -4, top: -4, width: 0, height: 0, borderLeft: '6px solid var(--border-color)', borderTop: '5px solid transparent', borderBottom: '5px solid transparent' } })
            )
          )
        )
      )
    )
  );
}

function DLSources() {
  const { DATALAKE } = window.CDX_DATA;
  const columns = [
    { key: 'name', header: 'データソース', accessor: r => r.name, sortable: true },
    { key: 'records', header: 'レコード数', accessor: r => r.records, align: 'right' },
    { key: 'lastSync', header: '最終同期', accessor: r => r.lastSync },
    { key: 'status', header: 'ステータス', render: r => {
      const labels = { synced: '同期済', streaming: 'ストリーミング', scheduled: '定期', error: 'エラー' };
      const types = { synced: 'safe', streaming: 'info', scheduled: 'neutral', error: 'danger' };
      return React.createElement(StatusBadge, { type: types[r.status], label: labels[r.status] });
    }},
  ];
  return React.createElement('div', { className: 'cdx-card' },
    React.createElement(DataTableCDX, { columns, data: DATALAKE.sources, pageSize: 10 })
  );
}

function DLPipelines() {
  const { DATALAKE } = window.CDX_DATA;
  const columns = [
    { key: 'name', header: 'パイプライン', accessor: r => r.name, sortable: true },
    { key: 'schedule', header: 'スケジュール', accessor: r => r.schedule },
    { key: 'lastRun', header: '最終実行', accessor: r => r.lastRun, sortable: true },
    { key: 'duration', header: '実行時間', accessor: r => r.duration },
    { key: 'status', header: 'ステータス', render: r => {
      const types = { success: 'safe', running: 'info', failed: 'danger', pending: 'warning' };
      const labels = { success: '成功', running: '実行中', failed: '失敗', pending: '待機' };
      return React.createElement(StatusBadge, { type: types[r.status], label: labels[r.status] });
    }},
  ];
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement(SectionHeader, { title: 'パイプライン状況' }),
      React.createElement(DataTableCDX, { columns, data: DATALAKE.pipelines, pageSize: 10 })
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: 'ETL アーキテクチャ' }),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 } },
        [
          { name: 'Apache Airflow', desc: 'ワークフローオーケストレーション', status: '稼働中', version: '2.8' },
          { name: 'dbt', desc: 'データ変換', status: '稼働中', version: '1.7' },
          { name: 'TimescaleDB', desc: '時系列データ', status: '稼働中', version: '2.14' },
        ].map((t, i) => React.createElement('div', { key: i, style: { padding: 16, borderRadius: 8, background: 'var(--bg-body)' } },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 700, marginBottom: 4 } }, t.name),
          React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 } }, t.desc),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 11 } },
            React.createElement(StatusBadge, { type: 'safe', label: t.status }),
            React.createElement('span', { style: { color: 'var(--text-muted)' } }, `v${t.version}`)
          )
        ))
      )
    )
  );
}

function DLAIModels() {
  const { DATALAKE } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: 'AI/ML モデル一覧' }),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3' },
      DATALAKE.aiModels.map((m, i) => React.createElement('div', { key: i, className: 'cdx-card' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
          React.createElement('span', { style: { fontSize: 14, fontWeight: 700 } }, m.name),
          React.createElement(StatusBadge, { type: m.status === 'deployed' ? 'safe' : m.status === 'training' ? 'warning' : 'info', label: m.status === 'deployed' ? 'デプロイ済' : m.status === 'training' ? '学習中' : '評価中' })
        ),
        React.createElement('div', { style: { textAlign: 'center', margin: '16px 0' } },
          React.createElement(CDXGauge, { value: m.accuracy, label: '精度', size: 100, color: m.accuracy > 85 ? 'var(--cdx-success)' : m.accuracy > 75 ? 'var(--cdx-secondary)' : 'var(--cdx-accent)' })
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, `最終学習: ${m.lastTrain}`)
      ))
    )
  );
}

window.PageDataLake = PageDataLake;
