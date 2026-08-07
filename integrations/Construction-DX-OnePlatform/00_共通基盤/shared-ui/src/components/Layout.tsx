import { forwardRef, useState, type ReactNode, type HTMLAttributes } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '../utils/cn';

export interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  /** サイドバーに表示する要素 (ナビゲーション等) */
  sidebar?: ReactNode;
  /** ヘッダーに表示する要素 (ユーザーメニュー等) */
  header?: ReactNode;
  /** ロゴ枠に表示する要素 */
  logo?: ReactNode;
  /** メインコンテンツ。React Router の `<Outlet />` を渡すことを想定 */
  children?: ReactNode;
  /** サイドバーの初期折りたたみ状態 */
  defaultCollapsed?: boolean;
  /** サイドバー幅 (px) */
  sidebarWidth?: number;
}

/**
 * 建設DX 共通レイアウト。
 * - 左サイドバー (折りたたみ可能、md 未満では完全に非表示にしてオーバーレイ表示)
 * - 上部ヘッダー
 * - メイン領域 (`children` または `<Outlet />`)
 */
export const Layout = forwardRef<HTMLDivElement, LayoutProps>(
  (
    {
      sidebar,
      header,
      logo,
      children,
      defaultCollapsed = false,
      sidebarWidth = 240,
      className,
      ...rest
    },
    ref,
  ) => {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
      <div
        ref={ref}
        className={cn('min-h-screen flex bg-slate-50 text-slate-900', className)}
        {...rest}
      >
        {/* サイドバー */}
        <aside
          role="navigation"
          aria-label="メインナビゲーション"
          className={cn(
            'hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-200',
            collapsed ? 'w-16' : '',
          )}
          style={!collapsed ? { width: sidebarWidth } : undefined}
        >
          <div className="h-14 flex items-center px-4 border-b border-slate-200 shrink-0">
            <div className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
              {logo ?? (
                <span className="font-bold text-primary truncate">
                  {collapsed ? 'CDX' : 'Construction DX'}
                </span>
              )}
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-3">{sidebar}</nav>
          <button
            type="button"
            aria-label={collapsed ? 'サイドバーを開く' : 'サイドバーを閉じる'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((v) => !v)}
            className="h-10 border-t border-slate-200 text-slate-500 hover:bg-slate-100 text-sm"
          >
            {collapsed ? '›' : '‹ 折りたたむ'}
          </button>
        </aside>

        {/* モバイル用オーバーレイサイドバー */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside
              className="relative bg-white w-64 max-w-[80%] flex flex-col shadow-cdx-lg"
              role="navigation"
              aria-label="メインナビゲーション"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
                <div className="font-bold text-primary">{logo ?? 'Construction DX'}</div>
                <button
                  type="button"
                  aria-label="閉じる"
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-3">{sidebar}</nav>
            </aside>
          </div>
        )}

        {/* メイン領域 */}
        <div className="flex-1 flex flex-col min-w-0">
          <header
            role="banner"
            className="h-14 bg-white border-b border-slate-200 flex items-center px-3 sm:px-4 gap-3 shrink-0"
          >
            <button
              type="button"
              aria-label="メニューを開く"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <div className="flex-1 min-w-0">{header}</div>
          </header>
          <main role="main" className="flex-1 overflow-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    );
  },
);
Layout.displayName = 'Layout';
