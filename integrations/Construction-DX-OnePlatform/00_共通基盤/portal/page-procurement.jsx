/* Construction DX One Platform — Procurement Page */

function PageProcurement() {
  const [tab, setTab] = React.useState('orders');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'orders', label: '発注管理' }, { id: 'suppliers', label: '協力会社' }, { id: 'prices', label: '価格動向' }, { id: 'inventory', label: '在庫管理' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'orders' && React.createElement(ProcOrders, null),
      tab === 'suppliers' && React.createElement(ProcSuppliers, null),
      tab === 'prices' && React.createElement(ProcPrices, null),
      tab === 'inventory' && React.createElement(ProcInventory, null)
    )
  );
}

function ProcOrders() {
  const { PROCUREMENT } = window.CDX_DATA;
  const [showNew, setShowNew] = React.useState(false);
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '今月発注額', value: '5.3', unit: '億円', icon: 'package', color: 'var(--dept-08)', spark: [3.2, 4.1, 4.8, 5.0, 5.3] }),
      React.createElement(KPICard, { label: '発注件数', value: 42, unit: '件', icon: 'clipboard', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: '納期遵守率', value: 94.2, unit: '%', icon: 'check', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: 'コスト削減額', value: '820', unit: '万円', icon: 'trendDown', color: 'var(--cdx-success)' })
    ),
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 } },
      React.createElement(SectionHeader, { title: '発注一覧' }),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary', onClick: () => setShowNew(true) }, React.createElement(CDXIcon, { name: 'plus', size: 14 }), '新規発注')
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'id', header: '発注番号', accessor: r => r.id, sortable: true, width: '100px' },
          { key: 'item', header: '品目', accessor: r => r.item, sortable: true },
          { key: 'supplier', header: '発注先', accessor: r => r.supplier },
          { key: 'qty', header: '数量', accessor: r => r.qty, align: 'right' },
          { key: 'total', header: '金額', accessor: r => r.total, align: 'right', sortable: true },
          { key: 'delivery', header: '納期', accessor: r => r.delivery, sortable: true },
          { key: 'status', header: 'ステータス', render: r => React.createElement(StatusBadge, { type: r.status === 'delivered' ? 'safe' : r.status === 'ordered' ? 'info' : 'warning', label: r.status === 'delivered' ? '納品済' : r.status === 'ordered' ? '発注済' : '未発注' }) },
        ],
        data: PROCUREMENT.orders, pageSize: 10
      })
    ),
    React.createElement(CDXModal, { open: showNew, onClose: () => setShowNew(false), title: '新規発注', width: 600 },
      React.createElement(ProcOrderForm, { onClose: () => setShowNew(false) })
    )
  );
}

function ProcOrderForm({ onClose }) {
  const fs = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 };
  const ls = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' };
  return React.createElement('div', null,
    React.createElement('div', { style: fs },
      React.createElement('label', { style: ls }, '品目'),
      React.createElement('input', { className: 'cdx-input', placeholder: '資材名を入力' })
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } },
      React.createElement('div', { style: fs },
        React.createElement('label', { style: ls }, '発注先'),
        React.createElement('select', { className: 'cdx-input cdx-select' },
          React.createElement('option', null, '選択してください'),
          ...window.CDX_DATA.PROCUREMENT.suppliers.map(s => React.createElement('option', { key: s.name }, s.name))
        )
      ),
      React.createElement('div', { style: fs },
        React.createElement('label', { style: ls }, '数量'),
        React.createElement('input', { className: 'cdx-input', type: 'number', placeholder: '0' })
      )
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } },
      React.createElement('div', { style: fs },
        React.createElement('label', { style: ls }, '単価'),
        React.createElement('input', { className: 'cdx-input', type: 'number', placeholder: '¥0' })
      ),
      React.createElement('div', { style: fs },
        React.createElement('label', { style: ls }, '希望納期'),
        React.createElement('input', { className: 'cdx-input', type: 'date' })
      )
    ),
    React.createElement('div', { style: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 } },
      React.createElement('button', { className: 'cdx-btn cdx-btn-ghost', onClick: onClose }, 'キャンセル'),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary', onClick: () => { alert('発注を登録しました'); onClose(); } }, '発注登録')
    )
  );
}

function ProcSuppliers() {
  const { PROCUREMENT } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '協力会社・取引先一覧' }),
    React.createElement('div', { className: 'cdx-grid cdx-grid-2' },
      PROCUREMENT.suppliers.map((s, i) => React.createElement('div', { key: i, className: 'cdx-card' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 16, fontWeight: 700 } }, s.name),
            React.createElement('div', { style: { fontSize: 12, color: 'var(--text-muted)' } }, s.category)
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 4 } },
            ...Array.from({ length: 5 }, (_, j) => React.createElement('div', { key: j, style: { width: 12, height: 12 } },
              React.createElement('svg', { viewBox: '0 0 24 24', fill: j < Math.floor(s.rating) ? 'var(--cdx-accent)' : 'var(--border-color)', width: 12, height: 12 },
                React.createElement('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' })
              )
            )),
            React.createElement('span', { style: { fontSize: 12, fontWeight: 600, marginLeft: 4 } }, s.rating)
          )
        ),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 10, color: 'var(--text-muted)' } }, '取引回数'),
            React.createElement('div', { style: { fontSize: 18, fontWeight: 800, color: 'var(--dept-08)' } }, s.orders)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 10, color: 'var(--text-muted)' } }, '納期遵守率'),
            React.createElement('div', { style: { fontSize: 18, fontWeight: 800, color: s.reliability >= 95 ? 'var(--cdx-success)' : 'var(--cdx-accent)' } }, `${s.reliability}%`)
          )
        )
      ))
    )
  );
}

function ProcPrices() {
  const { PROCUREMENT } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '主要資材価格動向' }),
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        PROCUREMENT.priceIndex.map((p, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < PROCUREMENT.priceIndex.length - 1 ? '1px solid var(--border-color)' : 'none' } },
          React.createElement('span', { style: { fontSize: 14, fontWeight: 700, width: 140 } }, p.item),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontSize: 20, fontWeight: 800 } }, `¥${p.current.toLocaleString()}`),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, `前月: ¥${p.prev.toLocaleString()}`)
          ),
          React.createElement('span', { className: `cdx-kpi-delta ${p.change > 5 ? 'down' : 'up'}`, style: { fontSize: 14 } },
            React.createElement(CDXIcon, { name: 'trendUp', size: 14 }), `+${p.change}%`
          )
        ))
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: 'H形鋼 価格推移（円/t）' }),
      React.createElement(CDXLineChart, {
        data: [
          { label: '1月', value: 88000 }, { label: '2月', value: 89500 }, { label: '3月', value: 91000 },
          { label: '4月', value: 90500 }, { label: '5月', value: 98000 },
        ],
        width: 600, height: 220, xKey: 'label', yKeys: ['value'], area: true, colors: ['var(--cdx-danger)']
      })
    )
  );
}

function ProcInventory() {
  const inventory = [
    { item: 'H形鋼 H-300×150', stock: 45, unit: 't', location: '東京ヤード', min: 30 },
    { item: '生コン型枠用合板', stock: 280, unit: '枚', location: '千葉倉庫', min: 200 },
    { item: '鉄筋 D16', stock: 82, unit: 't', location: '東京ヤード', min: 50 },
    { item: '土木用シート', stock: 1200, unit: 'm2', location: '千葉倉庫', min: 2000 },
    { item: 'セメント', stock: 120, unit: 't', location: '横浜ヤード', min: 80 },
  ];
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '在庫管理' }),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'item', header: '品目', accessor: r => r.item, sortable: true },
          { key: 'stock', header: '在庫数', align: 'right', sortable: true, sortValue: r => r.stock, render: r => `${r.stock} ${r.unit}` },
          { key: 'location', header: '保管場所', accessor: r => r.location },
          { key: 'min', header: '発注点', align: 'right', render: r => `${r.min} ${r.unit}` },
          { key: 'alert', header: '状態', render: r => r.stock < r.min ? React.createElement(StatusBadge, { type: 'danger', label: '要発注' }) : React.createElement(StatusBadge, { type: 'safe', label: '適正' }) },
        ],
        data: inventory, pageSize: 10
      })
    )
  );
}

window.PageProcurement = PageProcurement;
