/* ========================================
   Construction Enterprise OS — GIS / 地図 Page (v2)
   SlideTabPanel for each sub-item
   ======================================== */

function GISPage({ subPath }) {
  const tabFromPath = {
    '/gis/projects': 'projects', '/gis/ocean': 'ocean', '/gis/disaster': 'disaster',
    '/gis/drone': 'drone', '/gis/pointcloud': 'pointcloud', '/gis/hazard': 'hazard',
    '/gis/realtime': 'realtime',
  };
  const [activeTab, setActiveTab] = React.useState(tabFromPath[subPath] || 'projects');
  React.useEffect(() => { if (tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]); }, [subPath]);

  const cs = { background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' };
  const sites = [
    { name: '品川タワー新築', type: '建築', workers: 45, progress: 68 },
    { name: '横浜分譲マンション', type: '建築', workers: 32, progress: 42 },
    { name: '大田区土木工事', type: '土木', workers: 18, progress: 85 },
    { name: '新宿再開発ビル', type: '建築', workers: 28, progress: 23 },
    { name: '川崎物流センター', type: '建築', workers: 38, progress: 55 },
    { name: '千葉港湾整備', type: '港湾', workers: 22, progress: 35 },
  ];
  const typeColor = { '建築': '#1a56db', '土木': '#f97316', '港湾': '#7c3aed' };

  // Real OpenStreetMap (Leaflet) basemap with geo-located overlays
  const OSMMap = ({ markers = [], circles = [], paths = [], center = [35.57, 139.85], zoom = 10, fit = true, height = 320 }) => {
    const elRef = React.useRef(null);
    React.useEffect(() => {
      if (!window.L || !elRef.current) return;
      const map = L.map(elRef.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      const group = [];
      circles.forEach(c => {
        const circ = L.circle([c.lat, c.lng], { radius: c.radiusM, color: c.color, weight: 1.5, dashArray: '5,4', fillColor: c.color, fillOpacity: 0.12 }).addTo(map);
        if (c.label) circ.bindTooltip(`<span style="color:${c.color}">${c.label}</span>`, { permanent: true, direction: 'center', className: 'osm-zone-label' });
        group.push(circ);
      });
      paths.forEach(p => {
        const line = L.polyline(p.coords, { color: p.color, weight: 3, dashArray: '8,6', opacity: 0.85 }).addTo(map);
        group.push(line);
      });
      markers.forEach(m => {
        const icon = L.divIcon({ className: 'osm-pin-wrap', iconSize: [14, 14], iconAnchor: [7, 7],
          html: `<span class="osm-pin${m.pulse ? ' osm-pulse' : ''}" style="--pin:${m.color}"></span>` });
        const mk = L.marker([m.lat, m.lng], { icon }).addTo(map);
        if (m.label) mk.bindTooltip(m.label, { permanent: true, direction: 'top', offset: [0, -8], className: 'osm-label' });
        group.push(mk);
      });
      if (fit && group.length) {
        try { map.fitBounds(L.featureGroup(group).getBounds().pad(0.25)); }
        catch (e) { map.setView(center, zoom); }
      } else {
        map.setView(center, zoom);
      }
      const t = setTimeout(() => map.invalidateSize(), 250);
      return () => { clearTimeout(t); map.remove(); };
    }, []);
    return <div ref={elRef} style={{ height, borderRadius: 8, overflow: 'hidden', marginBottom: 16, position: 'relative', zIndex: 0, border: '1px solid var(--border)' }} />;
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>GIS / 地図</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>工事位置・海域・災害・ドローン・点群・ハザード・リアルタイム</p>
      </div>

      <div style={cs}>
        <SlideTabPanel
          tabs={[
            { id: 'projects', label: '工事位置' },
            { id: 'ocean', label: '海域マップ' },
            { id: 'disaster', label: '災害情報' },
            { id: 'drone', label: 'ドローン地図' },
            { id: 'pointcloud', label: '点群データ' },
            { id: 'hazard', label: 'ハザードマップ' },
            { id: 'realtime', label: 'リアルタイム位置' },
          ]}
          activeTab={activeTab} onTabChange={setActiveTab}>

          {/* 工事位置 */}
          <div style={{ padding: 20 }}>
            <OSMMap markers={[
              { lat: 35.6285, lng: 139.7400, color: '#1a56db', label: '品川' },
              { lat: 35.4657, lng: 139.6223, color: '#16a34a', label: '横浜' },
              { lat: 35.5614, lng: 139.7161, color: '#f97316', label: '大田区' },
              { lat: 35.6896, lng: 139.6917, color: '#7c3aed', label: '新宿' },
              { lat: 35.5308, lng: 139.7029, color: '#dc2626', label: '川崎' },
              { lat: 35.6073, lng: 140.1065, color: '#7c3aed', label: '千葉' },
            ]} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>工事一覧 ({sites.length}件)</div>
            {sites.map((s,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor[s.type] }}></span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{s.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.type}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.workers}名</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#1a56db' }}>{s.progress}%</span>
              </div>
            ))}
          </div>

          {/* 海域マップ */}
          <div style={{ padding: 20 }}>
            <OSMMap center={[35.55, 139.92]} zoom={11} fit={false}
              circles={[
                { lat: 35.555, lng: 139.880, radiusM: 6500, color: '#1a56db', label: '作業海域A' },
                { lat: 35.490, lng: 139.950, radiusM: 4200, color: '#7c3aed', label: '作業海域B' },
              ]}
              markers={[{ lat: 35.607, lng: 140.070, color: '#7c3aed', label: '千葉港湾' }]} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[{l:'潮位',v:'1.8m',s:'上げ潮',c:'#1a56db'},{l:'波高',v:'1.2m',s:'安定',c:'#16a34a'},{l:'海水温',v:'22.5°C',s:'平年並み',c:'#f97316'}].map((d,i) => (
                <div key={i} style={{ padding: 14, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: d.c }}>{d.v}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{d.l} · {d.s}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 災害情報 */}
          <div style={{ padding: 20 }}>
            <OSMMap center={[35.57, 139.74]} zoom={11} fit={false}
              circles={[
                { lat: 35.615, lng: 139.720, radiusM: 4000, color: '#dc2626', label: '地震観測点' },
                { lat: 35.545, lng: 139.770, radiusM: 5000, color: '#f97316', label: '土砂警戒' },
              ]} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>災害関連情報</div>
            {[
              { type: '地震', message: '最新: 2026/05/23 千葉県東方沖 M3.2 深度30km 震度1', severity: 'low' },
              { type: '台風', message: '台風情報なし（現在発生中の台風はありません）', severity: 'none' },
              { type: '大雨', message: '関東地方 5/26-27 大雨注意報の可能性', severity: 'medium' },
              { type: '土砂災害', message: '大田区南部 土砂災害警戒区域 近接工事あり', severity: 'medium' },
            ].map((d,i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 6, background: d.severity==='medium'?'#fff7ed':d.severity==='low'?'#eff6ff':'var(--bg-subtle)', border: `1px solid ${d.severity==='medium'?'#fed7aa':d.severity==='low'?'#bfdbfe':'var(--border)'}`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                <Icon name={d.severity==='none'?'check-circle':'alert-triangle'} size={14} style={{ color: d.severity==='medium'?'#f97316':d.severity==='low'?'#1a56db':'#16a34a' }} />
                <span style={{ fontWeight: 600, color: 'var(--text)', minWidth: 50 }}>{d.type}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{d.message}</span>
              </div>
            ))}
          </div>

          {/* ドローン地図 */}
          <div style={{ padding: 20 }}>
            <OSMMap
              paths={[
                { color: '#7c3aed', coords: [[35.6285, 139.7400], [35.620, 139.820], [35.612, 139.950], [35.607, 140.060]] },
                { color: '#16a34a', coords: [[35.530, 139.703], [35.522, 139.745], [35.512, 139.790]] },
              ]}
              markers={[
                { lat: 35.607, lng: 140.060, color: '#7c3aed', label: 'DRN-001' },
                { lat: 35.512, lng: 139.790, color: '#16a34a', label: 'DRN-004' },
              ]} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { id: 'DRN-001', name: 'Phantom 4 RTK', site: '品川タワー', status: '飛行中', battery: 72 },
                { id: 'DRN-004', name: 'Phantom 4 RTK', site: '千葉港湾', status: '飛行中', battery: 58 },
                { id: 'DRN-002', name: 'Matrice 300', site: '横浜マンション', status: '待機', battery: 95 },
                { id: 'DRN-003', name: 'Mavic 3E', site: '川崎物流', status: '充電中', battery: 34 },
              ].map((d,i) => (
                <div key={i} style={{ padding: 12, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="eye" size={18} style={{ color: d.status==='飛行中'?'#16a34a':'#94a3b8' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{d.name} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({d.id})</span></div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.site}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: d.status==='飛行中'?'#16a34a':d.status==='充電中'?'#f97316':'#94a3b8' }}>{d.status}</span>
                  <span style={{ fontSize: 10, color: d.battery>50?'#16a34a':'#f97316' }}>{d.battery}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 点群データ */}
          <div style={{ padding: 20 }}>
            <div style={{ height: 300, borderRadius: 8, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.1 }}>
                <defs><pattern id="pcGrid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="#60a5fa" /></pattern></defs>
                <rect fill="url(#pcGrid)" width="100%" height="100%" />
              </svg>
              <Icon name="globe" size={48} style={{ color: '#60a5fa', position: 'relative', opacity: 0.6 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#93c5fd', position: 'relative' }}>3D点群ビューア</div>
              <div style={{ fontSize: 12, color: '#64748b', position: 'relative' }}>LiDAR / ドローン測量による3D点群データ</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[{l:'データセット',v:'8',c:'#1a56db'},{l:'総ポイント数',v:'42.8億',c:'#7c3aed'},{l:'最終更新',v:'2026/05/22',c:'#16a34a'}].map((s,i) => (
                <div key={i} style={{ padding: 12, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ハザードマップ */}
          <div style={{ padding: 20 }}>
            <OSMMap center={[35.56, 139.77]} zoom={11} fit={false}
              circles={[
                { lat: 35.610, lng: 139.780, radiusM: 4000, color: '#dc2626', label: '浸水危険区域' },
                { lat: 35.550, lng: 139.740, radiusM: 3500, color: '#f97316', label: '液状化危険' },
                { lat: 35.520, lng: 139.800, radiusM: 3000, color: '#eab308', label: '津波注意' },
              ]} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>ハザード情報</div>
            {[
              { area: '品川沿岸', risk: '浸水', level: '中', detail: '高潮時 最大浸水深 0.5m', color: '#f97316' },
              { area: '大田区南部', risk: '液状化', level: '高', detail: '液状化危険度 PL値 15以上', color: '#dc2626' },
              { area: '川崎臨海', risk: '津波', level: '中', detail: '想定津波高 2.5m', color: '#f97316' },
              { area: '新宿西部', risk: '崖崩れ', level: '低', detail: '急傾斜地崩壊危険箇所 近接', color: '#eab308' },
            ].map((h,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: h.color+'18', color: h.color }}>{h.level}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', width: 90 }}>{h.area}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 60 }}>{h.risk}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{h.detail}</span>
              </div>
            ))}
          </div>

          {/* リアルタイム位置 */}
          <div style={{ padding: 20 }}>
            <OSMMap center={[35.61, 139.76]} zoom={13} fit={false} markers={[
              { lat: 35.6285, lng: 139.7400, color: '#f97316', label: '重機A', pulse: true },
              { lat: 35.6270, lng: 139.7442, color: '#f97316', label: '重機B', pulse: true },
              { lat: 35.6200, lng: 139.7600, color: '#1a56db', label: '作業車1', pulse: true },
              { lat: 35.5900, lng: 139.7450, color: '#1a56db', label: '作業車2', pulse: true },
              { lat: 35.6050, lng: 139.7800, color: '#7c3aed', label: 'ドローン', pulse: true },
            ]} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
              {[{l:'GPS追跡中',v:'42台',c:'#1a56db'},{l:'重機',v:'8台',c:'#f97316'},{l:'ドローン',v:'2機',c:'#7c3aed'}].map((s,i) => (
                <div key={i} style={{ padding: 12, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: '#dcfce7', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#166534' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s infinite' }}></span>
              全車両・重機のGPS位置をリアルタイム更新中（更新間隔: 5秒）
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          </div>
        </SlideTabPanel>
      </div>
    </div>
  );
}

window.GISPage = GISPage;
