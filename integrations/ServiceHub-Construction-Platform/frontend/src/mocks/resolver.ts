// Mock API resolver — maps (method, path) → mock response when VITE_MOCK_MODE=true

import {
  MOCK_PROJECTS,
  MOCK_DASHBOARD_KPI,
  MOCK_USERS,
  MOCK_DAILY_REPORTS,
  MOCK_SAFETY_CHECKS,
  MOCK_PHOTOS,
  MOCK_INCIDENTS,
  MOCK_CHANGE_REQUESTS,
  MOCK_KNOWLEDGE_ARTICLES,
  MOCK_COST_SUMMARY_BY_PROJECT,
  MOCK_NOTIFICATION_PREFERENCES,
  paginate,
  USER_IDS,
} from "./data";

interface MockResponse {
  status: number;
  data: unknown;
}

function ok(data: unknown, status = 200): MockResponse {
  return { status, data };
}

function notFound(message = "Not found"): MockResponse {
  return { status: 404, data: { detail: message } };
}

// Extract :param segments from a matched path
function extractId(path: string, prefix: string): string {
  return path.slice(prefix.length).split("/")[0];
}

// Query-string parser for path?key=val style (Vite passes full path + qs)
function parseQS(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(search).entries()) {
    out[k] = v;
  }
  return out;
}

function splitPathQS(fullPath: string): {
  path: string;
  qs: Record<string, string>;
} {
  const idx = fullPath.indexOf("?");
  if (idx === -1) return { path: fullPath, qs: {} };
  return { path: fullPath.slice(0, idx), qs: parseQS(fullPath.slice(idx + 1)) };
}

export function resolveMock(
  method: string,
  fullPath: string,
  _body?: unknown,
): MockResponse | null {
  const { path, qs } = splitPathQS(fullPath);
  const page = parseInt(qs["page"] ?? "1", 10);
  const perPage = parseInt(qs["per_page"] ?? "20", 10);

  // ── Auth ───────────────────────────────────────────────────────────────────
  if (method === "POST" && path === "/auth/login") {
    return ok({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      token_type: "bearer",
      user: {
        id: USER_IDS[0],
        email: "admin@servicehub.jp",
        full_name: "山田 太郎",
        role: "ADMIN",
        is_active: true,
        last_login_at: new Date().toISOString(),
        created_at: "2026-01-01T00:00:00Z",
      },
    });
  }

  if (method === "POST" && path === "/auth/refresh") {
    return ok({
      access_token: "mock-access-token-refreshed",
      refresh_token: "mock-refresh-token",
    });
  }

  if (method === "GET" && path === "/auth/me") {
    return ok({
      id: USER_IDS[0],
      email: "admin@servicehub.jp",
      full_name: "山田 太郎",
      role: "ADMIN",
      is_active: true,
      last_login_at: new Date().toISOString(),
      created_at: "2026-01-01T00:00:00Z",
    });
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/dashboard/kpi") {
    return ok(MOCK_DASHBOARD_KPI);
  }

  if (method === "GET" && path === "/dashboard/summary") {
    return ok(MOCK_DASHBOARD_KPI);
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/projects") {
    const status = qs["status"];
    const q = qs["q"]?.toLowerCase();
    let items = [...MOCK_PROJECTS];
    if (status) items = items.filter((p) => p.status === status);
    if (q)
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.client_name.toLowerCase().includes(q),
      );
    return ok(paginate(items, page, perPage));
  }

  if (method === "GET" && path.startsWith("/projects/")) {
    const id = extractId(path, "/projects/");
    const project = MOCK_PROJECTS.find(
      (p) => p.id === id || p.project_code === id,
    );
    return project ? ok(project) : notFound("Project not found");
  }

  if (method === "POST" && path === "/projects") {
    const body = _body as Record<string, unknown>;
    const newProject = {
      ...MOCK_PROJECTS[0],
      id: crypto.randomUUID(),
      project_code: `PRJ-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
    };
    return ok(newProject, 201);
  }

  if (
    (method === "PUT" || method === "PATCH") &&
    path.startsWith("/projects/")
  ) {
    const id = extractId(path, "/projects/");
    const project = MOCK_PROJECTS.find((p) => p.id === id);
    if (!project) return notFound();
    return ok({
      ...project,
      ...(_body as object),
      updated_at: new Date().toISOString(),
    });
  }

  if (method === "DELETE" && path.startsWith("/projects/")) {
    return ok({ success: true }, 204);
  }

  // ── Daily Reports ──────────────────────────────────────────────────────────
  if (method === "GET" && path === "/daily-reports") {
    const projectId = qs["project_id"];
    let items = [...MOCK_DAILY_REPORTS];
    if (projectId) items = items.filter((r) => r.project_id === projectId);
    return ok(paginate(items, page, perPage));
  }

  if (method === "GET" && path.startsWith("/daily-reports/")) {
    const id = extractId(path, "/daily-reports/");
    const report = MOCK_DAILY_REPORTS.find((r) => r.id === id);
    return report ? ok(report) : notFound("Report not found");
  }

  if (method === "POST" && path === "/daily-reports") {
    const body = _body as Record<string, unknown>;
    return ok(
      {
        ...MOCK_DAILY_REPORTS[0],
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...body,
      },
      201,
    );
  }

  if (
    (method === "PUT" || method === "PATCH") &&
    path.startsWith("/daily-reports/")
  ) {
    const id = extractId(path, "/daily-reports/");
    const report = MOCK_DAILY_REPORTS.find((r) => r.id === id);
    if (!report) return notFound();
    return ok({
      ...report,
      ...(_body as object),
      updated_at: new Date().toISOString(),
    });
  }

  // ── Safety Checks ──────────────────────────────────────────────────────────
  if (method === "GET" && path === "/safety-checks") {
    const projectId = qs["project_id"];
    let items = [...MOCK_SAFETY_CHECKS];
    if (projectId) items = items.filter((c) => c.project_id === projectId);
    return ok(paginate(items, page, perPage));
  }

  if (method === "GET" && path.startsWith("/safety-checks/")) {
    const id = extractId(path, "/safety-checks/");
    const check = MOCK_SAFETY_CHECKS.find((c) => c.id === id);
    return check ? ok(check) : notFound();
  }

  if (method === "POST" && path === "/safety-checks") {
    return ok(
      {
        ...MOCK_SAFETY_CHECKS[0],
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...(_body as object),
      },
      201,
    );
  }

  // ── Photos ─────────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/photos") {
    const projectId = qs["project_id"];
    let items = [...MOCK_PHOTOS];
    if (projectId) items = items.filter((ph) => ph.project_id === projectId);
    return ok(paginate(items, page, perPage));
  }

  if (method === "GET" && path.startsWith("/photos/")) {
    const id = extractId(path, "/photos/");
    const photo = MOCK_PHOTOS.find((ph) => ph.id === id);
    return photo ? ok(photo) : notFound();
  }

  if (method === "POST" && path === "/photos") {
    return ok(
      {
        ...MOCK_PHOTOS[0],
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      },
      201,
    );
  }

  if (method === "DELETE" && path.startsWith("/photos/")) {
    return ok({ success: true }, 204);
  }

  // ── Knowledge Base ─────────────────────────────────────────────────────────
  if (method === "GET" && path === "/knowledge") {
    const category = qs["category"];
    const q = qs["q"]?.toLowerCase();
    let items = [...MOCK_KNOWLEDGE_ARTICLES];
    if (category) items = items.filter((a) => a.category === category);
    if (q)
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q),
      );
    return ok(paginate(items, page, perPage));
  }

  if (method === "GET" && path.startsWith("/knowledge/")) {
    const id = extractId(path, "/knowledge/");
    const article = MOCK_KNOWLEDGE_ARTICLES.find((a) => a.id === id);
    return article ? ok(article) : notFound();
  }

  if (method === "POST" && path === "/knowledge") {
    return ok(
      {
        ...MOCK_KNOWLEDGE_ARTICLES[0],
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...(_body as object),
      },
      201,
    );
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/users") {
    return ok(paginate(MOCK_USERS, page, perPage));
  }

  if (method === "GET" && path.startsWith("/users/")) {
    const id = extractId(path, "/users/");
    const user = MOCK_USERS.find((u) => u.id === id);
    return user ? ok(user) : notFound();
  }

  // ── ITSM — Incidents ───────────────────────────────────────────────────────
  if (method === "GET" && path === "/itsm/incidents") {
    const status = qs["status"];
    const priority = qs["priority"];
    let items = [...MOCK_INCIDENTS];
    if (status) items = items.filter((i) => i.status === status);
    if (priority) items = items.filter((i) => i.priority === priority);
    return ok(paginate(items, page, perPage));
  }

  if (method === "GET" && path.startsWith("/itsm/incidents/")) {
    const id = extractId(path, "/itsm/incidents/");
    const incident = MOCK_INCIDENTS.find(
      (i) => i.id === id || i.incident_number === id,
    );
    return incident ? ok(incident) : notFound();
  }

  if (method === "POST" && path === "/itsm/incidents") {
    const body = _body as Record<string, unknown>;
    return ok(
      {
        ...MOCK_INCIDENTS[0],
        id: crypto.randomUUID(),
        incident_number: `INC-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        status: "OPEN",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...body,
      },
      201,
    );
  }

  if (
    (method === "PUT" || method === "PATCH") &&
    path.startsWith("/itsm/incidents/")
  ) {
    const id = extractId(path, "/itsm/incidents/");
    const incident = MOCK_INCIDENTS.find((i) => i.id === id);
    if (!incident) return notFound();
    return ok({
      ...incident,
      ...(_body as object),
      updated_at: new Date().toISOString(),
    });
  }

  // ── ITSM — Change Requests ─────────────────────────────────────────────────
  if (method === "GET" && path === "/itsm/changes") {
    return ok(paginate(MOCK_CHANGE_REQUESTS, page, perPage));
  }

  if (method === "GET" && path.startsWith("/itsm/changes/")) {
    const id = extractId(path, "/itsm/changes/");
    const cr = MOCK_CHANGE_REQUESTS.find(
      (c) => c.id === id || c.change_number === id,
    );
    return cr ? ok(cr) : notFound();
  }

  if (method === "POST" && path === "/itsm/changes") {
    return ok(
      {
        ...MOCK_CHANGE_REQUESTS[0],
        id: crypto.randomUUID(),
        change_number: `CHG-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        status: "DRAFT",
        created_at: new Date().toISOString(),
        ...(_body as object),
      },
      201,
    );
  }

  // ── Cost Management ────────────────────────────────────────────────────────
  if (method === "GET" && path === "/costs/summary") {
    const projectId = qs["project_id"];
    if (projectId) {
      const summary = MOCK_COST_SUMMARY_BY_PROJECT.find(
        (c) => c.project_id === projectId,
      );
      return summary ? ok(summary) : ok(MOCK_COST_SUMMARY_BY_PROJECT[0]);
    }
    return ok(MOCK_COST_SUMMARY_BY_PROJECT);
  }

  if (method === "GET" && path === "/costs") {
    return ok(paginate(MOCK_COST_SUMMARY_BY_PROJECT, page, perPage));
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  if (method === "GET" && path === "/notifications/preferences") {
    return ok(MOCK_NOTIFICATION_PREFERENCES);
  }

  if (
    (method === "PUT" || method === "PATCH") &&
    path === "/notifications/preferences"
  ) {
    return ok({ ...MOCK_NOTIFICATION_PREFERENCES, ...(_body as object) });
  }

  if (method === "GET" && path === "/notifications") {
    return ok(paginate([], page, perPage));
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/settings") {
    return ok({
      company_name: "株式会社建設サービスハブ",
      timezone: "Asia/Tokyo",
      language: "ja",
      date_format: "YYYY/MM/DD",
      fiscal_year_start: "04",
      m365_tenant_id: "",
      m365_client_id: "",
      m365_integration_enabled: false,
      api_key_prefix: "sk-sh-****",
      webhook_url: "",
    });
  }

  if ((method === "PUT" || method === "PATCH") && path === "/settings") {
    return ok({ success: true });
  }

  // ── Legal / Contracts ──────────────────────────────────────────────────────
  if (method === "GET" && path === "/legal/contracts") {
    return ok(
      paginate(
        [
          {
            id: "contract-001",
            title: "川崎駅前複合ビル 工事請負契約",
            project_id: "11111111-0002-0000-0000-000000000002",
            contract_type: "CONSTRUCTION",
            counterparty: "東急不動産株式会社",
            amount: "3200000000",
            start_date: "2025-10-01",
            end_date: "2027-03-31",
            status: "ACTIVE",
            created_at: "2025-09-15T09:00:00Z",
          },
          {
            id: "contract-002",
            title: "新宿区A棟 下請契約（設備工事）",
            project_id: "11111111-0001-0000-0000-000000000001",
            contract_type: "SUBCONTRACT",
            counterparty: "東京設備工業株式会社",
            amount: "12000000",
            start_date: "2026-04-01",
            end_date: "2026-07-31",
            status: "ACTIVE",
            created_at: "2026-03-20T09:00:00Z",
          },
          {
            id: "contract-003",
            title: "横浜みなとみらい 設計委託契約",
            project_id: "11111111-0003-0000-0000-000000000003",
            contract_type: "DESIGN",
            counterparty: "株式会社日建設計",
            amount: "45000000",
            start_date: "2026-01-01",
            end_date: "2026-06-30",
            status: "COMPLETED",
            created_at: "2025-12-01T09:00:00Z",
          },
        ],
        page,
        perPage,
      ),
    );
  }

  if (method === "GET" && path === "/legal/evidence") {
    return ok(
      paginate(
        [
          {
            id: "evidence-001",
            title: "川崎現場 工事写真記録 2026年5月",
            project_id: "11111111-0002-0000-0000-000000000002",
            evidence_type: "PHOTO",
            description: "5月度の工事進捗写真（鉄骨建方、デッキプレート敷設）",
            file_count: 142,
            created_at: "2026-05-31T18:00:00Z",
          },
          {
            id: "evidence-002",
            title: "品川区小学校 耐震補強 完了検査記録",
            project_id: "11111111-0008-0000-0000-000000000008",
            evidence_type: "INSPECTION",
            description: "竣工検査合格証明・第三者機関検査報告書",
            file_count: 8,
            created_at: "2025-12-20T10:00:00Z",
          },
        ],
        page,
        perPage,
      ),
    );
  }

  return null;
}
