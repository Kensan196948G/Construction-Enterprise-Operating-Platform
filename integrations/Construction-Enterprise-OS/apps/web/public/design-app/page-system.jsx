/* ========================================
   Construction Enterprise OS — システム管理 Page
   Server monitoring, DB, backups, DevOps
   ======================================== */

function SystemPage({ subPath }) {
  const tabFromPath = { '/system/server': 'server', '/system/db': 'db', '/system/backup': 'backup', '/system/api-status': 'api', '/system/devops': 'devops' };
  const [activeTab, setActiveTab] = React.useState(tabFromPath[subPath] || 'server');
  React.useEffect(() => { if (tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]); }, [subPath]);
  const cs = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' };

  const tabStyle = (active) => ({
    padding: '8px 16px', fontSize: 12, fontWeight: active ? 600 : 400,
    color: active ? '#1a56db' : '#64748b', cursor: 'pointer',
    borderBottom: active ? '2px solid #1a56db' : '2px solid transparent',
    background: 'none', border: 'none', borderBottomStyle: 'solid', fontFamily: 'inherit',
  });

  const servers = [
    { name: 'k8s-master-01', type: 'K8s Master', cpu: 32, mem: 48, disk: 35, status: 'running', uptime: '45d 12h' },
    { name: 'k8s-worker-01', type: 'K8s Worker', cpu: 68, mem: 72, disk: 55, status: 'running', uptime: '45d 12h' },
    { name: 'k8s-worker-02', type: 'K8s Worker', cpu: 55, mem: 61, disk: 42, status: 'running', uptime: '45d 12h' },
    { name: 'k8s-worker-03', type: 'K8s Worker', cpu: 78, mem: 85, disk: 68, status: 'warning', uptime: '30d 8h' },
    { name: 'db-primary', type: 'PostgreSQL', cpu: 45, mem: 62, disk: 71, status: 'running', uptime: '90d 3h' },
    { name: 'db-replica', type: 'PostgreSQL', cpu: 22, mem: 38, disk: 71, status: 'running', uptime: '90d 3h' },
    { name: 'redis-01', type: 'Redis', cpu: 12, mem: 28, disk: 15, status: 'running', uptime: '60d 1h' },
    { name: 'kafka-01', type: 'Kafka', cpu: 35, mem: 55, disk: 62, status: 'running', uptime: '45d 12h' },
    { name: 'es-01', type: 'Elasticsearch', cpu: 48, mem: 78, disk: 58, status: 'running', uptime: '45d 12h' },
    { name: 'minio-01', type: 'MinIO', cpu: 18, mem: 25, disk: 82, status: 'warning', uptime: '60d 1h' },
  ];

  const databases = [
    { name: 'ceos_auth', size: '2.4GB', tables: 18, connections: 42, status: 'healthy', replication: 'sync' },
    { name: 'ceos_documents', size: '48.2GB', tables: 24, connections: 28, status: 'healthy', replication: 'sync' },
    { name: 'ceos_iot', size: '125.8GB', tables: 12, connections: 86, status: 'healthy', replication: 'async' },
    { name: 'ceos_gis', size: '18.6GB', tables: 15, connections: 14, status: 'healthy', replication: 'sync' },
    { name: 'ceos_erp', size: '8.4GB', tables: 32, connections: 22, status: 'healthy', replication: 'sync' },
    { name: 'ceos_workflow', size: '3.1GB', tables: 14, connections: 18, status: 'degraded', replication: 'sync' },
  ];

  const backups = [
    { target: 'PostgreSQL 全DB', lastRun: '2026/05/24 03:00', size: '206GB', duration: '45m', status: '成功', next: '2026/05/25 03:00' },
    { target: 'MinIO (文書ストレージ)', lastRun: '2026/05/24 02:00', size: '1.2TB', duration: '2h 15m', status: '成功', next: '2026/05/25 02:00' },
    { target: 'Elasticsearch インデックス', lastRun: '2026/05/24 04:00', size: '85GB', duration: '30m', status: '成功', next: '2026/05/25 04:00' },
    { target: 'Redis スナップショット', lastRun: '2026/05/24 00:00', size: '4.2GB', duration: '2m', status: '成功', next: '毎時' },
    { target: 'K8s etcd', lastRun: '2026/05/24 01:00', size: '120MB', duration: '15s', status: '成功', next: '2026/05/25 01:00' },
  ];

  const pipelines = [
    { name: 'auth-service', branch: 'main', commit: 'fix: MFA timeout', status: 'success', duration: '3m 42s', time: '09:15' },
    { name: 'gateway', branch: 'main', commit: 'feat: rate limit update', status: 'success', duration: '4m 18s', time: '08:30' },
    { name: 'document-service', branch: 'develop', commit: 'test: OCR unit tests', status: 'running', duration: '2m 10s', time: '09:22' },
    { name: 'iot-service', branch: 'main', commit: 'perf: sensor batch query', status: 'success', duration: '5m 05s', time: '07:45' },
    { name: 'web-frontend', branch: 'feature/sidebar', commit: 'UI: role filter update', status: 'failed', duration: '1m 55s', time: '08:50' },
  ];

  const usageColor = (v) => v > 80 ? '#dc2626' : v > 60 ? '#f97316' : '#16a34a';
  const statusColor = { running: '#16a34a', warning: '#f97316', down: '#dc2626', healthy: '#16a34a', degraded: '#f97316' };
  const pipeColor = { success: '#16a34a', running: '#1a56db', failed: '#dc2626' };
  const pipeIcon = { success: 'check-circle', running: 'refresh', failed: 'x' };

  const UsageBar = ({ label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
      <span style={{ fontSize: 9, color: '#94a3b8', width: 26 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: usageColor(value), borderRadius: 3 }}></div>
      </div>
      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: usageColor(value), fontWeight: 600, width: 28, textAlign: 'right' }}>{value}%</span>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>システム管理</h1>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>サーバ監視・DB管理・バックアップ・DevOps/CI-CD</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'サーバ稼働', value: '10/10', icon: 'activity', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'DB接続', value: '210', icon: 'zap', color: '#1a56db', bg: '#eff6ff' },
          { label: 'バックアップ', value: '正常', icon: 'check-circle', color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'CI/CDパイプライン', value: '4/5', icon: 'git-branch', color: '#f97316', bg: '#fff7ed' },
          { label: 'テスト', value: '451 PASS', icon: 'shield', color: '#16a34a', bg: '#f0fdf4' },
        ].map((s, i) => (
          <div key={i} style={{ ...cs, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={16} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={cs}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 16px' }}>
          {[
            { id: 'server', label: 'サーバ監視' },
            { id: 'db', label: 'DB管理' },
            { id: 'backup', label: 'バックアップ' },
            { id: 'api', label: 'API状態' },
            { id: 'devops', label: 'DevOps/CI-CD' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {activeTab === 'server' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>インフラ一覧</div>
              <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 100px 140px 140px 140px 50px 80px', gap: 8, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                  <span>ホスト名</span><span>種別</span><span>CPU</span><span>メモリ</span><span>ディスク</span><span>状態</span><span>稼働時間</span>
                </div>
                {servers.map((s, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 100px 140px 140px 140px 50px 80px', gap: 8, padding: '10px 14px', alignItems: 'center', borderBottom: i < servers.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 12 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 500, color: '#0f172a' }}>{s.name}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', color: '#475569', fontWeight: 500 }}>{s.type}</span>
                    <UsageBar label="CPU" value={s.cpu} />
                    <UsageBar label="MEM" value={s.mem} />
                    <UsageBar label="DSK" value={s.disk} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[s.status] }}></span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{s.uptime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'db' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>データベース一覧</div>
              <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 80px 70px 80px 70px 80px', gap: 12, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                  <span>データベース</span><span>サイズ</span><span>テーブル</span><span>コネクション</span><span>状態</span><span>レプリケーション</span>
                </div>
                {databases.map((d, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 80px 70px 80px 70px 80px', gap: 12, padding: '12px 14px', alignItems: 'center', borderBottom: i < databases.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 12 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 500, color: '#0f172a' }}>{d.name}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#374151' }}>{d.size}</span>
                    <span style={{ color: '#64748b' }}>{d.tables}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#374151' }}>{d.connections}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[d.status] }}></span>
                      <span style={{ fontSize: 10, color: statusColor[d.status], fontWeight: 500 }}>{d.status}</span>
                    </span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{d.replication}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>バックアップスケジュール</div>
              <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 130px 80px 80px 60px 130px', gap: 12, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                  <span>対象</span><span>最終実行</span><span>サイズ</span><span>所要時間</span><span>結果</span><span>次回</span>
                </div>
                {backups.map((b, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 130px 80px 80px 60px 130px', gap: 12, padding: '12px 14px', alignItems: 'center', borderBottom: i < backups.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 12 }}>
                    <span style={{ fontWeight: 500, color: '#0f172a' }}>{b.target}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#64748b' }}>{b.lastRun}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#374151' }}>{b.size}</span>
                    <span style={{ color: '#64748b' }}>{b.duration}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a' }}>{b.status}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{b.next}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>API ヘルスチェック</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
                {[
                  { label: 'API Gateway', status: 'healthy', uptime: '99.98%', latency: '12ms' },
                  { label: 'Auth Service', status: 'healthy', uptime: '99.99%', latency: '45ms' },
                  { label: 'Workflow Service', status: 'degraded', uptime: '98.5%', latency: '580ms' },
                ].map((s,i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', background: s.status==='healthy'?'#f0fdf4':'#fff7ed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.label}</span>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.status==='healthy'?'#16a34a':'#f97316' }}></span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><div style={{ fontSize: 9, color: '#94a3b8' }}>稼働率</div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.uptime}</div></div>
                      <div><div style={{ fontSize: 9, color: '#94a3b8' }}>平均遅延</div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.latency}</div></div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 60px 80px 80px 80px 80px 60px', gap: 8, padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                  <span>エンドポイント</span><span>メソッド</span><span>レスポンス</span><span>成功率</span><span>RPS</span><span>P99</span><span>状態</span>
                </div>
                {[
                  { ep: '/api/v1/auth/login', method: 'POST', avg: '45ms', success: '99.98%', rps: '42', p99: '120ms', ok: true },
                  { ep: '/api/v1/auth/token', method: 'POST', avg: '12ms', success: '99.99%', rps: '156', p99: '35ms', ok: true },
                  { ep: '/api/v1/documents', method: 'GET', avg: '120ms', success: '99.95%', rps: '28', p99: '350ms', ok: true },
                  { ep: '/api/v1/iot/sensors', method: 'GET', avg: '32ms', success: '99.99%', rps: '245', p99: '85ms', ok: true },
                  { ep: '/api/v1/workflow', method: 'POST', avg: '580ms', success: '98.8%', rps: '12', p99: '2.1s', ok: false },
                  { ep: '/api/v1/gis/locations', method: 'GET', avg: '95ms', success: '99.97%', rps: '18', p99: '210ms', ok: true },
                  { ep: '/api/v1/ai/chat', method: 'POST', avg: '1.2s', success: '99.9%', rps: '8', p99: '3.5s', ok: true },
                  { ep: '/api/v1/erp/costs', method: 'GET', avg: '210ms', success: '99.96%', rps: '6', p99: '450ms', ok: true },
                  { ep: '/api/v1/bim/models', method: 'GET', avg: '350ms', success: '99.9%', rps: '4', p99: '1.2s', ok: true },
                  { ep: '/api/v1/notification', method: 'POST', avg: '25ms', success: '99.99%', rps: '85', p99: '65ms', ok: true },
                ].map((a,i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 60px 80px 80px 80px 80px 60px', gap: 8, padding: '10px 14px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', fontSize: 11 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 500, color: '#0f172a' }}>{a.ep}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 4px', borderRadius: 3, background: a.method==='GET'?'#dbeafe':'#dcfce7', color: a.method==='GET'?'#1e40af':'#166534' }}>{a.method}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#374151' }}>{a.avg}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: a.ok?'#16a34a':'#dc2626', fontWeight: 500 }}>{a.success}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#64748b' }}>{a.rps}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#64748b' }}>{a.p99}</span>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.ok?'#16a34a':'#f97316' }}></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'devops' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>CI/CD パイプライン (GitHub Actions)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pipelines.map((p, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon name={pipeIcon[p.status]} size={18} style={{ color: pipeColor[p.status], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f1f5f9', color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>{p.branch}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{p.commit}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: pipeColor[p.status] }}>{p.status === 'running' ? '実行中...' : p.status}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{p.duration} · {p.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Test summary */}
              <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="check-circle" size={18} style={{ color: '#16a34a' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>451 tests ALL PASS</span>
                  <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 'auto' }}>22サービス · 7パッケージ · 582ファイル</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.SystemPage = SystemPage;
