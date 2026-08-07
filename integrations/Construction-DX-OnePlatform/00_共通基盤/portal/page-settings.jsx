/* Construction DX One Platform — System Settings Page */

function PageSettings() {
  const [tab, setTab] = React.useState('users');
  return React.createElement('div', { className: 'cdx-fade-in' },
    React.createElement(CDXTabs, {
      tabs: [{ id: 'users', label: 'ユーザー管理' }, { id: 'integrations', label: '外部連携' }, { id: 'system', label: 'システム' }, { id: 'backup', label: 'バックアップ' }],
      active: tab, onChange: setTab
    }),
    React.createElement('div', { style: { marginTop: 20 } },
      tab === 'users' && React.createElement(SettingsUsers, null),
      tab === 'integrations' && React.createElement(SettingsIntegrations, null),
      tab === 'system' && React.createElement(SettingsSystem, null),
      tab === 'backup' && React.createElement(SettingsBackup, null)
    )
  );
}

function SettingsUsers() {
  const { SETTINGS } = window.CDX_DATA;
  const [showNew, setShowNew] = React.useState(false);
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: '登録ユーザー', value: SETTINGS.users.length, unit: '名', icon: 'users', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: 'アクティブ', value: SETTINGS.users.filter(u => u.status === 'active').length, unit: '名', icon: 'check', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '無効', value: SETTINGS.users.filter(u => u.status === 'disabled').length, unit: '名', icon: 'x', color: 'var(--text-muted)' }),
      React.createElement(KPICard, { label: 'ロール数', value: SETTINGS.roles.length, unit: '種類', icon: 'shield', color: 'var(--dept-10)' })
    ),
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 } },
      React.createElement(SectionHeader, { title: 'ユーザー一覧' }),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary', onClick: () => setShowNew(true) }, React.createElement(CDXIcon, { name: 'plus', size: 14 }), 'ユーザー追加')
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(DataTableCDX, {
        columns: [
          { key: 'id', header: 'ID', accessor: r => r.id, width: '60px', sortable: true },
          { key: 'name', header: '名前', accessor: r => r.name, sortable: true },
          { key: 'email', header: 'メール', accessor: r => r.email },
          { key: 'role', header: 'ロール', render: r => React.createElement(StatusBadge, { type: r.role === 'システム管理者' ? 'danger' : r.role === 'IT管理者' ? 'warning' : 'info', label: r.role }) },
          { key: 'dept', header: '部門', accessor: r => r.dept },
          { key: 'lastLogin', header: '最終ログイン', accessor: r => r.lastLogin, sortable: true },
          { key: 'status', header: '状態', render: r => React.createElement(StatusBadge, { type: r.status === 'active' ? 'safe' : 'neutral', label: r.status === 'active' ? '有効' : '無効' }) },
          { key: 'actions', header: '操作', render: r => React.createElement('div', { style: { display: 'flex', gap: 4 } },
            React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', onClick: () => alert(`${r.name} の編集画面`) }, '編集'),
            r.status === 'active' && React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', style: { color: 'var(--cdx-danger)' }, onClick: () => alert(`${r.name} を無効化しますか？`) }, '無効化')
          )},
        ],
        data: SETTINGS.users, pageSize: 10
      })
    ),
    React.createElement(CDXModal, { open: showNew, onClose: () => setShowNew(false), title: '新規ユーザー追加', width: 600 },
      React.createElement(UserForm, { onClose: () => setShowNew(false) })
    )
  );
}

function UserForm({ onClose }) {
  const { SETTINGS } = window.CDX_DATA;
  const fs = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 };
  const ls = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' };
  return React.createElement('div', null,
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } },
      React.createElement('div', { style: fs }, React.createElement('label', { style: ls }, '氏名'), React.createElement('input', { className: 'cdx-input', placeholder: '山田太郎' })),
      React.createElement('div', { style: fs }, React.createElement('label', { style: ls }, 'メールアドレス'), React.createElement('input', { className: 'cdx-input', type: 'email', placeholder: 'user@mirai-const.co.jp' }))
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } },
      React.createElement('div', { style: fs },
        React.createElement('label', { style: ls }, 'ロール'),
        React.createElement('select', { className: 'cdx-input cdx-select' }, ...SETTINGS.roles.map(r => React.createElement('option', { key: r }, r)))
      ),
      React.createElement('div', { style: fs },
        React.createElement('label', { style: ls }, '部門'),
        React.createElement('select', { className: 'cdx-input cdx-select' },
          ...['IT-DX部門', '施工本部', '営業本部', '安全品質環境', '管理本部', '購買部', '技術本部', '船舶事業部'].map(d => React.createElement('option', { key: d }, d))
        )
      )
    ),
    React.createElement('div', { style: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 } },
      React.createElement('button', { className: 'cdx-btn cdx-btn-ghost', onClick: onClose }, 'キャンセル'),
      React.createElement('button', { className: 'cdx-btn cdx-btn-primary', onClick: () => { alert('ユーザーを追加しました'); onClose(); } }, '追加')
    )
  );
}

function SettingsIntegrations() {
  const { SETTINGS } = window.CDX_DATA;
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: '外部システム連携' }),
    React.createElement('div', { className: 'cdx-grid cdx-grid-3' },
      SETTINGS.integrations.map((intg, i) => React.createElement('div', { key: i, className: 'cdx-card' },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } },
          React.createElement('div', { style: { width: 40, height: 40, borderRadius: 10, background: 'var(--cdx-secondary)' + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
            React.createElement(CDXIcon, { name: 'link', size: 18, color: 'var(--cdx-secondary)' })
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 14, fontWeight: 700 } }, intg.name),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, `最終同期: ${intg.lastSync}`)
          )
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement(StatusBadge, { type: intg.status === 'connected' ? 'safe' : 'danger', label: intg.status === 'connected' ? '接続中' : '切断' }),
          React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', onClick: () => alert(`${intg.name} の再同期を開始します`) },
            React.createElement(CDXIcon, { name: 'refresh', size: 12 }), '再同期'
          )
        )
      ))
    )
  );
}

function SettingsSystem() {
  const configs = [
    { category: 'セキュリティ', items: [
      { name: 'セッションタイムアウト', value: '30分', editable: true },
      { name: 'パスワードポリシー', value: '英数記号12文字以上', editable: true },
      { name: '多要素認証', value: '必須', editable: true },
      { name: 'IPアドレス制限', value: '有効（5ルール）', editable: true },
    ]},
    { category: 'メール通知', items: [
      { name: 'アラート通知', value: '有効', editable: true },
      { name: '日次レポート', value: '有効（毎日 08:00）', editable: true },
      { name: '週次サマリー', value: '有効（月曜 09:00）', editable: true },
    ]},
    { category: 'データ管理', items: [
      { name: '監査ログ保持期間', value: '365日', editable: true },
      { name: 'ファイル最大サイズ', value: '100 MB', editable: true },
      { name: 'API Rate Limit', value: '1,000 req/min', editable: true },
    ]},
  ];
  return React.createElement(React.Fragment, null,
    React.createElement(SectionHeader, { title: 'システム設定' }),
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
      configs.map((cat, ci) => React.createElement('div', { key: ci, className: 'cdx-card' },
        React.createElement('div', { style: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' } }, cat.category),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 0 } },
          cat.items.map((item, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < cat.items.length - 1 ? '1px solid var(--border-color)' : 'none' } },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 13, fontWeight: 600 } }, item.name),
              React.createElement('div', { style: { fontSize: 12, color: 'var(--text-muted)' } }, item.value)
            ),
            React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', onClick: () => alert(`${item.name} の設定を変更します`) }, '変更')
          ))
        )
      ))
    )
  );
}

function SettingsBackup() {
  const { SETTINGS } = window.CDX_DATA;
  const b = SETTINGS.backup;
  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'cdx-grid cdx-grid-4', style: { marginBottom: 20 } },
      React.createElement(KPICard, { label: 'バックアップサイズ', value: b.size, icon: 'database', color: 'var(--cdx-secondary)' }),
      React.createElement(KPICard, { label: '保持期間', value: b.retention, icon: 'bookmark', color: 'var(--dept-07)' }),
      React.createElement(KPICard, { label: '最終フルバックアップ', value: b.lastFull.split(' ')[1], icon: 'check', color: 'var(--cdx-success)' }),
      React.createElement(KPICard, { label: '次回フルバックアップ', value: b.nextFull.split(' ')[1], icon: 'refresh', color: 'var(--cdx-accent)' })
    ),
    React.createElement('div', { className: 'cdx-card', style: { marginBottom: 20 } },
      React.createElement(SectionHeader, { title: 'バックアップスケジュール' }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        [
          { type: 'フルバックアップ', schedule: '毎日 03:00', lastRun: b.lastFull, status: 'success', size: '847 GB' },
          { type: '増分バックアップ', schedule: '毎3時間', lastRun: b.lastIncr, status: 'success', size: '12.4 GB' },
          { type: 'トランザクションログ', schedule: '毎15分', lastRun: '2026-05-23 10:30', status: 'success', size: '2.1 GB' },
        ].map((bk, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none' } },
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontSize: 14, fontWeight: 600 } }, bk.type),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, `スケジュール: ${bk.schedule}`)
          ),
          React.createElement('div', { style: { textAlign: 'right' } },
            React.createElement('div', { style: { fontSize: 12, fontWeight: 500 } }, bk.lastRun),
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, bk.size)
          ),
          React.createElement(StatusBadge, { type: 'safe', label: '成功' }),
          React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', onClick: () => alert(`${bk.type} を手動実行します`) }, '実行')
        ))
      )
    ),
    React.createElement('div', { className: 'cdx-card' },
      React.createElement(SectionHeader, { title: 'リストアポイント' }),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        ['2026-05-23 03:00', '2026-05-22 03:00', '2026-05-21 03:00', '2026-05-20 03:00'].map((rp, i) =>
          React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              React.createElement(CDXIcon, { name: 'database', size: 14, color: 'var(--cdx-secondary)' }),
              React.createElement('span', { style: { fontSize: 13 } }, rp)
            ),
            React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs' }, 'リストア')
          )
        )
      )
    )
  );
}

window.PageSettings = PageSettings;
