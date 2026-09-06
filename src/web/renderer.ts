/**
 * Server-side HTML template renderer.
 *
 * Reads static HTML files from the templates directory, performs simple
 * {{VARIABLE}} placeholder substitution, and returns a rendered HTML string.
 * No external templating library is used — the format is intentionally minimal.
 *
 * All user-controlled values are HTML-escaped before insertion; HTML fragments
 * produced by the internal renderers use only trusted, hard-coded strings or
 * escape every field individually.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLATFORM_VERSION } from "../version.ts";
import type {
  DashboardView,
  AppHealthItem,
  DeviceStatusItem,
  ApprovalRequest,
} from "../dashboard/dashboard.ts";
import type { User } from "../domain/user.ts";
import type { IntegrationContract, IntegrationEvent } from "../domain/integration.ts";

// ---------------------------------------------------------------------------
// Template directory resolution
// ---------------------------------------------------------------------------

const TEMPLATES_DIR = join(fileURLToPath(import.meta.url), "..", "templates");

/** Absolute paths to the bundled HTML templates. */
export const TEMPLATES = {
  INDEX: join(TEMPLATES_DIR, "index.html"),
  GOVERNANCE: join(TEMPLATES_DIR, "governance.html"),
  ISO: join(TEMPLATES_DIR, "iso.html"),
  MVP_APP: join(TEMPLATES_DIR, "mvp-app.html"),
  SYSTEM: join(TEMPLATES_DIR, "system.html"),
  OPS_HEALTH: join(TEMPLATES_DIR, "ops-health.html"),
  WEBHOOKS: join(TEMPLATES_DIR, "webhooks.html"),
} as const;

/** The platform version string. Callers may override at bootstrap. */
let _platformVersion = PLATFORM_VERSION;

export function setPlatformVersion(version: string): void {
  _platformVersion = version;
}

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** Flat key→value map used for template placeholder substitution. */
export interface RenderContext {
  readonly [key: string]: string | number | boolean;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Escape a value for safe HTML embedding. */
function esc(value: string | number | boolean | undefined | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Format an ISO timestamp for Japanese locale display.
 * Falls back to the raw string if parsing fails.
 */
function fmtTime(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Domain label maps
// ---------------------------------------------------------------------------

const APP_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  portal: "ポータル",
  governance: "ガバナンス",
  field: "フィールド",
  workflow: "ワークフロー",
  document: "ドキュメント",
};

const HEALTH_LABELS: Readonly<Record<string, string>> = {
  healthy: "正常",
  degraded: "劣化",
  down: "停止",
  unknown: "不明",
};

const DEVICE_KIND_LABELS: Readonly<Record<string, string>> = {
  tablet: "タブレット",
  phone: "スマートフォン",
  kiosk: "キオスク",
  sensor: "センサー",
  laptop: "ノートPC",
};

const DEVICE_STATUS_LABELS: Readonly<Record<string, string>> = {
  active: "アクティブ",
  provisioned: "プロビジョン済み",
  lost: "紛失",
  retired: "廃止",
};

const DEVICE_KIND_ICONS: Readonly<Record<string, string>> = {
  tablet: "📱",
  phone: "📲",
  kiosk: "🖥",
  sensor: "📡",
  laptop: "💻",
};

// ---------------------------------------------------------------------------
// Fragment renderers
// ---------------------------------------------------------------------------

function renderAppCards(applications: readonly AppHealthItem[]): string {
  if (applications.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">🔧</div>アプリケーションが見つかりません</div>';
  }
  return applications
    .map((app) => {
      const healthLabel = HEALTH_LABELS[app.health] ?? app.health;
      const catLabel = APP_CATEGORY_LABELS[app.category] ?? app.category;
      return [
        '<div class="app-card">',
        `  <div class="app-health-dot health-${esc(app.health)}"></div>`,
        '  <div class="app-info">',
        `    <div class="app-name">${esc(app.name)}</div>`,
        `    <div class="app-meta">${esc(catLabel)} · ${esc(app.key)}</div>`,
        "  </div>",
        `  <div class="app-health-label ${esc(app.health)}">${esc(healthLabel)}</div>`,
        "</div>",
      ].join("\n");
    })
    .join("\n");
}

function renderDeviceRows(devices: readonly DeviceStatusItem[]): string {
  if (devices.length === 0) {
    return '<tr><td colspan="4" class="empty-cell">デバイスが見つかりません</td></tr>';
  }
  return devices
    .map((d) => {
      const kindIcon = DEVICE_KIND_ICONS[d.kind] ?? "📦";
      const kindLabel = DEVICE_KIND_LABELS[d.kind] ?? d.kind;
      const statusLabel = DEVICE_STATUS_LABELS[d.status] ?? d.status;
      const assignedCell =
        d.assignedUserId !== undefined
          ? esc(d.assignedUserId)
          : '<span class="cell-muted">—</span>';
      return [
        "<tr>",
        `  <td><code class="cell-muted">${esc(d.id)}</code></td>`,
        `  <td><span class="device-kind">${esc(kindIcon)} ${esc(kindLabel)}</span></td>`,
        `  <td><span class="device-status ${esc(d.status)}">${esc(statusLabel)}</span></td>`,
        `  <td class="cell-soft">${assignedCell}</td>`,
        "</tr>",
      ].join("\n");
    })
    .join("\n");
}

const USER_STATUS_LABELS: Readonly<Record<string, string>> = {
  invited: "招待中",
  active: "アクティブ",
  suspended: "停止中",
  deactivated: "無効",
};

function renderUserRows(users: readonly User[]): string {
  if (users.length === 0) {
    return '<tr><td colspan="5" class="empty-cell">ユーザーが見つかりません</td></tr>';
  }
  return users
    .map((u) => {
      const statusLabel = USER_STATUS_LABELS[u.status] ?? u.status;
      const roleIds = u.roleIds.map((id) => `<code class="cell-muted">${esc(id)}</code>`).join(" ");
      return [
        "<tr>",
        `  <td><strong>${esc(u.displayName)}</strong></td>`,
        `  <td class="cell-soft">${esc(u.email)}</td>`,
        `  <td><code class="cell-muted">${esc(u.organizationId)}</code></td>`,
        `  <td class="cell-soft">${roleIds}</td>`,
        `  <td><span class="device-status ${esc(u.status)}">${esc(statusLabel)}</span></td>`,
        "</tr>",
      ].join("\n");
    })
    .join("\n");
}

function renderApprovals(approvals: readonly ApprovalRequest[]): string {
  if (approvals.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">✅</div>未処理の承認リクエストはありません</div>';
  }
  return approvals
    .map((a) =>
      [
        '<div class="approval-item">',
        '  <div class="approval-icon">⏳</div>',
        '  <div class="approval-info">',
        `    <div class="approval-title">ワークフロー: ${esc(a.workflowId)} — ${esc(a.stepKey)}</div>`,
        `    <div class="approval-meta">リクエスト者: ${esc(a.requestedBy)} &nbsp;·&nbsp; ID: ${esc(a.id)}</div>`,
        "  </div>",
        `  <div class="approval-time">${esc(fmtTime(a.requestedAt))}</div>`,
        "</div>",
      ].join("\n"),
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// Core template engine
// ---------------------------------------------------------------------------

/**
 * Read an HTML template from disk and replace all `{{VARIABLE}}` placeholders
 * with the corresponding values from `context`.
 *
 * Placeholders that have no matching key are left as-is so accidental
 * omissions remain visible during development.
 */
export async function renderTemplate(
  templatePath: string,
  context: RenderContext,
): Promise<string> {
  const raw = await readFile(templatePath, "utf-8");
  return raw.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key: string) => {
    const value = (context as Record<string, string | number | boolean>)[key];
    if (value === undefined) {
      return `{{${key}}}`; // leave unknown placeholders intact
    }
    return String(value);
  });
}

// ---------------------------------------------------------------------------
// Dashboard renderer
// ---------------------------------------------------------------------------

/**
 * Build the full dashboard HTML from a `DashboardView` snapshot.
 * All data is embedded server-side; the client-side JS provides auto-refresh.
 */
export async function renderDashboard(
  data: DashboardView,
  apiToken = "",
  users: readonly User[] = [],
): Promise<string> {
  const context: RenderContext = {
    VERSION: esc(_platformVersion),
    VIEWER: esc(data.viewer),
    GENERATED_AT: esc(fmtTime(data.generatedAt)),

    // Governance summary
    TOTAL_USERS: data.governance.totalUsers,
    ACTIVE_USERS: data.governance.activeUsers,
    VISIBLE_APPS: data.governance.visibleApplications,
    UNHEALTHY_APPS: data.governance.unhealthyApplications,
    VISIBLE_DEVICES: data.governance.visibleDevices,
    OPEN_APPROVALS: data.governance.openApprovals,
    AUDIT_EVENTS: data.governance.auditEvents,
    DENIED_EVENTS: data.governance.deniedAccessEvents,

    // Rendered HTML fragments (already escaped)
    APP_CARDS: renderAppCards(data.applications),
    DEVICE_ROWS: renderDeviceRows(data.devices),
    USER_ROWS: renderUserRows(users),
    APPROVAL_ITEMS: renderApprovals(data.pendingApprovals),
    // Audit log is fetched client-side for freshness
    AUDIT_ITEMS:
      '<div class="empty-state"><div class="empty-state-icon">📋</div>監査ログはAPIから動的に読み込まれます</div>',
    API_TOKEN: esc(apiToken),
  };

  return renderTemplate(TEMPLATES.INDEX, context);
}

// ---------------------------------------------------------------------------
// Governance renderer
// ---------------------------------------------------------------------------

export interface GovernancePolicyRow {
  readonly id: string;
  readonly name: string;
  readonly effect: string;
  readonly actions: readonly string[];
  readonly resources: readonly string[];
  readonly conditionCount: number;
}

function renderPolicyRows(policies: readonly GovernancePolicyRow[]): string {
  if (policies.length === 0) {
    return '<tr><td colspan="6" class="empty-cell">ポリシーが見つかりません</td></tr>';
  }
  return policies
    .map((p) => {
      const effectClass = p.effect === "allow" ? "badge-green" : "badge-red";
      const effectLabel = p.effect === "allow" ? "許可" : "拒否";
      const actionTags = p.actions.map((a) => `<span class="tag">${esc(a)}</span>`).join("");
      const resourceTags = p.resources.map((r) => `<span class="tag">${esc(r)}</span>`).join("");
      const condLabel =
        p.conditionCount > 0
          ? `<span class="badge badge-yellow">${esc(p.conditionCount)} 件</span>`
          : '<span class="cell-muted">—</span>';
      return [
        "<tr>",
        `  <td><code class="cell-muted">${esc(p.id)}</code></td>`,
        `  <td class="cell-strong">${esc(p.name)}</td>`,
        `  <td><span class="badge ${effectClass}">${esc(effectLabel)}</span></td>`,
        `  <td>${actionTags}</td>`,
        `  <td>${resourceTags}</td>`,
        `  <td>${condLabel}</td>`,
        "</tr>",
      ].join("\n");
    })
    .join("\n");
}

/**
 * Build the governance page HTML.
 *
 * Pass `policies` as an empty array when the policy list endpoint is not yet
 * available — the page will still render with a placeholder row.
 */
export async function renderGovernance(
  policies: readonly GovernancePolicyRow[],
  apiToken = "",
): Promise<string> {
  const context: RenderContext = {
    VERSION: esc(_platformVersion),
    POLICY_ROWS: renderPolicyRows(policies),
    API_TOKEN: esc(apiToken),
  };

  return renderTemplate(TEMPLATES.GOVERNANCE, context);
}

/**
 * Build the ISO integrated-management console HTML shell. All data is loaded
 * client-side from the authenticated ISO API.
 */
export async function renderIsoPage(apiToken = ""): Promise<string> {
  const context: RenderContext = {
    VERSION: esc(_platformVersion),
    API_TOKEN: esc(apiToken),
  };
  return renderTemplate(TEMPLATES.ISO, context);
}

/**
 * Build the integrated module console HTML shell (v0.14.0 MVP). All data is
 * loaded client-side from the migrated-domain APIs.
 */
export async function renderMvpAppPage(apiToken = ""): Promise<string> {
  const context: RenderContext = {
    VERSION: esc(_platformVersion),
    API_TOKEN: esc(apiToken),
  };
  return renderTemplate(TEMPLATES.MVP_APP, context);
}

/**
 * Build the system settings console HTML shell (v0.14.3). All data is loaded
 * client-side from the authenticated system APIs.
 */
export async function renderSystemPage(apiToken = ""): Promise<string> {
  const context: RenderContext = {
    VERSION: esc(_platformVersion),
    API_TOKEN: esc(apiToken),
  };
  return renderTemplate(TEMPLATES.SYSTEM, context);
}

/**
 * Build the ops health dashboard HTML shell (Issue #89). All data is loaded
 * client-side from GET /api/v1/ops/health.
 */
export async function renderOpsHealthPage(apiToken = ""): Promise<string> {
  const context: RenderContext = {
    VERSION: esc(_platformVersion),
    API_TOKEN: esc(apiToken),
  };
  return renderTemplate(TEMPLATES.OPS_HEALTH, context);
}

// ---------------------------------------------------------------------------
// Webhook delivery management renderer (v0.14.6)
// ---------------------------------------------------------------------------

const INTEGRATION_EVENT_STATUS_LABELS: Readonly<Record<string, string>> = {
  received: "受信済み",
  pending: "送信待ち",
  sent: "送信済み",
  retrying: "再送中",
  failed: "失敗",
  acknowledged: "確認済み",
};

const INTEGRATION_EVENT_STATUS_BADGES: Readonly<Record<string, string>> = {
  received: "badge-blue",
  pending: "badge-yellow",
  sent: "badge-green",
  retrying: "badge-yellow",
  failed: "badge-red",
  acknowledged: "badge-green",
};

/** Systems/event types a delivery can be retried for from the UI. */
const RETRYABLE_EVENT_STATUSES: ReadonlySet<string> = new Set(["pending", "retrying", "failed"]);

function renderContractRows(contracts: readonly IntegrationContract[]): string {
  if (contracts.length === 0) {
    return '<tr><td colspan="7" class="empty-cell">送信先が見つかりません</td></tr>';
  }
  return contracts
    .map((c) => {
      const eventTags = c.eventTypes.map((t) => `<span class="tag">${esc(t)}</span>`).join(" ");
      return [
        "<tr>",
        `  <td><span class="cell-strong">${esc(c.label)}</span><br /><code class="cell-muted">${esc(c.system)}</code></td>`,
        `  <td><code class="cell-muted">${esc(c.outboundEndpoint)}</code><div class="cell-soft">${eventTags}</div></td>`,
        `  <td>${esc(c.auth)}</td>`,
        `  <td>${esc(c.timeoutMs)}ms</td>`,
        `  <td>${esc(c.maxRetries)}</td>`,
        `  <td>${esc(c.idempotency)}</td>`,
        `  <td>${esc(c.failureMode)}</td>`,
        "</tr>",
      ].join("\n");
    })
    .join("\n");
}

/** Render `<option>` elements (one per contract) carrying the system's event types as a data attribute. */
function renderContractOptions(contracts: readonly IntegrationContract[]): string {
  return contracts
    .map(
      (c) =>
        `<option value="${esc(c.system)}" data-event-types="${esc(c.eventTypes.join(","))}">${esc(c.label)}</option>`,
    )
    .join("\n");
}

function renderEventRows(events: readonly IntegrationEvent[]): string {
  if (events.length === 0) {
    return '<tr><td colspan="8" class="empty-cell">配信履歴がありません</td></tr>';
  }
  return events
    .map((e) => {
      const statusLabel = INTEGRATION_EVENT_STATUS_LABELS[e.status] ?? e.status;
      const badgeClass = INTEGRATION_EVENT_STATUS_BADGES[e.status] ?? "badge-muted";
      const errorLine =
        e.lastError !== undefined ? `<div class="cell-soft">${esc(e.lastError)}</div>` : "";
      const canRetry = e.direction === "outbound" && RETRYABLE_EVENT_STATUSES.has(e.status);
      const retryCell = canRetry
        ? `<button class="btn btn-sm" data-action="retry" data-id="${esc(e.id)}">再送</button>`
        : '<span class="cell-muted">—</span>';
      return [
        "<tr>",
        `  <td><code class="cell-muted">${esc(e.id)}</code></td>`,
        `  <td>${esc(e.system)}</td>`,
        `  <td>${esc(e.direction)}</td>`,
        `  <td>${esc(e.eventType)}</td>`,
        `  <td><span class="badge ${badgeClass}">${esc(statusLabel)}</span>${errorLine}</td>`,
        `  <td>${esc(e.attempts)}</td>`,
        `  <td>${esc(fmtTime(e.updatedAt))}</td>`,
        `  <td>${retryCell}</td>`,
        "</tr>",
      ].join("\n");
    })
    .join("\n");
}

/**
 * Build the Webhook delivery management console HTML (v0.14.6). The
 * destination list (contracts) and the most recent deliveries are rendered
 * server-side from the same repository/config the integrations API uses;
 * filtering, pagination, retry, and new registrations happen client-side
 * against the authenticated `/api/v1/integrations/*` endpoints.
 */
export async function renderWebhooksPage(
  contracts: readonly IntegrationContract[],
  recentEvents: readonly IntegrationEvent[],
  apiToken = "",
): Promise<string> {
  const context: RenderContext = {
    VERSION: esc(_platformVersion),
    API_TOKEN: esc(apiToken),
    DESTINATION_ROWS: renderContractRows(contracts),
    SYSTEM_OPTIONS: renderContractOptions(contracts),
    EVENT_ROWS: renderEventRows(recentEvents),
  };
  return renderTemplate(TEMPLATES.WEBHOOKS, context);
}
