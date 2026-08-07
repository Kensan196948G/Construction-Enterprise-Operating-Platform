/* ========================================================================
   Claude Design — shared theme tokens
   Light fallbacks are the exact Claude Design source colors; the CSS
   variables are defined by the dashboard layout so dark mode follows
   automatically. Importable from both server and client components.
   ======================================================================== */

import type { CSSProperties } from "react";

export const CARD: CSSProperties = {
  background: "var(--bg-card, #fff)",
  borderRadius: 12,
  border: "1px solid var(--border, #e2e8f0)",
};

export const T_HEADING = "var(--text-heading, #0f172a)";
export const T_BODY = "var(--text, #0f172a)";
export const T_SECOND = "var(--text-secondary, #475569)";
export const T_MUTED = "#64748b";
export const T_FAINT = "#94a3b8";

export const BORDER = "var(--border, #e2e8f0)";
export const BORDER_LIGHT = "var(--border-light, #f1f5f9)";
export const HOVER_BG = "var(--bg-card-hover, #f8fafc)";
export const SUBTLE_BG = "var(--bg-subtle, #f8fafc)";
export const SHADOW = "var(--shadow, rgba(0,0,0,0.08))";

/** Mono font stack used for numeric/code-like values in the design. */
export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";

/** Status → solid color used across KPI / sensor / equipment views. */
export const STATUS_COLOR = {
  ok: "#16a34a",
  normal: "#16a34a",
  warning: "#f97316",
  danger: "#dc2626",
} as const;
