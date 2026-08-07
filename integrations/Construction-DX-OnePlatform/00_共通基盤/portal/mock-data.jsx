/* Construction DX One Platform v2 — Full Mock Data */

const DEPARTMENTS = [
  { id: 'portal', num: '00', phase: 1, name: '全社ポータル', system: 'Construction DX One Platform', icon: 'home', color: 'var(--cdx-primary)' },
  { id: 'datalake', num: '11', phase: 3, name: '統合データ基盤', system: 'Construction DataLake & Digital Twin', icon: 'database', color: 'var(--dept-11)' },
  { id: 'common', num: '00', phase: 1, name: '共通基盤', system: 'Shared Auth / DB / UI / Gateway', icon: 'layers', color: 'var(--dept-00)' },
  { id: 'executive', num: '01', phase: 3, name: '経営企画', system: 'Construction Executive Dashboard', icon: 'chart', color: 'var(--dept-01)' },
  { id: 'sales', num: '02', phase: 2, name: '営業本部', system: 'Construction CRM & Bid Management', icon: 'handshake', color: 'var(--dept-02)' },
  { id: 'solution', num: '03', phase: 3, name: 'ソリューション営業', system: 'Smart Infrastructure Solution Platform', icon: 'globe', color: 'var(--dept-03)' },
  { id: 'construction', num: '04', phase: 1, name: '施工本部', system: 'Construction Site Management', icon: 'crane', color: 'var(--dept-04)' },
  { id: 'technical', num: '05', phase: 2, name: '技術本部', system: 'Technical Knowledge & BIM Platform', icon: 'brain', color: 'var(--dept-05)' },
  { id: 'safety', num: '06', phase: 1, name: '安全品質環境本部', system: 'Safety Quality Governance Platform', icon: 'shield', color: 'var(--dept-06)' },
  { id: 'admin', num: '07', phase: 2, name: '管理本部', system: 'Corporate Operation Platform', icon: 'building', color: 'var(--dept-07)' },
  { id: 'procurement', num: '08', phase: 2, name: '購買部', system: 'Procurement Material Platform', icon: 'package', color: 'var(--dept-08)' },
  { id: 'marine', num: '09', phase: 3, name: '船舶', system: 'Marine Fleet Management', icon: 'ship', color: 'var(--dept-09)' },
  { id: 'itsm', num: '10', phase: 1, name: 'IT-DX部門', system: 'ITSM & Zero Trust Platform', icon: 'lock', color: 'var(--dept-10)' },
  { id: 'audit', num: '12', phase: 1, name: '監査', system: 'Audit & Compliance', icon: 'clipboard', color: 'var(--dept-11)' },
  { id: 'settings', num: '99', phase: 1, name: 'システム設定', system: 'System Configuration', icon: 'settings', color: 'var(--text-muted)' },
];

/* ── Portal Overview ── */
const PORTAL_KPIS = [
  { label: '受注高', value: '128.4', unit: '億円', delta: 5.2, caption: '前月比' },
  { label: '工事利益率', value: '8.7', unit: '%', delta: 0.3, caption: '計画差' },
  { label: '安全報告', value: '347', unit: '件', delta: 12.4, caption: '今月登録' },
  { label: 'サービス稼働率', value: '99.7', unit: '%', delta: 0.1, caption: '24時間' },
];

const PHASE_PROGRESS = [
  { phase: 1, label: '重点3部門と共通基盤', progress: 86, color: 'var(--cdx-primary)', items: ['施工', '安全品質', 'ITSM', '共通基盤'] },
  { phase: 2, label: '業務横断と間接部門', progress: 58, color: 'var(--cdx-secondary)', items: ['営業', '技術', '管理', '購買'] },
  { phase: 3, label: '経営・船舶・データ活用', progress: 42, color: 'var(--cdx-success)', items: ['経営', 'ソリューション', '船舶', 'データ基盤'] },
];

const DEPT_KPIS = [
  { dept: 'datalake', metric: '取込データ', value: '8.7 TB', trend: [5.2, 6.1, 7.0, 7.8, 8.7] },
  { dept: 'common', metric: 'API応答', value: '12 ms', trend: [18, 15, 14, 13, 12] },
  { dept: 'executive', metric: '利益率', value: '8.7%', trend: [7.8, 8.1, 8.5, 8.2, 8.7] },
  { dept: 'sales', metric: '案件総額', value: '15.5 億', trend: [8.1, 10.4, 12.3, 13.8, 15.5] },
  { dept: 'solution', metric: 'PoC進捗', value: '60%', trend: [22, 35, 46, 53, 60] },
  { dept: 'construction', metric: '平均出来高', value: '62%', trend: [35, 44, 52, 58, 62] },
  { dept: 'technical', metric: 'ナレッジ閲覧', value: '1,382', trend: [920, 1040, 1180, 1260, 1382] },
  { dept: 'safety', metric: '安全スコア', value: '94.1', trend: [90, 91, 93, 92, 94.1] },
  { dept: 'admin', metric: '電子承認率', value: '87%', trend: [70, 75, 81, 84, 87] },
  { dept: 'procurement', metric: '納期遵守', value: '96%', trend: [92, 94, 95, 95, 96] },
  { dept: 'marine', metric: '稼働率', value: '78%', trend: [62, 68, 72, 76, 78] },
  { dept: 'itsm', metric: 'SLA遵守', value: '98.2%', trend: [96, 97, 97.5, 98, 98.2] },
];

/* ── DataLake ── */
const DATALAKE = {
  storage: { total: 12.4, used: 8.7, unit: 'TB' },
  sources: [
    { name: '施工管理DB', records: '2.4M', lastSync: '2分前', status: 'synced' },
    { name: '安全品質DB', records: '890K', lastSync: '5分前', status: 'synced' },
    { name: '営業CRM', records: '156K', lastSync: '12分前', status: 'synced' },
    { name: 'IoTセンサー', records: '48M', lastSync: 'リアルタイム', status: 'streaming' },
    { name: 'BIM/CIMモデル', records: '3,240', lastSync: '1時間前', status: 'synced' },
    { name: 'GPS/AIS船舶', records: '12M', lastSync: 'リアルタイム', status: 'streaming' },
    { name: '写真・文書', records: '1.2M', lastSync: '30分前', status: 'synced' },
    { name: '経理・人事', records: '420K', lastSync: '6時間前', status: 'scheduled' },
  ],
  pipelines: [
    { name: '日次集計 ETL', schedule: '毎日 02:00', lastRun: '2026-05-23 02:00', duration: '18分', status: 'success' },
    { name: 'IoTストリーム処理', schedule: '常時', lastRun: '稼働中', duration: '—', status: 'running' },
    { name: 'AI学習データ生成', schedule: '毎週月曜', lastRun: '2026-05-19', duration: '2h14m', status: 'success' },
    { name: 'BIMメタデータ抽出', schedule: 'トリガー', lastRun: '2026-05-22 15:30', duration: '42分', status: 'success' },
    { name: 'レポート生成', schedule: '毎日 06:00', lastRun: '2026-05-23 06:00', duration: '8分', status: 'success' },
  ],
  aiModels: [
    { name: '工期遅延予測', accuracy: 87.2, lastTrain: '2026-05-19', status: 'deployed' },
    { name: '原価超過予測', accuracy: 82.5, lastTrain: '2026-05-19', status: 'deployed' },
    { name: '安全リスク分類', accuracy: 91.8, lastTrain: '2026-05-12', status: 'deployed' },
    { name: '資材価格予測', accuracy: 78.4, lastTrain: '2026-05-05', status: 'training' },
    { name: '入札スコア予測', accuracy: 74.1, lastTrain: '2026-04-28', status: 'evaluation' },
  ],
  ingestionTrend: [
    { label: '月', volume: 1.2 }, { label: '火', volume: 1.4 }, { label: '水', volume: 1.8 },
    { label: '木', volume: 1.3 }, { label: '金', volume: 1.1 }, { label: '土', volume: 0.4 }, { label: '日', volume: 0.2 },
  ],
};

/* ── Common Platform ── */
const COMMON = {
  services: [
    { name: 'shared-auth', desc: '統合認証 (Entra ID + HENNGE SSO)', status: 'healthy', uptime: 99.99, cpu: 12, mem: 34, version: 'v2.4.1' },
    { name: 'shared-db', desc: 'PostgreSQL + PostGIS + TimescaleDB', status: 'healthy', uptime: 99.98, cpu: 38, mem: 62, version: 'v1.8.0' },
    { name: 'shared-ui', desc: 'UIコンポーネントライブラリ', status: 'healthy', uptime: 100, cpu: 2, mem: 8, version: 'v3.1.2' },
    { name: 'api-gateway', desc: 'OIDC/RBAC/RateLimit', status: 'healthy', uptime: 99.97, cpu: 22, mem: 41, version: 'v2.1.0' },
    { name: 'redis', desc: 'キャッシュ / セッション', status: 'healthy', uptime: 99.99, cpu: 8, mem: 55, version: '7.2' },
    { name: 'elasticsearch', desc: '全文検索 (Kuromoji)', status: 'healthy', uptime: 99.95, cpu: 45, mem: 71, version: '8.12' },
  ],
  apiMetrics: { totalRequests: '2.4M/日', avgLatency: '12ms', errorRate: 0.02, activeConnections: 847 },
  authSessions: { active: 312, today: 1847, mfa: 98.5, ssoProviders: ['Entra ID', 'HENNGE One'] },
};

/* ── Sales ── */
const SALES_PIPELINE = [
  { id: 'BID-2026-034', name: '東京都港区 橋梁補修工事', client: '東京都建設局', amount: 1800, stage: '提案中', probability: 65, dueDate: '2026-06-15' },
  { id: 'BID-2026-033', name: '神奈川県 河川護岸工事', client: '神奈川県県土整備部', amount: 2400, stage: '入札準備', probability: 45, dueDate: '2026-06-30' },
  { id: 'BID-2026-032', name: '千葉港 浚渫工事', client: '千葉県 港湾課', amount: 3200, stage: '見積提出', probability: 55, dueDate: '2026-07-10' },
  { id: 'BID-2026-031', name: '静岡県 トンネル補修', client: '静岡県', amount: 1500, stage: '提案中', probability: 70, dueDate: '2026-06-20' },
  { id: 'BID-2026-030', name: '国交省 防波堤改修', client: '国交省 港湾局', amount: 5600, stage: '落札候補', probability: 85, dueDate: '2026-05-30' },
  { id: 'BID-2026-029', name: '横浜市 下水管更新', client: '横浜市 環境創造局', amount: 980, stage: '失注', probability: 0, dueDate: '2026-05-15' },
];
const SALES_STATS = {
  pipelineTotal: 15.5, wonThisMonth: 3, lostThisMonth: 1, avgWinRate: 34.2,
  stageBreakdown: [
    { name: '情報収集', count: 8, amount: 4.2, color: '#94a3b8' },
    { name: '提案中', count: 5, amount: 3.8, color: '#3b82f6' },
    { name: '入札準備', count: 3, amount: 2.4, color: '#f59e0b' },
    { name: '見積提出', count: 4, amount: 3.2, color: '#8b5cf6' },
    { name: '落札候補', count: 2, amount: 5.6, color: '#10b981' },
  ],
  monthlyWon: [
    { month: '1月', amount: 2.1 }, { month: '2月', amount: 3.8 }, { month: '3月', amount: 5.2 },
    { month: '4月', amount: 1.4 }, { month: '5月', amount: 4.6 },
  ],
};

/* ── Solution Sales ── */
const SOLUTION_PROJECTS = [
  { id: 'SOL-001', name: 'IoT河川水位監視システム', client: '国交省', category: 'IoT', status: 'active', progress: 60, budget: 4500 },
  { id: 'SOL-002', name: 'BIM/CIM橋梁設計統合', client: '東京都', category: 'BIM/CIM', status: 'proposal', progress: 20, budget: 8200 },
  { id: 'SOL-003', name: 'AI地盤解析サービス', client: '大手ゼネコンA社', category: 'AI', status: 'active', progress: 45, budget: 3200 },
  { id: 'SOL-004', name: 'ドローン3D測量パッケージ', client: '複数自治体', category: 'Drone', status: 'active', progress: 80, budget: 1800 },
  { id: 'SOL-005', name: '港湾デジタルツイン', client: '名古屋港管理組合', category: 'Digital Twin', status: 'planning', progress: 10, budget: 12000 },
];

/* ── Technical ── */
const TECH_KNOWLEDGE = [
  { id: 'TK-1842', title: '軟弱地盤における鋼管杭の施工管理要領', category: '基礎工', author: '技術部 佐藤', views: 342, updated: '2026-05-20' },
  { id: 'TK-1841', title: '海上工事における環境配慮型濁水処理', category: '海上工', author: '技術部 田村', views: 128, updated: '2026-05-18' },
  { id: 'TK-1840', title: 'プレキャスト擁壁の品質検査チェックリスト', category: '構造物', author: '品質管理 高橋', views: 256, updated: '2026-05-15' },
  { id: 'TK-1839', title: 'ICT建機による盛土施工の精度管理', category: 'ICT施工', author: '技術部 山本', views: 489, updated: '2026-05-10' },
  { id: 'TK-1838', title: 'トンネル覆工コンクリートの温度管理', category: 'トンネル', author: '技術部 中村', views: 167, updated: '2026-05-08' },
];
const TECH_BIM = [
  { id: 'BIM-045', name: '東京湾岸橋梁 3Dモデル', format: 'IFC 4.0', size: '2.4GB', updated: '2026-05-22', status: 'active' },
  { id: 'BIM-044', name: '横浜港岸壁 地形モデル', format: 'LandXML', size: '890MB', updated: '2026-05-20', status: 'active' },
  { id: 'BIM-043', name: '千葉護岸 CIMモデル', format: 'IFC 4.0', size: '1.1GB', updated: '2026-05-18', status: 'review' },
];

/* ── Admin ── */
const ADMIN_HR = {
  totalEmployees: 487, avgAge: 42.3, avgTenure: 14.2, turnoverRate: 3.8,
  byDept: [
    { name: '施工本部', count: 182 }, { name: '技術本部', count: 68 }, { name: '営業本部', count: 54 },
    { name: '管理本部', count: 42 }, { name: '安全品質環境', count: 38 }, { name: 'IT-DX部門', count: 28 },
    { name: '購買部', count: 24 }, { name: '船舶事業部', count: 31 }, { name: 'その他', count: 20 },
  ],
  qualifications: [
    { name: '1級土木施工管理技士', count: 142, expiring: 8 },
    { name: '1級建築施工管理技士', count: 45, expiring: 3 },
    { name: '技術士（建設部門）', count: 28, expiring: 0 },
    { name: '測量士', count: 34, expiring: 2 },
    { name: '玉掛け技能講習', count: 198, expiring: 15 },
  ],
};
const ADMIN_FINANCE = {
  monthlyExpenses: [
    { month: '1月', amount: 820 }, { month: '2月', amount: 910 }, { month: '3月', amount: 1250 },
    { month: '4月', amount: 780 }, { month: '5月', amount: 880 },
  ],
  invoicePending: 42, invoiceAmount: 1.84, electronicRate: 87,
  workflows: [
    { id: 'WF-234', title: '出張旅費精算', applicant: '鈴木一郎', amount: '¥124,500', status: 'pending', date: '2026-05-23' },
    { id: 'WF-233', title: '設備購入稟議', applicant: '山田太郎', amount: '¥2,480,000', status: 'approved', date: '2026-05-22' },
    { id: 'WF-232', title: '協力会社契約更新', applicant: '高橋真理', amount: '—', status: 'pending', date: '2026-05-22' },
    { id: 'WF-231', title: '車両リース契約', applicant: '佐藤健', amount: '¥456,000/月', status: 'approved', date: '2026-05-21' },
  ],
};

/* ── Procurement ── */
const PROCUREMENT = {
  orders: [
    { id: 'PO-0189', item: 'H形鋼 H-300×150', supplier: '東京製鉄', qty: '200t', unitPrice: '¥98,000/t', total: '¥19,600,000', status: 'ordered', delivery: '2026-06-10' },
    { id: 'PO-0188', item: '生コンクリート 24-8-20', supplier: '関東生コン', qty: '500m3', unitPrice: '¥12,800/m3', total: '¥6,400,000', status: 'delivered', delivery: '2026-05-22' },
    { id: 'PO-0187', item: '鋼矢板 SP-IVw', supplier: '日本製鋼', qty: '120枚', unitPrice: '¥185,000/枚', total: '¥22,200,000', status: 'ordered', delivery: '2026-06-20' },
    { id: 'PO-0186', item: 'セメント 普通ポルトランド', supplier: '太平洋セメント', qty: '300t', unitPrice: '¥11,500/t', total: '¥3,450,000', status: 'delivered', delivery: '2026-05-20' },
    { id: 'PO-0185', item: '土木用シート', supplier: '旭化成建材', qty: '5,000m2', unitPrice: '¥320/m2', total: '¥1,600,000', status: 'pending', delivery: '2026-06-05' },
  ],
  suppliers: [
    { name: '東京製鉄', category: '鋼材', rating: 4.5, orders: 34, reliability: 96 },
    { name: '関東生コン', category: 'コンクリート', rating: 4.2, orders: 89, reliability: 94 },
    { name: '太平洋セメント', category: 'セメント', rating: 4.7, orders: 45, reliability: 99 },
    { name: '日本製鋼', category: '鋼材', rating: 4.3, orders: 22, reliability: 92 },
  ],
  priceIndex: [
    { item: 'H形鋼', current: 98000, prev: 90500, change: 8.3 },
    { item: '生コンクリート', current: 12800, prev: 12200, change: 4.9 },
    { item: 'セメント', current: 11500, prev: 11200, change: 2.7 },
    { item: '砕石', current: 2800, prev: 2650, change: 5.7 },
  ],
};

/* ── Marine ── */
const MARINE = {
  fleet: [
    { id: 'MV-001', name: 'みらい丸', type: '揚錨船', status: 'operating', location: '東京湾', fuel: 72, nextMaint: '2026-06-15', crew: 12 },
    { id: 'MV-002', name: '第二みらい', type: 'ガット船', status: 'operating', location: '横浜港', fuel: 58, nextMaint: '2026-07-01', crew: 8 },
    { id: 'MV-003', name: 'みらいドラグ', type: '浚渫船', status: 'maintenance', location: '名古屋港（ドック）', fuel: 40, nextMaint: '作業中', crew: 0 },
    { id: 'MV-004', name: '第三みらい', type: '押船', status: 'standby', location: '大阪港', fuel: 95, nextMaint: '2026-08-10', crew: 6 },
    { id: 'MV-005', name: 'みらいクレーン', type: '起重機船', status: 'operating', location: '東京湾', fuel: 64, nextMaint: '2026-06-20', crew: 15 },
  ],
  fuelConsumption: [
    { month: '1月', amount: 124 }, { month: '2月', amount: 118 }, { month: '3月', amount: 156 },
    { month: '4月', amount: 142 }, { month: '5月', amount: 138 },
  ],
  operationRate: 78.4,
};

/* ── Existing data (kept from v1) ── */
const EXEC_REVENUE = [
  { month: '1月', plan: 9.8, actual: 10.2 }, { month: '2月', plan: 10.5, actual: 10.8 },
  { month: '3月', plan: 12.0, actual: 13.1 }, { month: '4月', plan: 10.2, actual: 9.8 },
  { month: '5月', plan: 11.5, actual: 12.1 },
];
const EXEC_PROFIT_TREND = [
  { month: '1月', rate: 7.8 }, { month: '2月', rate: 8.1 }, { month: '3月', rate: 8.5 },
  { month: '4月', rate: 8.2 }, { month: '5月', rate: 8.7 },
];
const EXEC_COST_BREAKDOWN = [
  { name: '材料費', value: 42, color: '#3b82f6' }, { name: '外注費', value: 28, color: '#f59e0b' },
  { name: '労務費', value: 18, color: '#10b981' }, { name: '機械費', value: 8, color: '#8b5cf6' },
  { name: 'その他', value: 4, color: '#94a3b8' },
];
const EXEC_AI_PREDICTIONS = [
  { title: '利益率低下リスク', probability: 23, trend: 'down', detail: '横浜港湾工事の原価超過リスク', severity: 'warning' },
  { title: '工期遅延予測', probability: 15, trend: 'stable', detail: '3現場で軽微な遅延可能性', severity: 'info' },
  { title: '人材不足予測', probability: 42, trend: 'up', detail: '7月以降の技能者確保に懸念', severity: 'danger' },
  { title: '赤字案件予測', probability: 8, trend: 'down', detail: '全案件で健全な原価率を維持', severity: 'safe' },
];

const PROJECTS = [
  { id: 'P-2026-001', name: '東京湾岸道路橋梁工事', client: '国土交通省 関東地方整備局', location: '東京都江東区', progress: 68, budget: 4500, spent: 2890, startDate: '2025-10', endDate: '2027-03', status: 'active', workers: 48, safetyScore: 92 },
  { id: 'P-2026-002', name: '横浜港湾岸壁改修工事', client: '横浜市 港湾局', location: '横浜市中区', progress: 45, budget: 2800, spent: 1150, startDate: '2026-01', endDate: '2027-06', status: 'active', workers: 35, safetyScore: 88 },
  { id: 'P-2026-003', name: '千葉河川護岸工事', client: '千葉県 県土整備部', location: '千葉市花見川区', progress: 92, budget: 1200, spent: 1080, startDate: '2025-06', endDate: '2026-07', status: 'active', workers: 22, safetyScore: 96 },
  { id: 'P-2025-018', name: '名古屋港浚渫工事', client: '名古屋港管理組合', location: '名古屋市港区', progress: 100, budget: 3200, spent: 3050, startDate: '2025-02', endDate: '2026-04', status: 'completed', workers: 0, safetyScore: 95 },
  { id: 'P-2026-004', name: '大阪湾防波堤補強工事', client: '国土交通省 近畿地方整備局', location: '大阪市住之江区', progress: 12, budget: 5600, spent: 580, startDate: '2026-04', endDate: '2028-03', status: 'active', workers: 28, safetyScore: 97 },
  { id: 'P-2026-005', name: '北海道トンネル補修工事', client: '北海道開発局', location: '北海道小樽市', progress: 55, budget: 1800, spent: 920, startDate: '2025-11', endDate: '2026-12', status: 'delayed', workers: 18, safetyScore: 91 },
];

const DAILY_REPORTS = [
  { id: 1, date: '2026-05-23', project: 'P-2026-001', author: '田中太郎', weather: '晴れ', workers: 48, summary: '基礎杭打設 A1橋台 完了。明日より A2橋台着手。', status: 'submitted' },
  { id: 2, date: '2026-05-23', project: 'P-2026-002', author: '鈴木一郎', weather: '曇り', workers: 35, summary: '岸壁前面の捨石投入 3,200m3 完了。', status: 'approved' },
  { id: 3, date: '2026-05-22', project: 'P-2026-003', author: '佐藤花子', weather: '晴れ', workers: 22, summary: '護岸ブロック据付 最終区間着手。', status: 'submitted' },
  { id: 4, date: '2026-05-22', project: 'P-2026-005', author: '山田健二', weather: '雨', workers: 12, summary: '雨天のため内部作業のみ実施。覆工板補修。', status: 'draft' },
];

const NEAR_MISSES = [
  { id: 'HH-2026-089', date: '2026-05-23', project: 'P-2026-001', category: 'man', level: 'warning', title: '安全帯フック掛け忘れ', reporter: '佐々木正', detail: '高所作業中にフック未掛けを目視確認。即座に指導実施。' },
  { id: 'HH-2026-088', date: '2026-05-22', project: 'P-2026-002', category: 'machine', level: 'danger', title: 'クレーン旋回範囲内に作業員', detail: '50tクレーン旋回中に監視範囲内へ作業員が侵入。緊急停止。' },
  { id: 'HH-2026-087', date: '2026-05-22', project: 'P-2026-001', category: 'material', level: 'caution', title: '資材仮置き転倒', detail: 'H形鋼の仮置きが風により傾いた。人的被害なし。' },
  { id: 'HH-2026-086', date: '2026-05-21', project: 'P-2026-003', category: 'method', level: 'caution', title: '作業手順書未確認', detail: '新規入場者が作業手順書を確認せず作業開始。' },
  { id: 'HH-2026-085', date: '2026-05-21', project: 'P-2026-005', category: 'man', level: 'warning', title: '体調不良申告遅れ', detail: '熱中症の初期症状がありながら作業続行。巡回時に発見。' },
];

const SAFETY_STATS = {
  totalIncidents: 3, nearMisses: 89, kyActivities: 245, patrols: 67,
  monthlyTrend: [
    { month: '1月', incidents: 1, nearMisses: 14 }, { month: '2月', incidents: 0, nearMisses: 18 },
    { month: '3月', incidents: 1, nearMisses: 21 }, { month: '4月', incidents: 0, nearMisses: 16 },
    { month: '5月', incidents: 1, nearMisses: 20 },
  ],
  heatmap: [[1,0,2,0,1],[0,1,0,1,0],[2,1,3,1,2],[0,0,1,0,0],[1,2,1,2,1]],
  heatmapLabels: { rows: ['致命的','重大','中程度','軽微','微小'], cols: ['極めて低い','低い','中程度','高い','極めて高い'] },
  isoStatus: [
    { standard: 'ISO 9001', status: '適合', lastAudit: '2026-03-15', nextAudit: '2026-09-15' },
    { standard: 'ISO 14001', status: '適合', lastAudit: '2026-03-15', nextAudit: '2026-09-15' },
    { standard: 'ISO 45001', status: '適合', lastAudit: '2026-02-20', nextAudit: '2026-08-20' },
  ],
  co2: { current: 284, target: 320, unit: 'tCO2', trend: [310, 295, 288, 284] },
};

const ITSM_TICKETS = [
  { id: 'INC-4521', priority: 'high', title: 'VPN接続不可（大阪支店）', assignee: '山本隆', status: 'open', created: '2026-05-23 09:15', sla: '4h', remaining: '2h30m' },
  { id: 'INC-4520', priority: 'medium', title: 'SharePoint アクセス権限エラー', assignee: '中村優子', status: 'in_progress', created: '2026-05-23 08:30', sla: '8h', remaining: '5h' },
  { id: 'INC-4519', priority: 'low', title: 'プリンタ設定変更依頼（東京本社）', assignee: '渡辺浩', status: 'in_progress', created: '2026-05-22 16:00', sla: '24h', remaining: '14h' },
  { id: 'INC-4518', priority: 'critical', title: 'FortiGate アラート — 異常トラフィック検知', assignee: '加藤真一', status: 'resolved', created: '2026-05-22 14:22', sla: '1h', remaining: '—' },
  { id: 'INC-4517', priority: 'medium', title: 'Entra ID同期エラー', assignee: '中村優子', status: 'resolved', created: '2026-05-22 10:00', sla: '8h', remaining: '—' },
  { id: 'INC-4516', priority: 'low', title: 'DeskNet\'s NEO 通知設定', assignee: '渡辺浩', status: 'open', created: '2026-05-22 09:00', sla: '24h', remaining: '8h' },
];
const ITSM_STATS = {
  openTickets: 24, resolvedToday: 8, avgResolution: '3.2h', slaCompliance: 98.2,
  byCategory: [
    { name: 'ネットワーク', count: 8, color: '#3b82f6' }, { name: '認証/ID', count: 6, color: '#8b5cf6' },
    { name: 'アプリ', count: 5, color: '#10b981' }, { name: 'ハードウェア', count: 3, color: '#f59e0b' },
    { name: 'その他', count: 2, color: '#94a3b8' },
  ],
  securityAlerts: [
    { time: '09:15', type: 'warning', message: '大阪支店からの不正ログイン試行（3回連続失敗）' },
    { time: '08:44', type: 'info', message: 'FortiGate IPS シグネチャ更新完了' },
    { time: '07:30', type: 'info', message: 'Wazuh — 全エージェント接続確認 OK' },
    { time: '昨日 22:10', type: 'warning', message: 'Cisco Switch Port 異常トラフィック検知（自動遮断済）' },
  ],
  assets: { total: 487, managed: 462, unmanaged: 25, byType: { PC: 312, server: 28, network: 47, mobile: 85, other: 15 } },
};

const AUDIT_LOGS = [
  { id: 'AUD-0412', timestamp: '2026-05-23 10:34', user: '田中太郎', dept: '施工本部', action: 'データ更新', target: '工事日報 P-2026-001', detail: '出来高数量を修正（3,200→3,250m3）', ip: '10.0.1.45' },
  { id: 'AUD-0411', timestamp: '2026-05-23 10:15', user: '鈴木一郎', dept: '営業本部', action: 'データ作成', target: '入札案件 BID-2026-034', detail: '新規入札案件を登録', ip: '10.0.2.12' },
  { id: 'AUD-0410', timestamp: '2026-05-23 09:58', user: '山本隆', dept: 'IT-DX部門', action: '権限変更', target: 'ユーザー権限 user:satou_h', detail: '施工管理システムの閲覧権限を付与', ip: '10.0.0.5' },
  { id: 'AUD-0409', timestamp: '2026-05-23 09:42', user: '佐藤花子', dept: '安全品質環境', action: 'データ作成', target: 'ヒヤリハット HH-2026-089', detail: 'ヒヤリハット報告を新規登録', ip: '10.0.3.8' },
  { id: 'AUD-0408', timestamp: '2026-05-23 09:30', user: '加藤真一', dept: 'IT-DX部門', action: 'システム設定', target: 'FortiGate Policy', detail: 'ファイアウォールルール更新（大阪支店VPN）', ip: '10.0.0.2' },
  { id: 'AUD-0407', timestamp: '2026-05-23 09:15', user: '中村優子', dept: 'IT-DX部門', action: '障害対応', target: 'INC-4521', detail: 'VPN障害チケット起票・対応開始', ip: '10.0.0.8' },
  { id: 'AUD-0406', timestamp: '2026-05-22 17:45', user: '高橋慎也', dept: '購買部', action: 'データ作成', target: '発注 PO-2026-0189', detail: 'H形鋼 200t を発注（東京製鉄）', ip: '10.0.4.3' },
  { id: 'AUD-0405', timestamp: '2026-05-22 17:30', user: '山田健二', dept: '施工本部', action: 'ファイル更新', target: '施工写真 P-2026-005', detail: '写真12枚アップロード', ip: '10.0.5.22' },
  { id: 'AUD-0404', timestamp: '2026-05-22 16:20', user: '渡辺浩', dept: 'IT-DX部門', action: '資産管理', target: 'CMDB — PC-0312', detail: 'PC資産情報を更新（Windows Update適用）', ip: '10.0.0.10' },
  { id: 'AUD-0403', timestamp: '2026-05-22 15:00', user: '田中太郎', dept: '施工本部', action: 'レポート出力', target: '月次報告書 2026-04', detail: '4月度工事月報をPDF出力', ip: '10.0.1.45' },
];

const ALERTS = [
  { id: 1, severity: 'danger', dept: '06', title: '転落リスク検知', desc: '東京湾岸現場 A工区で安全帯未装着を検知', time: '3分前' },
  { id: 2, severity: 'warning', dept: '04', title: '工程遅延警告', desc: '横浜港湾工事 掘削工程が2日遅延', time: '15分前' },
  { id: 3, severity: 'info', dept: '10', title: 'パッチ適用完了', desc: 'FortiGate 全拠点のファームウェア更新完了', time: '1時間前' },
  { id: 4, severity: 'warning', dept: '08', title: '資材価格高騰', desc: 'H形鋼の単価が先月比 +8.2%', time: '2時間前' },
  { id: 5, severity: 'info', dept: '02', title: '入札結果通知', desc: '国交省 河川改修工事 落札候補者に選定', time: '3時間前' },
];

/* ── Settings ── */
const SETTINGS = {
  users: [
    { id: 'U001', name: '管理者', email: 'admin@mirai-const.co.jp', role: 'システム管理者', dept: 'IT-DX部門', lastLogin: '2026-05-23 10:30', status: 'active' },
    { id: 'U002', name: '田中太郎', email: 'tanaka@mirai-const.co.jp', role: '施工管理者', dept: '施工本部', lastLogin: '2026-05-23 10:34', status: 'active' },
    { id: 'U003', name: '鈴木一郎', email: 'suzuki@mirai-const.co.jp', role: '営業', dept: '営業本部', lastLogin: '2026-05-23 10:15', status: 'active' },
    { id: 'U004', name: '佐藤花子', email: 'sato@mirai-const.co.jp', role: '安全管理者', dept: '安全品質環境', lastLogin: '2026-05-23 09:42', status: 'active' },
    { id: 'U005', name: '山本隆', email: 'yamamoto@mirai-const.co.jp', role: 'IT管理者', dept: 'IT-DX部門', lastLogin: '2026-05-23 09:58', status: 'active' },
    { id: 'U006', name: '退職済ユーザー', email: 'old@mirai-const.co.jp', role: '一般', dept: '管理本部', lastLogin: '2026-04-01', status: 'disabled' },
  ],
  roles: ['システム管理者', '部門管理者', '施工管理者', '安全管理者', '営業', 'IT管理者', '閲覧者', '一般'],
  integrations: [
    { name: 'Microsoft Entra ID', status: 'connected', lastSync: '2026-05-23 10:00' },
    { name: 'HENNGE One', status: 'connected', lastSync: '2026-05-23 09:55' },
    { name: 'SharePoint Online', status: 'connected', lastSync: '2026-05-23 09:30' },
    { name: 'FortiGate', status: 'connected', lastSync: '2026-05-23 10:05' },
    { name: 'DeskNet\'s NEO', status: 'connected', lastSync: '2026-05-23 08:00' },
    { name: 'Azure OpenAI', status: 'connected', lastSync: '2026-05-23 10:30' },
  ],
  backup: { lastFull: '2026-05-23 03:00', lastIncr: '2026-05-23 09:00', nextFull: '2026-05-24 03:00', size: '847 GB', retention: '90日' },
};

window.CDX_DATA = {
  PORTAL_KPIS, PHASE_PROGRESS, DEPT_KPIS,
  DEPARTMENTS, DATALAKE, COMMON, SALES_PIPELINE, SALES_STATS, SOLUTION_PROJECTS,
  TECH_KNOWLEDGE, TECH_BIM, ADMIN_HR, ADMIN_FINANCE, PROCUREMENT, MARINE, SETTINGS,
  EXEC_REVENUE, EXEC_PROFIT_TREND, EXEC_COST_BREAKDOWN, EXEC_AI_PREDICTIONS,
  PROJECTS, DAILY_REPORTS, NEAR_MISSES, SAFETY_STATS,
  ITSM_TICKETS, ITSM_STATS, AUDIT_LOGS, ALERTS,
};
