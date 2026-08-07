import { Link, useLocation } from "react-router-dom";

/**
 * モバイル用フッターナビゲーション。
 * - md 未満で表示 (PC ではヘッダー nav を使用)
 * - 各ターゲットは最低 44x44px (WCAG 2.1 AA タップターゲット)
 */
const ITEMS = [
  { to: "/", label: "ホーム", icon: "🏠" },
  { to: "/near-miss", label: "ヒヤリ", icon: "⚠️" },
  { to: "/ky", label: "KY", icon: "📝" },
  { to: "/photo", label: "撮影", icon: "📷" },
  { to: "/patrol", label: "巡視", icon: "🚧" },
];

export default function MobileBottomNav() {
  const loc = useLocation();
  return (
    <nav
      role="navigation"
      aria-label="モバイルメインメニュー"
      className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t shadow-lg z-40 flex justify-around"
    >
      {ITEMS.map((it) => {
        const active = loc.pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            aria-current={active ? "page" : undefined}
            aria-label={it.label}
            className={
              "flex-1 min-h-tap min-w-tap flex flex-col items-center justify-center py-2 text-xs touch-manipulation " +
              (active ? "text-cdx-quality font-bold" : "text-slate-600")
            }
          >
            <span aria-hidden="true" className="text-xl leading-none">
              {it.icon}
            </span>
            <span className="mt-0.5">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
