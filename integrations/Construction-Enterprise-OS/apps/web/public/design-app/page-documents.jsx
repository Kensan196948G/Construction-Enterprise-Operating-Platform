/* ========================================
   Construction Enterprise OS — Documents Sub-views
   CAD, BIM, Photo, Video, OCR, Board, Deliver, Version, AI-Search
   ======================================== */

function DocumentsPage({ subPath }) {
  const cs = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' };
  const header = (title, desc) => (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h1>
      <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{desc}</p>
    </div>
  );

  if (subPath === '/documents/cad') {
    const drawings = [
      { name: '構造図_7F_鉄骨配置図.dwg', ver: 'v3.1', date: '2026/05/24', author: '山田', size: '12.1MB', status: '承認済' },
      { name: '構造図_6F_スラブ配筋.dwg', ver: 'v2.0', date: '2026/05/22', author: '山田', size: '8.4MB', status: '承認済' },
      { name: '設備図_電気幹線.dwg', ver: 'v1.5', date: '2026/05/20', author: '佐々木', size: '6.2MB', status: '承認済' },
      { name: '設備図_給排水.dwg', ver: 'v1.3', date: '2026/05/18', author: '山本', size: '5.8MB', status: '修正中' },
      { name: '仮設計画図_足場.dwg', ver: 'v2.1', date: '2026/05/21', author: '伊藤', size: '3.4MB', status: '承認済' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('CAD図面', 'AutoCAD/DWG図面の閲覧・管理・バージョン管理')}
        <div style={cs}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 60px 100px 70px 70px 70px 60px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>ファイル名</span><span>版</span><span>更新日</span><span>作成者</span><span>サイズ</span><span>状態</span><span></span>
          </div>
          {drawings.map((d,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 60px 100px 70px 70px 70px 60px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i<drawings.length-1?'1px solid #f1f5f9':'none', fontSize: 12, cursor: 'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 4, background: '#1a56db15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#1a56db' }}>CAD</div>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{d.name}</span>
              </div>
              <span style={{ color: '#64748b', fontSize: 11 }}>{d.ver}</span>
              <span style={{ color: '#64748b', fontSize: 11 }}>{d.date}</span>
              <span style={{ color: '#64748b' }}>{d.author}</span>
              <span style={{ color: '#64748b', fontSize: 11 }}>{d.size}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: d.status==='承認済'?'#dcfce7':'#fef3c7', color: d.status==='承認済'?'#166534':'#92400e' }}>{d.status}</span>
              <button style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff', fontSize: 10, cursor: 'pointer', color: '#1a56db', fontFamily: 'inherit' }}>開く</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPath === '/documents/bim') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('BIM/CIM', '3Dモデルの閲覧・干渉チェック・属性管理')}
        <div style={{ ...cs, padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 400, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.1 }}>
              <defs><pattern id="bimG" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#60a5fa" strokeWidth="0.5" /></pattern></defs>
              <rect fill="url(#bimG)" width="100%" height="100%" />
            </svg>
            <svg width="180" height="160" viewBox="0 0 180 160" style={{ position: 'relative' }}>
              <g stroke="#60a5fa" strokeWidth="1" fill="none" opacity="0.6">
                <rect x="30" y="30" width="70" height="110" /><rect x="50" y="15" width="70" height="110" />
                <line x1="30" y1="30" x2="50" y2="15" /><line x1="100" y1="30" x2="120" y2="15" />
                <line x1="30" y1="140" x2="50" y2="125" /><line x1="100" y1="140" x2="120" y2="125" />
                {[0,1,2,3].map(f => (<React.Fragment key={f}><line x1="30" y1={140-f*27} x2="100" y2={140-f*27} opacity="0.3" /><line x1="50" y1={125-f*27} x2="120" y2={125-f*27} opacity="0.3" /></React.Fragment>))}
              </g>
            </svg>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#93c5fd', position: 'relative' }}>BIM/CIMビューア</div>
            <div style={{ fontSize: 12, color: '#64748b', position: 'relative' }}>品川タワー新築工事 — IFCモデル v4.0</div>
            <div style={{ display: 'flex', gap: 8, position: 'relative', marginTop: 8 }}>
              {['3Dビュー','断面表示','干渉チェック','属性情報','計測'].map(b => (
                <button key={b} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #60a5fa40', background: 'transparent', color: '#93c5fd', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{b}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[['モデルサイズ','245MB'],['要素数','12,482'],['階数','12F'],['最終更新','2026/05/21']].map(([k,v]) => (
              <div key={k} style={{ textAlign: 'center', padding: '8px 0', borderRadius: 6, background: '#f8fafc' }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (subPath === '/documents/photo') {
    const albums = [
      { name: '品川タワー 5月', count: 342, cover: '鉄骨建方', date: '2026/05/24' },
      { name: '横浜マンション 5月', count: 187, cover: '型枠工事', date: '2026/05/23' },
      { name: '大田区土木 5月', count: 95, cover: '舗装工事', date: '2026/05/22' },
      { name: '品川タワー 4月', count: 428, cover: '躯体工事', date: '2026/04/30' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('写真管理', '工事写真の整理・分類・電子黒板連携')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
          {albums.map((a,i) => (
            <div key={i} style={{ ...cs, padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div style={{ height: 160, background: `hsl(${210+i*30},20%,${88-i*3}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={36} style={{ color: '#94a3b8' }} />
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{a.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{a.count}枚 · {a.cover} · {a.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPath === '/documents/video') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('動画管理', '現場動画・ドローン映像・タイムラプス')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
          {[
            { name: 'ドローン測量映像 品川タワー', duration: '12:34', date: '2026/05/24', size: '1.2GB' },
            { name: 'タイムラプス 鉄骨建方 5-7F', duration: '02:15', date: '2026/05/22', size: '450MB' },
            { name: '安全パトロール記録映像', duration: '08:42', date: '2026/05/21', size: '680MB' },
            { name: 'コンクリート打設記録', duration: '15:20', date: '2026/05/20', size: '1.4GB' },
          ].map((v,i) => (
            <div key={i} style={{ ...cs, padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ height: 180, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 0, height: 0, borderLeft: '16px solid #fff', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', marginLeft: 4 }}></div>
                </div>
                <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 11, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4 }}>{v.duration}</span>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v.name}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{v.date} · {v.size}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPath === '/documents/ocr') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('OCR', '紙文書のデジタル化・AI文字認識')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
          {[{ label: '処理済み文書', value: '2,481', icon: 'file-text', color: '#1a56db', bg: '#eff6ff' },
            { label: '認識精度', value: '97.8%', icon: 'check-circle', color: '#16a34a', bg: '#f0fdf4' },
            { label: '本日処理', value: '12', icon: 'zap', color: '#7c3aed', bg: '#f5f3ff' }
          ].map((s,i) => (
            <div key={i} style={{ ...cs, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={s.icon} size={16} style={{ color: s.color }} /></div>
              <div><div style={{ fontSize: 10, color: '#94a3b8' }}>{s.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{s.value}</div></div>
            </div>
          ))}
        </div>
        <div style={{ ...cs, padding: 40, textAlign: 'center', border: '2px dashed #d1d5db' }}>
          <Icon name="file-text" size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>文書をドラッグ＆ドロップでアップロード</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PDF・JPEG・PNG・TIFF対応 — AIが自動でテキスト抽出</div>
        </div>
      </div>
    );
  }

  if (subPath === '/documents/board') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('電子黒板', 'デジタル工事黒板の作成・写真合成')}
        <div style={{ ...cs, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 20, color: '#fff' }}>
            <div style={{ border: '2px solid #fff', borderRadius: 4, padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', borderBottom: '1px solid #fff', paddingBottom: 6, marginBottom: 8 }}>工事写真撮影黒板</div>
              {[['工事名','品川タワー新築工事'],['工種','躯体工事'],['撮影日','2026年5月24日'],['撮影者','田中 健一'],['備考','7F鉄骨建方']].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.3)', padding: '3px 0', fontSize: 11 }}>
                  <span style={{ width: 70, color: '#aaa' }}>{k}</span><span>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>テンプレート選択</div>
            {['標準黒板','出来形黒板','品質管理黒板','安全管理黒板'].map(t => (
              <button key={t} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: t==='標準黒板'?'#eff6ff':'#fff', color: '#374151', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>{t}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (subPath === '/documents/deliver') {
    const deliverables = [
      { name: '品川タワー 第1回納品', items: 342, status: 'チェック中', deadline: '2026/06/30', progress: 68 },
      { name: '大田区土木 完成図書', items: 128, status: '準備中', deadline: '2026/12/31', progress: 45 },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('電子納品', 'CALS/EC準拠の電子納品データ作成')}
        {deliverables.map((d,i) => (
          <div key={i} style={{ ...cs, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{d.name}</div>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#fff7ed', color: '#92400e' }}>{d.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', marginBottom: 8 }}>
              <span>ファイル数: {d.items}</span><span>期限: {d.deadline}</span>
            </div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${d.progress}%`, background: '#1a56db', borderRadius: 3 }}></div>
            </div>
            <div style={{ fontSize: 11, color: '#1a56db', fontWeight: 500, marginTop: 4 }}>{d.progress}% 完了</div>
          </div>
        ))}
      </div>
    );
  }

  if (subPath === '/documents/version') {
    const versions = [
      { file: '構造図_7F_鉄骨配置図.pdf', ver: 'v3.1', prev: 'v3.0', date: '2026/05/24', author: '佐藤', changes: 'ボルト仕様変更 M22→M24' },
      { file: '施工計画書_躯体工事.pdf', ver: 'v2.0', prev: 'v1.5', date: '2026/05/23', author: '田中', changes: '安全対策追記、工程表更新' },
      { file: '配筋図_6F_スラブ.dwg', ver: 'v1.2', prev: 'v1.1', date: '2026/05/22', author: '山田', changes: '補強筋追加' },
      { file: '足場計画図.pdf', ver: 'v2.1', prev: 'v2.0', date: '2026/05/20', author: '伊藤', changes: '8F以降の足場計画追加' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('バージョン管理', '文書の変更履歴・差分比較')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {versions.map((v,i) => (
            <div key={i} style={{ ...cs, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v.file}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#dcfce7', color: '#166534', fontWeight: 600 }}>{v.ver}</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>← {v.prev}</span>
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>変更内容: {v.changes}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{v.author} · {v.date}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPath === '/documents/ai-search') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('AI文書検索', 'AI搭載の全文書横断検索・セマンティック検索')}
        <div style={{ ...cs, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
              <Icon name="search" size={18} style={{ color: '#94a3b8' }} />
              <input placeholder="自然言語で検索... 例: 「7階の鉄骨接合部のボルト仕様は？」" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, flex: 1, fontFamily: 'inherit', color: '#0f172a' }} />
            </div>
            <button style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
              <Icon name="brain" size={16} />AI検索
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {['7階鉄骨のボルト仕様','コンクリート配合計画','足場設置基準','安全管理計画'].map(q => (
              <button key={q} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>{q}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: 16, borderRadius: 8, background: '#f5f3ff', border: '1px solid #ede9fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon name="brain" size={14} style={{ color: '#7c3aed' }} /><span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>AI検索について</span></div>
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>ベクトル検索（セマンティック検索）により、キーワードの完全一致ではなく意味的に関連する文書を横断検索します。PDF内のテキスト、CAD属性、BIMモデル情報も検索対象です。</div>
        </div>
      </div>
    );
  }

  /* Default: PDF management (original documents view) */
  return <DocumentsPDFView />;
}

window.DocumentsPage = DocumentsPage;
