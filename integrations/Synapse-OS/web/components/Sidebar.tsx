"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Brain,
  Globe,
  ScrollText,
  Shield,
  LogOut,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { clsx } from "clsx";
import { useLanguage, type Lang } from "@/lib/i18n";

interface SidebarUser {
  username: string;
  tenant_id: string;
  role: string;
}

interface SidebarProps {
  user?: SidebarUser | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const navItems = [
    { href: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/issues", label: t.nav.issues, icon: FileText },
    { href: "/approvals", label: t.nav.approvals, icon: CheckSquare },
    { href: "/ai-governance", label: t.nav.aiGovernance, icon: Brain },
    { href: "/federation", label: t.nav.federation, icon: Globe },
    { href: "/audit", label: t.nav.auditLog, icon: ScrollText },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isDark = resolvedTheme === "dark";

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <span className="font-semibold text-sm text-gray-900 dark:text-white">
          Synapse OS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href as Route}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === href
                ? "bg-blue-50 dark:bg-blue-600 text-blue-700 dark:text-white font-medium"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Theme + Language toggles */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-1">
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title={isDark ? t.sidebar.lightMode : t.sidebar.darkMode}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
          <span className="truncate">
            {isDark ? t.sidebar.lightMode : t.sidebar.darkMode}
          </span>
        </button>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={() => setLang(lang === "ja" ? "en" : ("ja" as Lang))}
          title={lang === "ja" ? "Switch to English" : "日本語に切り替え"}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span
            className={clsx(
              lang === "ja"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500"
            )}
          >
            JP
          </span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span
            className={clsx(
              lang === "en"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500"
            )}
          >
            EN
          </span>
        </button>
      </div>

      {/* User panel */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        {user ? (
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-600 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                  {user.tenant_id}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={t.sidebar.signOut}
              className="shrink-0 p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Tenant: demo-corp
          </p>
        )}
      </div>
    </aside>
  );
}
