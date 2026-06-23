// Service base URLs — single source of truth for NEXT_PUBLIC_* env vars.
// Override via .env.local (dev) or Docker environment for production.
// These are client-visible URLs (NEXT_PUBLIC_) used by browser-side fetches.
// Server-side proxy URLs (e.g. in api/health) use separate *_BASE_URL vars.
export const AUTH_API =
  process.env.NEXT_PUBLIC_AUTH_API ?? "http://localhost:8001";
const OBJECT_API =
  process.env.NEXT_PUBLIC_OBJECT_API ?? "http://localhost:8004";
const WORKFLOW_API =
  process.env.NEXT_PUBLIC_WORKFLOW_API ?? "http://localhost:8005";
const AI_GATEWAY_API =
  process.env.NEXT_PUBLIC_AI_GATEWAY_API ?? "http://localhost:8006";
const FEDERATION_API =
  process.env.NEXT_PUBLIC_FEDERATION_API ?? "http://localhost:8007";
const DASHBOARD_API =
  process.env.NEXT_PUBLIC_DASHBOARD_API ?? "http://localhost:8009";
const AUDIT_API = process.env.NEXT_PUBLIC_AUDIT_API ?? "http://localhost:8003";

// Default tenant for dev/demo — override via env var
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? "demo";

async function apiFetch<T>(base: string, path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${base}${path}`);
  return res.json() as Promise<T>;
}

async function apiPost<T>(
  base: string,
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: POST ${base}${path}`);
  return res.json() as Promise<T>;
}

// ---------- Auth ----------
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const form = new URLSearchParams({ username, password });
  const res = await fetch(`${AUTH_API}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json() as Promise<LoginResponse>;
}

export interface UserInfo {
  username: string;
  tenant_id: string;
  role: string;
}

export const getMe = (token: string) =>
  apiFetch<UserInfo>(AUTH_API, `/auth/me`);

// ---------- Dashboard ----------
export interface EnterpriseHealth {
  open_issue_count: number;
  pending_approval_count: number;
  critical_audit_count: number;
}

export interface AIActivity {
  ai_action_count: number;
  high_ai_risk_count: number;
  external_ai_block_count: number;
  sprint_ready: boolean;
}

export interface DLPAlerts {
  dlp_violation_count: number;
  restricted_document_count: number;
  sprint_ready: boolean;
}

/** Mirrors dashboard-service/dashboard_app/schemas/dashboard.py FederationStats. */
export interface FederationStats {
  pending_federation_request_count: number;
  trust_warning_count: number;
  sprint_ready: boolean;
}

export interface DashboardSummary {
  enterprise_health: EnterpriseHealth;
  ai_activity: AIActivity;
  dlp_alerts: DLPAlerts;
  federation_stats: FederationStats;
}

export const getDashboard = (tenantId = DEFAULT_TENANT) =>
  apiFetch<DashboardSummary>(
    DASHBOARD_API,
    `/dashboard/overview?tenant_id=${encodeURIComponent(tenantId)}`,
  );

export const getEnterpriseHealth = (tenantId = DEFAULT_TENANT) =>
  apiFetch<EnterpriseHealth>(
    DASHBOARD_API,
    `/dashboard/enterprise-health?tenant_id=${encodeURIComponent(tenantId)}`,
  );

// ---------- Issues ----------
export interface Issue {
  object_id: string;
  title: string;
  tenant_id: string;
  status: string;
  priority: string;
  classification: string;
  created_at: string;
}

export const getIssues = (tenantId?: string) => {
  const params = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
  return apiFetch<Issue[]>(OBJECT_API, `/issues${params}`);
};

// ---------- Approvals ----------
export interface Approval {
  object_id: string;
  title: string;
  status: string;
  actor_id: string;
  issue_id: string;
  final_decision: string;
  created_at: string;
}

export const getApprovals = (tenantId?: string) => {
  const params = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
  return apiFetch<Approval[]>(WORKFLOW_API, `/approvals${params}`);
};

// ---------- AI Governance ----------
export interface AIAction {
  object_id: string;
  prompt_audit_ref: string;
  reasoning_summary: string;
  confidence_score: number;
  risk_score: number;
  actor_id: string;
  created_at: string;
}

export const getAIActions = (tenantId?: string) => {
  const params = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
  return apiFetch<AIAction[]>(AI_GATEWAY_API, `/ai-actions${params}`);
};

// ---------- Federation ----------
/** Federation Event — matches backend FederationEvent schema (ADR-002 / BL-008). */
export interface FederationEvent {
  object_id: string;
  /** Source organization ten_* (backend: source_tenant) */
  source_tenant: string;
  /** Target organization ten_* (backend: target_tenant) */
  target_tenant: string;
  shared_object_id: string;
  shared_object_type: string;
  trust_level: string;
  policy_binding: string;
  /** Audit retention boundary: "shared" | "source_only" */
  audit_boundary: string;
  risk_score: number;
  /** "approved" | "review_required" | "blocked" */
  status: string;
  reasoning_summary: string | null;
  requested_action: string;
  tenant_id: string;
  created_at: string;
}

export const getFederationEvents = (tenantId?: string) => {
  const params = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
  return apiFetch<FederationEvent[]>(
    FEDERATION_API,
    `/federation-events${params}`,
  );
};

/** 3-company demo scenario: A→B(approved), A→C(blocked), B→C(review_required) */
export const getFederationDemoScenario = () =>
  apiFetch<FederationEvent[]>(FEDERATION_API, "/federation-demo/scenario");

// ---------- Audit ----------
export interface AuditEvent {
  audit_event_id: string;
  event_type: string;
  actor_id: string;
  object_id: string;
  tenant_id: string;
  policy_result: string;
  hash_ref: string;
  correlation_id: string;
  occurred_at: string;
}

export const getAuditEvents = (tenantId?: string) => {
  const params = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
  return apiFetch<AuditEvent[]>(AUDIT_API, `/audit-events${params}`);
};
