'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  HardHat,
  FileText,
  CheckCircle2,
  Leaf,
  ShieldCheck,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  BarChart3,
  Lock,
  Shield,
  SettingsIcon,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
  { label: '工事案件', href: '/projects', icon: HardHat },
  { label: '文書管理', href: '/documents', icon: FileText },
  { label: '品質管理', href: '/quality', icon: CheckCircle2 },
  { label: '環境管理', href: '/environment', icon: Leaf },
  { label: '安全衛生', href: '/safety', icon: ShieldCheck },
  { label: '資産管理', href: '/assets', icon: Boxes },
  { label: 'BIM情報', href: '/bim', icon: Building2 },
  { label: '内部監査', href: '/audits', icon: ClipboardCheck },
  { label: '是正処置', href: '/corrective-actions', icon: ClipboardList },
  { label: '分析・KPI', href: '/analytics', icon: BarChart3 },
  { label: 'ISMS', href: '/isms', icon: Lock },
  { label: 'BCP', href: '/bcp', icon: Shield },
  { label: '設定', href: '/settings', icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Building2 className="h-6 w-6 text-primary" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-foreground">建設・土木 IMS</span>
          <span className="text-[10px] text-muted-foreground">統合マネジメント</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 text-[10px] text-muted-foreground">
        ISO 9001 / 14001 / 45001 / 55001 / 19650 / 27001
      </div>
    </aside>
  );
}
