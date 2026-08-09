'use client';

import * as React from 'react';
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface HeaderProps {
  userName?: string;
  notificationCount?: number;
}

export function Header({
  userName = 'ゲストユーザー',
  notificationCount = 0,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex flex-col leading-tight">
        <h1 className="text-base font-semibold text-foreground">
          建設・土木統合マネジメントシステム
        </h1>
        <p className="text-xs text-muted-foreground">
          Civil Construction IMS
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="通知"
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        <div ref={menuRef} className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </span>
            <span className="hidden text-sm font-medium sm:inline">
              {userName}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          <div
            role="menu"
            className={cn(
              'absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
              menuOpen ? 'block' : 'hidden',
            )}
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <User className="h-4 w-4" />
              プロフィール
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="h-4 w-4" />
              設定
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
