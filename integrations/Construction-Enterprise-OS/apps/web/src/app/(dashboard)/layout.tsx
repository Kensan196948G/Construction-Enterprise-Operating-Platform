"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  HardHat,
  Users,
  Map,
  Brain,
  Cpu,
  BarChart3,
  Shield,
  GitBranch,
  Bot,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  Bell,
  Moon,
  Sun,
  UserCircle,
  Search,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface NavPage {
  label: string;
  href: string;
  badge?: string;
}

interface NavSection {
  id: string;
  label: string;
  roles?: string[];
  pages: NavPage[];
  defaultOpen?: boolean;
}

interface NavCategory {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sections: NavSection[];
}

// ────────────────────────────────────────────────────────────────────────────
// Role definitions (matching design)
// ────────────────────────────────────────────────────────────────────────────

const ROLES = {
  "": { label: "全表示（管理者）", color: "#7c3aed" },
  admin: { label: "IT管理者", color: "#7c3aed" },
  field: { label: "現場監督", color: "#f97316" },
  exec: { label: "経営層", color: "#1a56db" },
  partner: { label: "協力会社", color: "#16a34a" },
  safety: { label: "安全管理者", color: "#dc2626" },
  maintain: { label: "維持管理", color: "#92400e" },
} as const;

type RoleKey = keyof typeof ROLES;

// ────────────────────────────────────────────────────────────────────────────
// Menu structure (3-level: category → section → page)
// ────────────────────────────────────────────────────────────────────────────

const MENU_STRUCTURE: NavCategory[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "ダッシュボード",
    sections: [
      {
        id: "dash-main",
        label: "統合ダッシュボード",
        defaultOpen: true,
        pages: [
          { label: "全社統合", href: "/dashboard" },
          { label: "現場ダッシュボード", href: "/dashboard/field" },
          { label: "経営ダッシュボード", href: "/dashboard/exec" },
          { label: "AI分析", href: "/dashboard/ai" },
          { label: "KPI/アラート", href: "/dashboard/kpi", badge: "3" },
        ],
      },
    ],
  },
  {
    id: "common",
    icon: Building2,
    label: "共通基盤",
    sections: [
      {
        id: "auth",
        label: "認証管理",
        roles: ["admin"],
        pages: [
          { label: "Entra ID", href: "/design/common/auth-entra" },
          { label: "AD連携", href: "/design/common/auth-ad" },
          { label: "MFA", href: "/design/common/auth-mfa" },
          { label: "SSO", href: "/design/common/auth-sso" },
        ],
      },
      {
        id: "user-mgmt",
        label: "ユーザー管理",
        roles: ["admin"],
        pages: [
          { label: "ユーザー一覧", href: "/design/common/users" },
          { label: "権限管理", href: "/design/common/roles" },
        ],
      },
      {
        id: "api-mgmt",
        label: "API管理",
        roles: ["admin"],
        pages: [
          { label: "API一覧", href: "/design/common/api" },
          { label: "APIログ", href: "/design/common/api-logs" },
        ],
      },
      {
        id: "master",
        label: "マスタ管理",
        roles: ["admin"],
        pages: [
          { label: "マスタデータ", href: "/design/common/master" },
          { label: "システム設定", href: "/design/common/config" },
        ],
      },
    ],
  },
  {
    id: "documents",
    icon: FileText,
    label: "文書・図面管理",
    sections: [
      {
        id: "doc-files",
        label: "ファイル管理",
        defaultOpen: true,
        pages: [
          { label: "PDF管理", href: "/design/documents/pdf" },
          { label: "CAD図面", href: "/design/documents/cad" },
          { label: "BIM/CIM", href: "/design/documents/bim" },
          { label: "写真管理", href: "/design/documents/photo" },
          { label: "動画管理", href: "/design/documents/video" },
        ],
      },
      {
        id: "doc-tools",
        label: "ツール",
        pages: [
          { label: "OCR", href: "/design/documents/ocr" },
          { label: "電子黒板", href: "/design/documents/board" },
          { label: "電子納品", href: "/design/documents/deliver", badge: "2" },
          { label: "バージョン管理", href: "/design/documents/version" },
          { label: "AI文書検索", href: "/design/documents/ai-search" },
        ],
      },
    ],
  },
  {
    id: "field-dx",
    icon: HardHat,
    label: "現場DX",
    sections: [
      {
        id: "field-proj",
        label: "工事管理",
        defaultOpen: true,
        roles: ["field", "exec", "safety"],
        pages: [
          { label: "工事一覧", href: "/design/field/projects" },
          { label: "現場進捗", href: "/design/field/progress" },
          { label: "工程管理", href: "/design/field/schedule" },
          { label: "作業日報", href: "/design/field/daily", badge: "5" },
        ],
      },
      {
        id: "field-work",
        label: "現場作業",
        roles: ["field", "safety"],
        pages: [
          { label: "現場写真", href: "/design/field/photos" },
          { label: "出来形管理", href: "/design/field/measure" },
          { label: "安全管理", href: "/design/field/safety", badge: "!" },
          { label: "KY活動", href: "/design/field/ky" },
        ],
      },
      {
        id: "field-resource",
        label: "リソース管理",
        roles: ["field"],
        pages: [
          { label: "重機管理", href: "/design/field/equipment" },
          { label: "作業員管理", href: "/design/field/workers" },
          { label: "現場ライブビュー", href: "/design/field/live" },
        ],
      },
    ],
  },
  {
    id: "partner",
    icon: Users,
    label: "協力会社連携",
    sections: [
      {
        id: "partner-main",
        label: "協力会社管理",
        roles: ["field", "partner"],
        pages: [
          { label: "協力会社一覧", href: "/design/partner/list" },
          { label: "入退場管理", href: "/design/partner/entry" },
          { label: "提出書類", href: "/design/partner/docs", badge: "4" },
          { label: "安全教育", href: "/design/partner/education" },
          { label: "契約管理", href: "/design/partner/contract" },
          { label: "請求管理", href: "/design/partner/invoice" },
        ],
      },
    ],
  },
  {
    id: "gis",
    icon: Map,
    label: "GIS/地図",
    sections: [
      {
        id: "gis-map",
        label: "地図情報",
        pages: [
          { label: "工事位置", href: "/design/gis/projects" },
          { label: "海域マップ", href: "/design/gis/ocean" },
          { label: "災害情報", href: "/design/gis/disaster" },
          { label: "ドローン地図", href: "/design/gis/drone" },
          { label: "点群データ", href: "/design/gis/pointcloud" },
          { label: "ハザードマップ", href: "/design/gis/hazard" },
          { label: "リアルタイム位置", href: "/design/gis/realtime" },
        ],
      },
    ],
  },
  {
    id: "ai",
    icon: Brain,
    label: "AI・分析基盤",
    sections: [
      {
        id: "ai-tools",
        label: "AIツール",
        pages: [
          { label: "AIチャット", href: "/design/ai/chat" },
          { label: "ナレッジAI", href: "/design/ai/knowledge" },
          { label: "OCR AI", href: "/design/ai/ocr" },
          { label: "画像解析AI", href: "/design/ai/vision" },
          { label: "予測AI", href: "/design/ai/predict" },
          { label: "異常検知AI", href: "/design/ai/anomaly" },
          { label: "AI Agent", href: "/design/ai/agent" },
        ],
      },
    ],
  },
  {
    id: "iot",
    icon: Cpu,
    label: "IoT・リアルタイム監視",
    sections: [
      {
        id: "iot-monitor",
        label: "監視",
        pages: [
          { label: "センサ一覧", href: "/design/iot/sensors" },
          { label: "気象情報", href: "/design/iot/weather" },
          { label: "波浪監視", href: "/design/iot/wave" },
          { label: "水位監視", href: "/design/iot/water" },
          { label: "IoT Gateway", href: "/design/iot/gateway" },
          { label: "Edge AI", href: "/design/iot/edge" },
          { label: "アラート管理", href: "/design/iot/alerts", badge: "3" },
          { label: "リアルタイム監視", href: "/design/iot/realtime" },
        ],
      },
    ],
  },
  {
    id: "erp",
    icon: BarChart3,
    label: "ERP・経営管理",
    sections: [
      {
        id: "erp-finance",
        label: "財務管理",
        roles: ["exec"],
        pages: [
          { label: "原価管理", href: "/design/erp/cost" },
          { label: "予算管理", href: "/design/erp/budget" },
          { label: "契約管理", href: "/design/erp/contract" },
          { label: "購買管理", href: "/design/erp/purchase" },
          { label: "売上管理", href: "/design/erp/sales" },
        ],
      },
      {
        id: "erp-ops",
        label: "業務管理",
        roles: ["exec"],
        pages: [
          { label: "労務管理", href: "/design/erp/labor" },
          { label: "在庫管理", href: "/design/erp/stock" },
          { label: "工事台帳", href: "/design/erp/ledger" },
          { label: "BIレポート", href: "/design/erp/bi" },
        ],
      },
    ],
  },
  {
    id: "security",
    icon: Shield,
    label: "セキュリティ・監査",
    sections: [
      {
        id: "sec-monitor",
        label: "監視",
        roles: ["admin"],
        pages: [
          { label: "SIEM", href: "/design/security/siem" },
          { label: "SOC", href: "/design/security/soc" },
          { label: "VPN監視", href: "/design/security/vpn" },
          { label: "EDR", href: "/design/security/edr" },
          { label: "OT監視", href: "/design/security/ot" },
          { label: "インシデント", href: "/design/security/incident" },
          { label: "監査レポート", href: "/design/security/audit" },
        ],
      },
    ],
  },
  {
    id: "workflow",
    icon: GitBranch,
    label: "ワークフロー",
    sections: [
      {
        id: "wf-process",
        label: "承認プロセス",
        pages: [
          { label: "承認一覧", href: "/design/workflow/approval", badge: "5" },
          { label: "稟議", href: "/design/workflow/ringi" },
          { label: "作業許可", href: "/design/workflow/permit" },
          { label: "電子決裁", href: "/design/workflow/esign" },
          { label: "変更管理", href: "/design/workflow/change" },
        ],
      },
    ],
  },
  {
    id: "robotics",
    icon: Bot,
    label: "自動化・ロボティクス",
    sections: [
      {
        id: "robo-ops",
        label: "ロボティクス",
        pages: [
          { label: "自動施工", href: "/design/robotics/auto" },
          { label: "ドローン", href: "/design/robotics/drone" },
          { label: "ROV", href: "/design/robotics/rov" },
          { label: "デジタルツイン", href: "/design/robotics/twin" },
        ],
      },
    ],
  },
  {
    id: "system",
    icon: Settings,
    label: "システム管理",
    sections: [
      {
        id: "sys-ops",
        label: "運用",
        roles: ["admin"],
        pages: [
          { label: "サーバ監視", href: "/design/system/server" },
          { label: "DB管理", href: "/design/system/db" },
          { label: "バックアップ", href: "/design/system/backup" },
          { label: "API状態", href: "/design/system/api-status" },
          { label: "DevOps/CI-CD", href: "/design/system/devops" },
        ],
      },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// CSS variables for dark / light mode
// ────────────────────────────────────────────────────────────────────────────

const LIGHT_VARS: Record<string, string> = {
  "--bg": "#f8fafc",
  "--bg-page": "#f8fafc",
  "--bg-card": "#ffffff",
  "--bg-card-hover": "#f8fafc",
  "--bg-subtle": "#f8fafc",
  "--bg-input": "#f8fafc",
  "--border": "#e2e8f0",
  "--border-light": "#f1f5f9",
  "--text": "#0f172a",
  "--text-secondary": "#374151",
  "--text-muted": "#64748b",
  "--text-heading": "#0f172a",
  "--accent": "#1a56db",
  "--accent-light": "#eff6ff",
  "--shadow": "rgba(0,0,0,0.08)",
  "--sidebar-bg": "#0f172a",
  "--sidebar-border": "rgba(148,163,184,0.12)",
  "--header-bg": "#ffffff",
};

const DARK_VARS: Record<string, string> = {
  "--bg": "#0f172a",
  "--bg-page": "#0f172a",
  "--bg-card": "#1e293b",
  "--bg-card-hover": "#273549",
  "--bg-subtle": "#1e293b",
  "--bg-input": "#1e293b",
  "--border": "#334155",
  "--border-light": "#1e293b",
  "--text": "#e2e8f0",
  "--text-secondary": "#cbd5e1",
  "--text-muted": "#94a3b8",
  "--text-heading": "#f1f5f9",
  "--accent": "#3b82f6",
  "--accent-light": "#1e3a5f",
  "--shadow": "rgba(0,0,0,0.3)",
  "--sidebar-bg": "#020617",
  "--sidebar-border": "rgba(148,163,184,0.08)",
  "--header-bg": "#1e293b",
};

function applyTheme(dark: boolean) {
  const vars = dark ? DARK_VARS : LIGHT_VARS;
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

// Header notifications (faithful to Claude Design app.jsx AppHeader)
const NOTIFS: { title: string; desc: string; time: string; read: boolean }[] = [
  {
    title: "承認依頼",
    desc: "施工計画書の承認依頼が届いています",
    time: "5分前",
    read: false,
  },
  {
    title: "IoTアラート",
    desc: "風速計#3が警告値を超過",
    time: "12分前",
    read: false,
  },
  {
    title: "文書更新",
    desc: "構造図7Fが更新されました",
    time: "1時間前",
    read: true,
  },
  {
    title: "AI通知",
    desc: "品川タワーの工程遅延リスクを検知",
    time: "2時間前",
    read: true,
  },
];

// Derive a breadcrumb (category › page) from the current pathname using the
// existing MENU_STRUCTURE, so the header matches the Claude Design AppHeader.
function getBreadcrumb(pathname: string): { category: string; label: string } {
  for (const cat of MENU_STRUCTURE) {
    for (const sec of cat.sections) {
      for (const page of sec.pages) {
        if (pathname === page.href || pathname.startsWith(page.href + "/")) {
          return { category: cat.label, label: page.label };
        }
      }
    }
  }
  return { category: "ダッシュボード", label: "" };
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleKey>("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  // Track which sections are expanded: set of section ids
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const defaults = new Set<string>();
    MENU_STRUCTURE.forEach((cat) =>
      cat.sections.forEach((sec) => {
        if (sec.defaultOpen) defaults.add(sec.id);
      }),
    );
    return defaults;
  });
  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(["dashboard"]),
  );

  const { user, token, logout, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Theme is a pure side effect of `darkMode` — keep DOM in sync via effect so
  // StrictMode's double-invoked render/updater never flips the CSS vars twice.
  useEffect(() => {
    applyTheme(darkMode);
  }, [darkMode]);

  // Auth check disabled — direct dashboard access without login
  // useEffect(() => {
  //   if (token === null && typeof window !== "undefined") {
  //     const stored = localStorage.getItem("auth_token");
  //     if (!stored) {
  //       router.replace("/login");
  //     }
  //   }
  // }, [token, router]);

  // Auto-expand the category + section containing the current route
  useEffect(() => {
    MENU_STRUCTURE.forEach((cat) => {
      cat.sections.forEach((sec) => {
        if (
          sec.pages.some(
            (p) => pathname === p.href || pathname.startsWith(p.href + "/"),
          )
        ) {
          setExpandedCategories((prev) => new Set(prev).add(cat.id));
          setExpandedSections((prev) => new Set(prev).add(sec.id));
        }
      });
    });
  }, [pathname]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Filter sections based on current role
  const isSectionVisible = (sec: NavSection) => {
    if (!currentRole) return true;
    if (currentRole === "admin") return true;
    if (!sec.roles || sec.roles.length === 0) return true;
    return sec.roles.includes(currentRole);
  };

  const displayName = user?.name ?? user?.email ?? "田中 健一";
  const initials = displayName
    .split(/[\s　]/)
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const crumb = getBreadcrumb(pathname);
  const unreadCount = NOTIFS.filter((n) => !n.read).length;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-page, #f8fafc)" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--sidebar-bg, #0f172a)",
          borderRight:
            "1px solid var(--sidebar-border, rgba(148,163,184,0.12))",
        }}
      >
        {/* Sidebar header */}
        <div
          className="flex h-16 items-center gap-2 px-4 flex-shrink-0"
          style={{
            borderBottom:
              "1px solid var(--sidebar-border, rgba(148,163,184,0.12))",
          }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-white text-xs font-bold">CE</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold truncate">
              Construction-OS
            </p>
            <p className="text-slate-400 text-xs truncate">
              Enterprise Platform
            </p>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
            aria-label="サイドバーを閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation — 3-level accordion */}
        <nav className="flex-1 overflow-y-auto py-3">
          {MENU_STRUCTURE.map((cat) => {
            const CategoryIcon = cat.icon;
            const isCatOpen = expandedCategories.has(cat.id);
            // Check if any section in this category is visible for current role
            const hasVisibleSections = cat.sections.some(isSectionVisible);
            if (!hasVisibleSections) return null;

            return (
              <div key={cat.id} className="mb-1">
                {/* Category row */}
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left group"
                  onClick={() => toggleCategory(cat.id)}
                >
                  <CategoryIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-200 flex-shrink-0" />
                  <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200">
                    {cat.label}
                  </span>
                  <ChevronRight
                    className={`h-3 w-3 text-slate-500 transition-transform ${
                      isCatOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {/* Sections */}
                {isCatOpen && (
                  <div className="ml-2">
                    {cat.sections.map((sec) => {
                      if (!isSectionVisible(sec)) return null;
                      const isSecOpen = expandedSections.has(sec.id);

                      return (
                        <div key={sec.id}>
                          {/* Section header */}
                          <button
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left group"
                            onClick={() => toggleSection(sec.id)}
                          >
                            <span className="flex-1 text-xs text-slate-500 group-hover:text-slate-300">
                              {sec.label}
                            </span>
                            <ChevronDown
                              className={`h-3 w-3 text-slate-600 transition-transform ${
                                isSecOpen ? "" : "-rotate-90"
                              }`}
                            />
                          </button>

                          {/* Pages */}
                          {isSecOpen && (
                            <ul className="ml-2 mb-1">
                              {sec.pages.map((page) => {
                                const isActive =
                                  pathname === page.href ||
                                  (page.href !== "/" &&
                                    page.href !== "/dashboard" &&
                                    pathname.startsWith(page.href + "/"));
                                return (
                                  <li key={page.href}>
                                    <Link
                                      href={page.href}
                                      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                        isActive
                                          ? "bg-blue-600/20 text-blue-400"
                                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                      }`}
                                      onClick={() => setSidebarOpen(false)}
                                    >
                                      <span className="flex-1">
                                        {page.label}
                                      </span>
                                      {page.badge && (
                                        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                          {page.badge}
                                        </span>
                                      )}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar footer — user info */}
        <div
          className="flex-shrink-0 p-3"
          style={{
            borderTop:
              "1px solid var(--sidebar-border, rgba(148,163,184,0.12))",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-500">
                {user?.role ?? "現場監督"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header
          className="flex h-14 items-center gap-3 px-4 lg:px-5 flex-shrink-0"
          style={{
            background: "var(--header-bg, #ffffff)",
            borderBottom: "1px solid var(--border, #e2e8f0)",
          }}
        >
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setSidebarOpen(true)}
            aria-label="メニューを開く"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb (category › page) */}
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className="hidden whitespace-nowrap text-xs sm:inline"
              style={{ color: "var(--text-muted, #64748b)" }}
            >
              {crumb.category}
            </span>
            {crumb.label && crumb.label !== crumb.category && (
              <>
                <ChevronRight
                  className="hidden h-3 w-3 flex-shrink-0 sm:block"
                  style={{ color: "var(--text-muted, #64748b)" }}
                />
                <span
                  className="truncate text-sm font-semibold"
                  style={{ color: "var(--text-heading, #0f172a)" }}
                >
                  {crumb.label}
                </span>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* 統合検索 */}
          <div
            className="hidden w-60 items-center gap-2 rounded-lg border px-3 py-1.5 md:flex"
            style={{
              background: "var(--bg-input, #f8fafc)",
              borderColor: "var(--border, #e2e8f0)",
            }}
          >
            <Search
              className="h-3.5 w-3.5 flex-shrink-0"
              style={{ color: "var(--text-muted, #64748b)" }}
            />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="統合検索..."
              className="flex-1 border-none bg-transparent text-xs outline-none"
              style={{ color: "var(--text, #0f172a)" }}
            />
            <kbd
              className="rounded px-1.5 font-mono text-[10px]"
              style={{
                color: "var(--text-muted, #64748b)",
                background: "var(--border, #e2e8f0)",
              }}
            >
              ⌘K
            </kbd>
          </div>

          {/* Role selector */}
          <div className="relative">
            <button
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
              style={{
                borderColor: "var(--border, #e2e8f0)",
                color: "var(--text, #0f172a)",
              }}
              onClick={() => setRoleDropdownOpen((v) => !v)}
            >
              <UserCircle className="h-3.5 w-3.5" />
              <span>{ROLES[currentRole].label}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {roleDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl shadow-lg overflow-hidden"
                style={{
                  background: "var(--bg-card, #ffffff)",
                  border: "1px solid var(--border, #e2e8f0)",
                }}
              >
                {Object.entries(ROLES).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-gray-50"
                    style={{ color: "var(--text, #0f172a)" }}
                    onClick={() => {
                      setCurrentRole(key as RoleKey);
                      setRoleDropdownOpen(false);
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                    {label}
                    {currentRole === key && (
                      <span className="ml-auto text-blue-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: "var(--text-muted, #64748b)" }}
            onClick={toggleDarkMode}
            title={darkMode ? "ライトモード" : "ダークモード"}
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: "var(--text-muted, #64748b)" }}
              onClick={() => setNotifOpen((v) => !v)}
              aria-label={`通知（${unreadCount}件の未読）`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl shadow-lg"
                style={{
                  background: "var(--bg-card, #ffffff)",
                  border: "1px solid var(--border, #e2e8f0)",
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border, #e2e8f0)" }}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--text-heading, #0f172a)" }}
                  >
                    通知
                  </span>
                  <button className="text-xs text-blue-500 hover:underline">
                    すべて既読
                  </button>
                </div>
                {NOTIFS.map((n) => (
                  <div
                    key={n.title}
                    className="cursor-pointer px-4 py-2.5"
                    style={{
                      borderBottom: "1px solid var(--border-light, #f1f5f9)",
                      background: n.read
                        ? "transparent"
                        : "var(--accent-light, #eff6ff)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--text, #0f172a)" }}
                      >
                        {n.title}
                      </span>
                      <span
                        className="whitespace-nowrap text-[10px]"
                        style={{ color: "var(--text-muted, #64748b)" }}
                      >
                        {n.time}
                      </span>
                    </div>
                    <p
                      className="mt-0.5 text-[11px]"
                      style={{ color: "var(--text-muted, #64748b)" }}
                    >
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User avatar + name */}
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: "var(--accent-light, #eff6ff)",
                color: "var(--accent, #1a56db)",
              }}
            >
              {initials}
            </div>
            <span
              className="hidden sm:inline text-sm font-medium"
              style={{ color: "var(--text, #0f172a)" }}
            >
              {displayName}
            </span>
          </div>

          {/* Logout */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: "var(--text-muted, #64748b)" }}
            onClick={handleLogout}
            title="ログアウト"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Page content */}
        <main
          className="ceos-design-scope min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: "var(--bg-page, #f8fafc)" }}
        >
          {children}
        </main>
      </div>

      {/* Close header dropdowns on outside click */}
      {(roleDropdownOpen || notifOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setRoleDropdownOpen(false);
            setNotifOpen(false);
          }}
        />
      )}
    </div>
  );
}
