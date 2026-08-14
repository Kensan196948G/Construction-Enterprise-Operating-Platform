/**
 * Rich fictional demo dataset (MVP / prototype review).
 *
 * Seeds a complete, internally-consistent construction-company scenario so
 * every screen, API, search, KPI, export, and RBAC path can be operated and
 * evaluated immediately — no external services or real data required.
 *
 * ALL data in this module is fictional:
 *   - company, branch, site, and partner names are invented
 *   - people, email addresses, suppliers, clients, contracts, amounts,
 *     addresses, and coordinates are clearly marked デモ用 and do not exist
 *   - hashes are SHA-256 digests of literal demo strings, not real evidence
 *
 * The dataset is deterministic and idempotent (repository upsert semantics),
 * so it can be regenerated on any fresh store and re-run safely.
 */

import { createHash } from "node:crypto";
import type { IsoTimestamp } from "../domain/common.ts";
import { createOrganization } from "../domain/organization.ts";
import { createRole } from "../domain/role.ts";
import { createUser } from "../domain/user.ts";
import { createPolicy } from "../domain/policy.ts";
import { createApplication } from "../domain/application.ts";
import { createDevice } from "../domain/device.ts";
import { createProject } from "../domain/project.ts";
import { createDailyReport, transitionDailyReport } from "../domain/daily-report.ts";
import { createContract } from "../domain/contract.ts";
import { createLegalEvidence } from "../domain/compliance.ts";
import { createPurchaseOrder } from "../domain/purchase-order.ts";
import { createSafetyCheck, createQualityInspection } from "../domain/safety.ts";
import { createCostRecord, createWorkHour } from "../domain/cost.ts";
import { createWorkSchedule } from "../domain/work-schedule.ts";
import { createPhoto } from "../domain/photo.ts";
import { createDocument } from "../domain/document.ts";
import { createKnowledgeArticle } from "../domain/knowledge.ts";
import { createAiAction, decideAiAction, setAiOperationStatus } from "../domain/ai-action.ts";
import { createNotificationTemplate } from "../domain/notification-template.ts";
import { createNotificationPreference } from "../domain/notification-preference.ts";
import { createNotificationDelivery } from "../domain/notification.ts";
import { createWorkflow } from "../domain/workflow.ts";
import { createWorkflowInstance, decideWorkflowInstance } from "../domain/workflow-instance.ts";
import { createIsoRecord } from "../domain/iso.ts";
import { createIntegrationEvent, markIntegrationEvent } from "../domain/integration.ts";
import { createAuditEvent } from "../domain/audit-event.ts";
import type { IAuditLog } from "../governance/audit-log.ts";
import type { Repositories } from "./ports.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Brand a known-valid ISO-8601 timestamp. */
function ts(value: string): IsoTimestamp {
  return value as IsoTimestamp;
}

/** Unwrap a factory result; seed data is hard-coded, so errors are bugs. */
function must<T>(result: { ok: true; value: T } | { ok: false; error: unknown }, label: string): T {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`[rich-demo] Failed to create ${label}: ${JSON.stringify(result.error)}`);
}

/** Deterministic 64-hex digest used as clearly-fictional evidence hashes. */
function fakeHash(seed: string): string {
  return createHash("sha256").update(`demo-seed:${seed}`).digest("hex");
}

/** Entity counts returned for verification and reporting. */
export interface RichDemoSummary {
  readonly organizations: number;
  readonly roles: number;
  readonly users: number;
  readonly policies: number;
  readonly applications: number;
  readonly devices: number;
  readonly projects: number;
  readonly dailyReports: number;
  readonly contracts: number;
  readonly legalEvidences: number;
  readonly purchaseOrders: number;
  readonly safetyChecks: number;
  readonly qualityInspections: number;
  readonly costRecords: number;
  readonly workHours: number;
  readonly workSchedules: number;
  readonly photos: number;
  readonly documents: number;
  readonly knowledgeArticles: number;
  readonly aiActions: number;
  readonly notificationTemplates: number;
  readonly notificationPreferences: number;
  readonly notificationDeliveries: number;
  readonly workflows: number;
  readonly workflowInstances: number;
  readonly isoRecords: number;
  readonly integrationEvents: number;
  readonly auditEvents: number;
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

/**
 * Populate every repository with the fictional demo scenario.
 *
 * @param options.auditLog — when provided, a short history of governance
 *   events is appended so audit export / integrity verification demos work
 *   out of the box. Appends tolerate duplicate ids so re-seeding is idempotent.
 */
export async function seedRichDemo(
  repos: Repositories,
  options?: { readonly auditLog?: IAuditLog },
): Promise<RichDemoSummary> {
  // ── 1. Organisations ─────────────────────────────────────────────────────

  await repos.organizations.save(
    must(
      createOrganization({
        id: "org-hq",
        name: "三栄建設株式会社（デモ）",
        type: "headquarters",
        status: "active",
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "org-hq",
    ),
  );
  await repos.organizations.save(
    must(
      createOrganization({
        id: "org-branch",
        name: "東京支店（デモ）",
        type: "branch",
        status: "active",
        parentId: "org-hq",
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "org-branch",
    ),
  );
  await repos.organizations.save(
    must(
      createOrganization({
        id: "org-site-01",
        name: "港区現場（デモ）",
        type: "site",
        status: "active",
        parentId: "org-branch",
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "org-site-01",
    ),
  );
  await repos.organizations.save(
    must(
      createOrganization({
        id: "org-site-a",
        name: "さいたま現場（デモ）",
        type: "site",
        status: "active",
        parentId: "org-branch",
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "org-site-a",
    ),
  );
  await repos.organizations.save(
    must(
      createOrganization({
        id: "org-partner",
        name: "デモ足場工業株式会社（デモ）",
        type: "partner",
        status: "active",
        parentId: "org-branch",
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "org-partner",
    ),
  );

  // ── 2. Roles ─────────────────────────────────────────────────────────────

  await repos.roles.save(
    must(
      createRole({
        id: "role-admin",
        name: "Platform Administrator",
        description: "プラットフォーム全体の管理権限（デモ）",
        scope: "global",
        permissions: ["*:*"],
      }),
      "role-admin",
    ),
  );
  await repos.roles.save(
    must(
      createRole({
        id: "role-viewer",
        name: "Read-Only Viewer",
        description: "アプリ・デバイス・監査の閲覧のみ（デモ）",
        scope: "organization",
        permissions: ["application:read", "device:read", "audit:read"],
      }),
      "role-viewer",
    ),
  );
  await repos.roles.save(
    must(
      createRole({
        id: "role-site-manager",
        name: "Site Manager",
        description: "現場所長: 日報・写真・安全・品質・工程の実務権限（デモ）",
        scope: "site",
        permissions: [
          "application:read",
          "device:read",
          "device:write",
          "project:read",
          "daily-report:read",
          "daily-report:write",
          "workflow:read",
          "workflow:write",
          "photo:read",
          "photo:write",
          "safety:read",
          "safety:write",
          "quality:read",
          "quality:write",
          "cost:read",
          "document:read",
          "work-schedule:read",
          "work-schedule:write",
          "notification:read",
          "audit:read",
        ],
      }),
      "role-site-manager",
    ),
  );
  await repos.roles.save(
    must(
      createRole({
        id: "role-quality",
        name: "Quality Manager",
        description: "品質管理・ISO 文書・図面管理（デモ）",
        scope: "organization",
        permissions: [
          "project:read",
          "iso:read",
          "iso:write",
          "quality:read",
          "quality:write",
          "document:read",
          "document:write",
          "audit:read",
        ],
      }),
      "role-quality",
    ),
  );
  await repos.roles.save(
    must(
      createRole({
        id: "role-safety",
        name: "Safety Manager",
        description: "安全パトロール・KY・ヒヤリハット管理（デモ）",
        scope: "organization",
        permissions: [
          "project:read",
          "daily-report:read",
          "safety:read",
          "safety:write",
          "quality:read",
          "audit:read",
        ],
      }),
      "role-safety",
    ),
  );
  await repos.roles.save(
    must(
      createRole({
        id: "role-procurement",
        name: "Procurement",
        description: "発注・契約・原価の閲覧（デモ）",
        scope: "organization",
        permissions: [
          "project:read",
          "purchase-order:read",
          "purchase-order:write",
          "contract:read",
          "contract:write",
          "cost:read",
        ],
      }),
      "role-procurement",
    ),
  );
  await repos.roles.save(
    must(
      createRole({
        id: "role-auditor",
        name: "Auditor",
        description: "監査証跡の閲覧・持ち出し・規格準拠評価（デモ）",
        scope: "organization",
        permissions: [
          "audit:read",
          "audit:export",
          "iso:read",
          "policy:read",
          "governance:evaluate",
        ],
      }),
      "role-auditor",
    ),
  );
  await repos.roles.save(
    must(
      createRole({
        id: "role-operator",
        name: "Field Operator",
        description: "現場作業員: 日報・写真の登録（デモ）",
        scope: "site",
        permissions: [
          "device:read",
          "daily-report:read",
          "daily-report:write",
          "photo:read",
          "photo:write",
        ],
      }),
      "role-operator",
    ),
  );

  // ── 3. Users ─────────────────────────────────────────────────────────────

  const users = [
    must(
      createUser({
        id: "user-admin",
        organizationId: "org-hq",
        displayName: "システム管理者（デモ）",
        email: "admin@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-admin"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-admin",
    ),
    must(
      createUser({
        id: "user-viewer",
        organizationId: "org-hq",
        displayName: "経営閲覧者（デモ）",
        email: "viewer@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-viewer"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-viewer",
    ),
    must(
      createUser({
        id: "user-sm-a",
        organizationId: "org-site-01",
        displayName: "佐伯 岳（デモ）",
        email: "saeki.takeshi@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-site-manager"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-sm-a",
    ),
    must(
      createUser({
        id: "user-sm-b",
        organizationId: "org-site-a",
        displayName: "星野 圭（デモ）",
        email: "hoshino.kei@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-site-manager"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-sm-b",
    ),
    must(
      createUser({
        id: "user-quality",
        organizationId: "org-hq",
        displayName: "藤原 千晶（デモ）",
        email: "fujiwara.chiaki@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-quality"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-quality",
    ),
    must(
      createUser({
        id: "user-safety",
        organizationId: "org-hq",
        displayName: "宮下 進（デモ）",
        email: "miyashita.susumu@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-safety"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-safety",
    ),
    must(
      createUser({
        id: "user-procurement",
        organizationId: "org-hq",
        displayName: "高梨 珠実（デモ）",
        email: "takanashi.tamami@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-procurement"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-procurement",
    ),
    must(
      createUser({
        id: "user-auditor",
        organizationId: "org-hq",
        displayName: "綾小路 康平（デモ）",
        email: "ayanokoji.kohei@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-auditor"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-auditor",
    ),
    must(
      createUser({
        id: "user-op-a",
        organizationId: "org-site-01",
        displayName: "三雲 迅（デモ）",
        email: "mikumo.jin@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-operator"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-op-a",
    ),
    must(
      createUser({
        id: "user-op-b",
        organizationId: "org-site-01",
        displayName: "海老原 航（デモ）",
        email: "ebihara.wataru@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-operator"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-op-b",
    ),
    must(
      createUser({
        id: "user-partner",
        organizationId: "org-partner",
        displayName: "直江 仁（デモ）",
        email: "naoe.hitoshi@mirai-dx-demo.example",
        status: "active",
        roleIds: ["role-operator"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-partner",
    ),
    must(
      createUser({
        id: "user-suspended",
        organizationId: "org-partner",
        displayName: "退職者（デモ）",
        email: "suspended@mirai-dx-demo.example",
        status: "suspended",
        roleIds: ["role-operator"],
        createdAt: ts("2026-04-01T00:00:00.000Z"),
      }),
      "user-suspended",
    ),
  ];
  for (const user of users) {
    await repos.users.save(user);
  }

  // ── 4. Policies ──────────────────────────────────────────────────────────

  await repos.policies.save(
    must(
      createPolicy({
        id: "policy-allow-portal",
        name: "Allow Portal Read Access",
        effect: "allow",
        actions: ["read"],
        resources: ["application", "device"],
      }),
      "policy-allow-portal",
    ),
  );
  await repos.policies.save(
    must(
      createPolicy({
        id: "policy-deny-guest-audit",
        name: "Deny Guest Audit Access",
        effect: "deny",
        actions: ["read"],
        resources: ["audit"],
        conditions: [{ attribute: "subject", equals: "guest" }],
      }),
      "policy-deny-guest-audit",
    ),
  );
  await repos.policies.save(
    must(
      createPolicy({
        id: "policy-allow-field-devices",
        name: "Field Device Operations (site orgs only)",
        effect: "allow",
        actions: ["read", "write"],
        resources: ["device"],
        conditions: [{ attribute: "org.type", equals: "site" }],
      }),
      "policy-allow-field-devices",
    ),
  );
  await repos.policies.save(
    must(
      createPolicy({
        id: "policy-deny-ai-guests",
        name: "Deny AI Actions for External Subjects",
        effect: "deny",
        actions: ["read", "write"],
        resources: ["ai"],
        conditions: [{ attribute: "org.type", equals: "partner" }],
      }),
      "policy-deny-ai-guests",
    ),
  );

  // ── 5. Applications ──────────────────────────────────────────────────────

  await repos.applications.save(
    must(
      createApplication({
        id: "app-portal",
        key: "enterprise-portal",
        name: "Enterprise Portal",
        category: "portal",
        health: "healthy",
        ownerOrganizationId: "org-hq",
      }),
      "app-portal",
    ),
  );
  await repos.applications.save(
    must(
      createApplication({
        id: "app-field",
        key: "field-os",
        name: "Field OS",
        category: "field",
        health: "degraded",
        ownerOrganizationId: "org-site-01",
      }),
      "app-field",
    ),
  );
  await repos.applications.save(
    must(
      createApplication({
        id: "app-cmdb",
        key: "cmdb",
        name: "CMDB",
        category: "governance",
        health: "healthy",
        ownerOrganizationId: "org-hq",
      }),
      "app-cmdb",
    ),
  );
  await repos.applications.save(
    must(
      createApplication({
        id: "app-itsm",
        key: "itsm",
        name: "ITSM",
        category: "workflow",
        health: "degraded",
        ownerOrganizationId: "org-hq",
      }),
      "app-itsm",
    ),
  );
  await repos.applications.save(
    must(
      createApplication({
        id: "app-ims",
        key: "ims",
        name: "Integrated Management System",
        category: "governance",
        health: "healthy",
        ownerOrganizationId: "org-hq",
      }),
      "app-ims",
    ),
  );
  await repos.applications.save(
    must(
      createApplication({
        id: "app-doc",
        key: "document-service",
        name: "Document Service",
        category: "document",
        health: "down",
        ownerOrganizationId: "org-hq",
      }),
      "app-doc",
    ),
  );

  // ── 6. Devices ───────────────────────────────────────────────────────────

  await repos.devices.save(
    must(
      createDevice({
        id: "device-tablet-01",
        organizationId: "org-site-01",
        kind: "tablet",
        status: "active",
        assignedUserId: "user-op-a",
        lastSeenAt: ts("2026-08-12T07:55:00.000Z"),
      }),
      "device-tablet-01",
    ),
  );
  await repos.devices.save(
    must(
      createDevice({
        id: "device-phone-a",
        organizationId: "org-site-01",
        kind: "phone",
        status: "active",
        assignedUserId: "user-op-b",
        lastSeenAt: ts("2026-08-12T07:58:00.000Z"),
      }),
      "device-phone-a",
    ),
  );
  await repos.devices.save(
    must(
      createDevice({
        id: "device-kiosk-01",
        organizationId: "org-site-01",
        kind: "kiosk",
        status: "active",
        lastSeenAt: ts("2026-08-12T08:02:00.000Z"),
      }),
      "device-kiosk-01",
    ),
  );
  await repos.devices.save(
    must(
      createDevice({
        id: "device-sensor-01",
        organizationId: "org-site-01",
        kind: "sensor",
        status: "provisioned",
        lastSeenAt: ts("2026-08-12T08:05:00.000Z"),
        metadata: { type: "dust-noise", pm25: "12", noiseDb: "64" },
      }),
      "device-sensor-01",
    ),
  );
  await repos.devices.save(
    must(
      createDevice({
        id: "device-drone-a",
        organizationId: "org-site-a",
        kind: "sensor",
        status: "active",
        lastSeenAt: ts("2026-08-11T10:20:00.000Z"),
        metadata: { type: "drone", model: "DEMO-DRONE-X1" },
      }),
      "device-drone-a",
    ),
  );
  await repos.devices.save(
    must(
      createDevice({
        id: "device-laptop-hq",
        organizationId: "org-hq",
        kind: "laptop",
        status: "active",
        assignedUserId: "user-quality",
        lastSeenAt: ts("2026-08-12T09:01:00.000Z"),
      }),
      "device-laptop-hq",
    ),
  );
  await repos.devices.save(
    must(
      createDevice({
        id: "device-tablet-retired",
        organizationId: "org-site-01",
        kind: "tablet",
        status: "retired",
        lastSeenAt: ts("2026-06-30T12:00:00.000Z"),
      }),
      "device-tablet-retired",
    ),
  );

  // ── 7. Projects ──────────────────────────────────────────────────────────

  await repos.projects.save(
    must(
      createProject({
        id: "project-demo-1",
        organizationId: "org-hq",
        projectCode: "DEMO-2026-001",
        name: "橋梁補修工事（デモ）",
        description: "臨海高架橋の橋台・橋脚補修（MVP デモ案件）",
        clientName: "東京都港区土木事務所（デモ）",
        siteAddress: "東京都港区デモ海岸1-2-3",
        status: "in_progress",
        startDate: "2026-04-01",
        endDate: "2026-12-28",
        budget: 128_000_000,
        managerId: "user-sm-a",
        createdAt: ts("2026-04-01T01:00:00.000Z"),
      }),
      "project-demo-1",
    ),
  );
  await repos.projects.save(
    must(
      createProject({
        id: "d-project-tunnel",
        organizationId: "org-hq",
        projectCode: "DEMO-2026-002",
        name: "第二桜山トンネル改修工事（デモ）",
        description: "覆工補強と換気設備更新",
        clientName: "国土交通省デモ地方整備局（デモ）",
        siteAddress: "埼玉県デモ市桜山町9-9-9",
        status: "planning",
        startDate: "2026-10-01",
        endDate: "2027-09-30",
        budget: 640_000_000,
        managerId: "user-sm-b",
        createdAt: ts("2026-06-15T00:00:00.000Z"),
      }),
      "d-project-tunnel",
    ),
  );
  await repos.projects.save(
    must(
      createProject({
        id: "d-project-road",
        organizationId: "org-hq",
        projectCode: "DEMO-2026-003",
        name: "みなと臨海道路舗装工事（デモ）",
        clientName: "横浜市デモ道路局（デモ）",
        siteAddress: "神奈川県横浜市デモ区みなと町7-7",
        status: "completed",
        startDate: "2026-02-02",
        endDate: "2026-06-30",
        budget: 86_400_000,
        managerId: "user-sm-a",
        createdAt: ts("2026-01-20T00:00:00.000Z"),
      }),
      "d-project-road",
    ),
  );
  await repos.projects.save(
    must(
      createProject({
        id: "d-project-bridge",
        organizationId: "org-hq",
        projectCode: "DEMO-2026-004",
        name: "清流川橋架替工事（デモ）",
        description: "老朽化した橋梁の架け替え",
        clientName: "埼玉県デモ県土整備事務所（デモ）",
        siteAddress: "埼玉県デモ郡清流町3-3-3",
        status: "in_progress",
        startDate: "2026-05-11",
        endDate: "2027-03-31",
        budget: 495_000_000,
        managerId: "user-sm-b",
        createdAt: ts("2026-05-01T00:00:00.000Z"),
      }),
      "d-project-bridge",
    ),
  );
  await repos.projects.save(
    must(
      createProject({
        id: "d-project-building",
        organizationId: "org-hq",
        projectCode: "DEMO-2026-005",
        name: "中央駅前複合ビル耐震改修（デモ）",
        clientName: "デモ不動産開発株式会社（デモ）",
        siteAddress: "東京都デモ区中央1-1-1",
        status: "suspended",
        startDate: "2026-03-02",
        endDate: "2026-11-28",
        budget: 214_000_000,
        managerId: "user-sm-a",
        createdAt: ts("2026-02-15T00:00:00.000Z"),
      }),
      "d-project-building",
    ),
  );

  // ── 8. Daily reports (draft → submitted → approved) ─────────────────────

  const report1 = must(
    createDailyReport({
      id: "d-report-1",
      organizationId: "org-site-01",
      projectId: "project-demo-1",
      reportDate: "2026-08-03",
      weather: "sunny",
      temperature: 31.5,
      workerCount: 12,
      workContent: "橋台A型枠組立・支保工設置",
      safetyCheck: true,
      progressRate: 12,
      createdAt: ts("2026-08-03T17:30:00.000Z"),
    }),
    "d-report-1",
  );
  const report1Submitted = must(
    transitionDailyReport(report1, "submitted", ts("2026-08-03T17:31:00.000Z")),
    "d-report-1 submitted",
  );
  await repos.dailyReports.save(
    must(
      transitionDailyReport(report1Submitted, "approved", ts("2026-08-04T08:10:00.000Z")),
      "d-report-1 approved",
    ),
  );

  const report2 = must(
    createDailyReport({
      id: "d-report-2",
      organizationId: "org-site-01",
      projectId: "project-demo-1",
      reportDate: "2026-08-04",
      weather: "cloudy",
      temperature: 28,
      workerCount: 10,
      workContent: "橋台B鉄筋組立（主筋・帯筋）",
      safetyCheck: true,
      progressRate: 26,
      createdAt: ts("2026-08-04T17:20:00.000Z"),
    }),
    "d-report-2",
  );
  const report2Submitted = must(
    transitionDailyReport(report2, "submitted", ts("2026-08-04T17:22:00.000Z")),
    "d-report-2 submitted",
  );
  await repos.dailyReports.save(
    must(
      transitionDailyReport(report2Submitted, "approved", ts("2026-08-05T08:05:00.000Z")),
      "d-report-2 approved",
    ),
  );

  const report3 = must(
    createDailyReport({
      id: "d-report-3",
      organizationId: "org-site-01",
      projectId: "project-demo-1",
      reportDate: "2026-08-05",
      weather: "rainy",
      temperature: 24.5,
      workerCount: 6,
      workContent: "橋台Bコンクリート打設（雨天のため午前中止）",
      safetyCheck: true,
      safetyNotes: "雨養生・滑り止め対策実施",
      progressRate: 30,
      issues: "降雨により打設を2時間中断。翌日継続予定",
      createdAt: ts("2026-08-05T17:40:00.000Z"),
    }),
    "d-report-3",
  );
  await repos.dailyReports.save(
    must(
      transitionDailyReport(report3, "submitted", ts("2026-08-05T17:41:00.000Z")),
      "d-report-3 submitted",
    ),
  );

  const report4 = must(
    createDailyReport({
      id: "d-report-4",
      organizationId: "org-site-01",
      projectId: "project-demo-1",
      reportDate: "2026-08-06",
      weather: "sunny",
      temperature: 33,
      workerCount: 14,
      workContent: "橋台C配筋・型枠組立",
      safetyCheck: true,
      progressRate: 41,
      createdAt: ts("2026-08-06T17:25:00.000Z"),
    }),
    "d-report-4",
  );
  await repos.dailyReports.save(
    must(
      transitionDailyReport(report4, "submitted", ts("2026-08-06T17:26:00.000Z")),
      "d-report-4 submitted",
    ),
  );

  await repos.dailyReports.save(
    must(
      createDailyReport({
        id: "d-report-5",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        reportDate: "2026-08-07",
        weather: "sunny",
        temperature: 30,
        workerCount: 9,
        workContent: "橋台Cコンクリート打設",
        safetyCheck: true,
        progressRate: 55,
        createdAt: ts("2026-08-07T17:15:00.000Z"),
      }),
      "d-report-5",
    ),
  );
  await repos.dailyReports.save(
    must(
      createDailyReport({
        id: "d-report-6",
        organizationId: "org-site-a",
        projectId: "d-project-bridge",
        reportDate: "2026-08-10",
        weather: "sunny",
        temperature: 34,
        workerCount: 16,
        workContent: "仮桟橋撤去・河川内清掃",
        safetyCheck: true,
        progressRate: 8,
        createdAt: ts("2026-08-10T17:50:00.000Z"),
      }),
      "d-report-6",
    ),
  );

  // ── 9. Contracts + legal evidence ────────────────────────────────────────

  await repos.contracts.save(
    must(
      createContract({
        id: "d-contract-1",
        organizationId: "org-hq",
        projectId: "project-demo-1",
        contractType: "prime",
        contractNumber: "DEMO-CT-2026-0001",
        title: "橋梁補修工事 元請契約（デモ）",
        party: "東京都港区土木事務所（デモ）",
        periodStart: "2026-04-01",
        periodEnd: "2026-12-28",
        amount: 128_000_000,
        aiRiskScore: "low",
        status: "active",
        createdAt: ts("2026-03-25T00:00:00.000Z"),
      }),
      "d-contract-1",
    ),
  );
  await repos.contracts.save(
    must(
      createContract({
        id: "d-contract-2",
        organizationId: "org-hq",
        projectId: "project-demo-1",
        contractType: "subcontract",
        contractNumber: "DEMO-CT-2026-0002",
        title: "仮設足場工事 下請契約（デモ）",
        party: "デモ足場工業株式会社（デモ）",
        periodStart: "2026-04-05",
        periodEnd: "2026-10-31",
        amount: 12_800_000,
        aiRiskScore: "medium",
        status: "active",
        createdAt: ts("2026-03-28T00:00:00.000Z"),
      }),
      "d-contract-2",
    ),
  );
  await repos.contracts.save(
    must(
      createContract({
        id: "d-contract-3",
        organizationId: "org-hq",
        projectId: "d-project-tunnel",
        contractType: "subcontract",
        contractNumber: "DEMO-CT-2026-0003",
        title: "トンネル機械リース契約（デモ）",
        party: "デモトンネル機械リース株式会社（デモ）",
        amount: 48_000_000,
        aiRiskScore: "pending",
        status: "draft",
        createdAt: ts("2026-07-01T00:00:00.000Z"),
      }),
      "d-contract-3",
    ),
  );
  await repos.contracts.save(
    must(
      createContract({
        id: "d-contract-4",
        organizationId: "org-hq",
        projectId: "d-project-road",
        contractType: "prime",
        contractNumber: "DEMO-CT-2025-0120",
        title: "臨海道路舗装工事 元請契約（デモ）",
        party: "横浜市デモ道路局（デモ）",
        periodStart: "2026-02-02",
        periodEnd: "2026-06-30",
        amount: 86_400_000,
        aiRiskScore: "low",
        status: "completed",
        createdAt: ts("2026-01-15T00:00:00.000Z"),
      }),
      "d-contract-4",
    ),
  );
  await repos.contracts.save(
    must(
      createContract({
        id: "d-contract-5",
        organizationId: "org-hq",
        projectId: "d-project-building",
        contractType: "prime",
        contractNumber: "DEMO-CT-2026-0004",
        title: "複合ビル耐震改修 元請契約（デモ）",
        party: "デモ不動産開発株式会社（デモ）",
        amount: 214_000_000,
        aiRiskScore: "high",
        status: "terminated",
        description: "発注者都合により工事中断・解除（デモ）",
        createdAt: ts("2026-02-10T00:00:00.000Z"),
      }),
      "d-contract-5",
    ),
  );
  await repos.contracts.save(
    must(
      createContract({
        id: "d-contract-6",
        organizationId: "org-hq",
        projectId: "d-project-bridge",
        contractType: "subcontract",
        contractNumber: "DEMO-CT-2026-0005",
        title: "上部工製作 下請契約（デモ）",
        party: "デモ鋼構造工業株式会社（デモ）",
        amount: 36_000_000,
        aiRiskScore: "medium",
        status: "active",
        createdAt: ts("2026-05-20T00:00:00.000Z"),
      }),
      "d-contract-6",
    ),
  );

  const evidences = [
    must(
      createLegalEvidence({
        id: "d-evidence-1",
        organizationId: "org-hq",
        contractId: "d-contract-1",
        eventType: "contract_signed",
        description: "契約書の双方署名完了（デモ）",
        evidenceHash: fakeHash("contract-1-signed"),
        occurredAt: ts("2026-03-25T02:00:00.000Z"),
        createdAt: ts("2026-03-25T02:00:00.000Z"),
      }),
      "d-evidence-1",
    ),
    must(
      createLegalEvidence({
        id: "d-evidence-2",
        organizationId: "org-hq",
        contractId: "d-contract-1",
        eventType: "change_order",
        description: "設計変更に伴う契約変更指示書（デモ）",
        evidenceHash: fakeHash("contract-1-change-order"),
        occurredAt: ts("2026-06-10T00:00:00.000Z"),
        createdAt: ts("2026-06-10T00:00:00.000Z"),
      }),
      "d-evidence-2",
    ),
    must(
      createLegalEvidence({
        id: "d-evidence-3",
        organizationId: "org-hq",
        contractId: "d-contract-2",
        eventType: "notice_received",
        description: "足場材搬入日の事前通知を受領（デモ）",
        evidenceHash: fakeHash("contract-2-notice"),
        occurredAt: ts("2026-07-28T00:00:00.000Z"),
        createdAt: ts("2026-07-28T00:00:00.000Z"),
      }),
      "d-evidence-3",
    ),
    must(
      createLegalEvidence({
        id: "d-evidence-4",
        organizationId: "org-hq",
        contractId: "d-contract-4",
        eventType: "milestone_completed",
        description: "完工検査合格・引渡し完了（デモ）",
        evidenceHash: fakeHash("contract-4-completed"),
        occurredAt: ts("2026-06-30T00:00:00.000Z"),
        createdAt: ts("2026-06-30T00:00:00.000Z"),
      }),
      "d-evidence-4",
    ),
    must(
      createLegalEvidence({
        id: "d-evidence-5",
        organizationId: "org-hq",
        contractId: "d-contract-5",
        eventType: "termination_notice",
        description: "解除通知書を受領（デモ）",
        evidenceHash: fakeHash("contract-5-termination"),
        occurredAt: ts("2026-07-15T00:00:00.000Z"),
        createdAt: ts("2026-07-15T00:00:00.000Z"),
      }),
      "d-evidence-5",
    ),
  ];
  for (const evidence of evidences) {
    await repos.legalEvidences.save(evidence);
  }

  // ── 10. Purchase orders ──────────────────────────────────────────────────

  await repos.purchaseOrders.save(
    must(
      createPurchaseOrder({
        id: "d-po-1",
        organizationId: "org-hq",
        projectId: "project-demo-1",
        orderNumber: "DEMO-PO-2026-0001",
        supplier: "デモ生コン株式会社（デモ）",
        item: "生コンクリート 24N",
        quantity: 120,
        unitPrice: 14_500,
        status: "approved",
        createdAt: ts("2026-07-01T00:00:00.000Z"),
      }),
      "d-po-1",
    ),
  );
  await repos.purchaseOrders.save(
    must(
      createPurchaseOrder({
        id: "d-po-2",
        organizationId: "org-hq",
        projectId: "project-demo-1",
        orderNumber: "DEMO-PO-2026-0002",
        supplier: "デモ鉄筋商事株式会社（デモ）",
        item: "鉄筋 SD345 D16",
        quantity: 8_500,
        unitPrice: 118,
        status: "issued",
        createdAt: ts("2026-07-05T00:00:00.000Z"),
      }),
      "d-po-2",
    ),
  );
  await repos.purchaseOrders.save(
    must(
      createPurchaseOrder({
        id: "d-po-3",
        organizationId: "org-hq",
        projectId: "project-demo-1",
        orderNumber: "DEMO-PO-2026-0003",
        supplier: "デモ仮設資材株式会社（デモ）",
        item: "足場材一式",
        quantity: 1,
        unitPrice: 3_900_000,
        status: "received",
        createdAt: ts("2026-06-20T00:00:00.000Z"),
      }),
      "d-po-3",
    ),
  );
  await repos.purchaseOrders.save(
    must(
      createPurchaseOrder({
        id: "d-po-4",
        organizationId: "org-hq",
        projectId: "d-project-road",
        orderNumber: "DEMO-PO-2026-0004",
        supplier: "デモ合材プラント株式会社（デモ）",
        item: "アスファルト合材",
        quantity: 45,
        unitPrice: 13_500,
        status: "draft",
        createdAt: ts("2026-08-01T00:00:00.000Z"),
      }),
      "d-po-4",
    ),
  );
  await repos.purchaseOrders.save(
    must(
      createPurchaseOrder({
        id: "d-po-5",
        organizationId: "org-hq",
        projectId: "d-project-tunnel",
        orderNumber: "DEMO-PO-2026-0005",
        supplier: "デモ建機リース株式会社（デモ）",
        item: "レンタル発電機 100kVA",
        quantity: 2,
        unitPrice: 96_000,
        status: "cancelled",
        notes: "計画変更により不要となったため取消（デモ）",
        createdAt: ts("2026-07-10T00:00:00.000Z"),
      }),
      "d-po-5",
    ),
  );
  await repos.purchaseOrders.save(
    must(
      createPurchaseOrder({
        id: "d-po-6",
        organizationId: "org-hq",
        projectId: "d-project-bridge",
        orderNumber: "DEMO-PO-2026-0006",
        supplier: "デモ仮設資材株式会社（デモ）",
        item: "仮設トイレユニット",
        quantity: 3,
        unitPrice: 55_000,
        status: "received",
        createdAt: ts("2026-05-15T00:00:00.000Z"),
      }),
      "d-po-6",
    ),
  );

  // ── 11. Safety checks / quality inspections ─────────────────────────────

  await repos.safetyChecks.save(
    must(
      createSafetyCheck({
        id: "d-safety-1",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        checkDate: "2026-08-10",
        checkType: "daily",
        itemsTotal: 20,
        itemsOk: 20,
        itemsNg: 0,
        overallResult: "ok",
        inspectorId: "user-safety",
        createdAt: ts("2026-08-10T08:00:00.000Z"),
      }),
      "d-safety-1",
    ),
  );
  await repos.safetyChecks.save(
    must(
      createSafetyCheck({
        id: "d-safety-2",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        checkDate: "2026-08-11",
        checkType: "patrol",
        itemsTotal: 18,
        itemsOk: 16,
        itemsNg: 2,
        overallResult: "ng",
        notes: "高所作業時の安全帯未着用1件・立入禁止区域への進入1件（デモ）",
        inspectorId: "user-safety",
        createdAt: ts("2026-08-11T10:00:00.000Z"),
      }),
      "d-safety-2",
    ),
  );
  await repos.safetyChecks.save(
    must(
      createSafetyCheck({
        id: "d-safety-3",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        checkDate: "2026-08-12",
        checkType: "ky",
        itemsTotal: 12,
        itemsOk: 12,
        itemsNg: 0,
        overallResult: "ok",
        notes: "熱中症予防・水分補給の声かけ実施（デモ）",
        inspectorId: "user-sm-a",
        createdAt: ts("2026-08-12T07:30:00.000Z"),
      }),
      "d-safety-3",
    ),
  );

  await repos.qualityInspections.save(
    must(
      createQualityInspection({
        id: "d-quality-1",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        inspectionDate: "2026-08-06",
        inspectionType: "材料試験",
        targetItem: "コンクリート圧縮強度（橋台B・材齢28日）",
        standardValue: "24 N/mm² 以上",
        measuredValue: "26.8 N/mm²",
        result: "pass",
        inspectorId: "user-quality",
        createdAt: ts("2026-08-06T13:00:00.000Z"),
      }),
      "d-quality-1",
    ),
  );
  await repos.qualityInspections.save(
    must(
      createQualityInspection({
        id: "d-quality-2",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        inspectionDate: "2026-08-08",
        inspectionType: "出来形検査",
        targetItem: "鉄筋かぶり厚（橋台C）",
        standardValue: "60mm ±10",
        measuredValue: "52mm",
        result: "fail",
        notes: "基準値外のため補修計画を是正処置として登録（デモ）",
        inspectorId: "user-quality",
        createdAt: ts("2026-08-08T11:00:00.000Z"),
      }),
      "d-quality-2",
    ),
  );
  await repos.qualityInspections.save(
    must(
      createQualityInspection({
        id: "d-quality-3",
        organizationId: "org-site-01",
        projectId: "d-project-road",
        inspectionDate: "2026-06-20",
        inspectionType: "品質管理試験",
        targetItem: "アスファルト締固め度",
        standardValue: "96% 以上",
        measuredValue: "97.2%",
        result: "pass",
        inspectorId: "user-quality",
        createdAt: ts("2026-06-20T15:00:00.000Z"),
      }),
      "d-quality-3",
    ),
  );
  await repos.qualityInspections.save(
    must(
      createQualityInspection({
        id: "d-quality-4",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        inspectionDate: "2026-08-12",
        inspectionType: "外観検査",
        targetItem: "鉄筋継手部溶接外観",
        result: "pending",
        inspectorId: "user-quality",
        createdAt: ts("2026-08-12T09:00:00.000Z"),
      }),
      "d-quality-4",
    ),
  );

  // ── 12. Cost records / work hours ────────────────────────────────────────

  const costRecords = [
    [
      "d-cost-1",
      "2026-07-31",
      "労務費",
      "型枠工・鉄筋工労務費（デモ）",
      18_000_000,
      16_200_000,
      "デモ人材サービス株式会社（デモ）",
      "DEMO-INV-2026-0711",
    ],
    [
      "d-cost-2",
      "2026-07-31",
      "材料費",
      "生コン・鉄筋・セメント材料費（デモ）",
      42_000_000,
      40_500_000,
      "デモ生コン株式会社（デモ）",
      "DEMO-INV-2026-0712",
    ],
    [
      "d-cost-3",
      "2026-07-31",
      "外注費",
      "仮設足場・型枠外注費（デモ）",
      22_000_000,
      21_800_000,
      "デモ足場工業株式会社（デモ）",
      "DEMO-INV-2026-0713",
    ],
    [
      "d-cost-4",
      "2026-07-31",
      "機械経費",
      "クレーン・発電機リース費（デモ）",
      9_600_000,
      8_900_000,
      "デモ建機リース株式会社（デモ）",
      "DEMO-INV-2026-0714",
    ],
    [
      "d-cost-5",
      "2026-07-31",
      "共通仮設費",
      "仮囲い・現場事務所経費（デモ）",
      6_400_000,
      5_900_000,
      "デモ仮設資材株式会社（デモ）",
      "DEMO-INV-2026-0715",
    ],
  ] as const;
  for (const [id, date, category, description, budgeted, actual, vendor, invoice] of costRecords) {
    await repos.costRecords.save(
      must(
        createCostRecord({
          id,
          organizationId: "org-site-01",
          projectId: "project-demo-1",
          recordDate: date,
          category,
          description,
          budgetedAmount: budgeted,
          actualAmount: actual,
          vendorName: vendor,
          invoiceNumber: invoice,
          createdAt: ts("2026-07-31T18:00:00.000Z"),
        }),
        id,
      ),
    );
  }

  const workHours = [
    ["d-workhour-1", "user-op-a", "2026-08-04", 8, "型枠工"],
    ["d-workhour-2", "user-op-b", "2026-08-04", 8, "鉄筋工"],
    ["d-workhour-3", "user-partner", "2026-08-04", 7.5, "足場工"],
    ["d-workhour-4", "user-op-a", "2026-08-05", 8.5, "クレーン玉掛"],
    ["d-workhour-5", "user-op-b", "2026-08-05", 8, "鉄筋工"],
    ["d-workhour-6", "user-partner", "2026-08-05", 6, "足場工"],
  ] as const;
  for (const [id, workerId, date, hours, workType] of workHours) {
    await repos.workHours.save(
      must(
        createWorkHour({
          id,
          organizationId: "org-site-01",
          projectId: "project-demo-1",
          workerId,
          workDate: date,
          hours,
          workType,
          createdAt: ts(`${date}T18:00:00.000Z`),
        }),
        id,
      ),
    );
  }

  // ── 13. Work schedules ───────────────────────────────────────────────────

  await repos.workSchedules.save(
    must(
      createWorkSchedule({
        id: "d-schedule-1",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        workDate: "2026-08-11",
        title: "資材搬入（鉄筋・型枠材）",
        assignee: "user-op-a",
        status: "completed",
        createdAt: ts("2026-08-10T00:00:00.000Z"),
      }),
      "d-schedule-1",
    ),
  );
  await repos.workSchedules.save(
    must(
      createWorkSchedule({
        id: "d-schedule-2",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        workDate: "2026-08-12",
        title: "橋台C型枠組立",
        assignee: "user-op-a",
        status: "in_progress",
        createdAt: ts("2026-08-10T00:00:00.000Z"),
      }),
      "d-schedule-2",
    ),
  );
  await repos.workSchedules.save(
    must(
      createWorkSchedule({
        id: "d-schedule-3",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        workDate: "2026-08-13",
        title: "橋台Cコンクリート打設",
        assignee: "user-op-b",
        status: "planned",
        createdAt: ts("2026-08-10T00:00:00.000Z"),
      }),
      "d-schedule-3",
    ),
  );
  await repos.workSchedules.save(
    must(
      createWorkSchedule({
        id: "d-schedule-4",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        workDate: "2026-08-14",
        title: "養生・脱型",
        assignee: "user-op-a",
        status: "planned",
        createdAt: ts("2026-08-10T00:00:00.000Z"),
      }),
      "d-schedule-4",
    ),
  );
  await repos.workSchedules.save(
    must(
      createWorkSchedule({
        id: "d-schedule-5",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        workDate: "2026-08-10",
        title: "夜間配筋作業",
        assignee: "user-op-b",
        status: "cancelled",
        notes: "騒音規制のため中止（デモ）",
        createdAt: ts("2026-08-09T00:00:00.000Z"),
      }),
      "d-schedule-5",
    ),
  );

  // ── 14. Photos ───────────────────────────────────────────────────────────

  await repos.photos.save(
    must(
      createPhoto({
        id: "d-photo-1",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        fileName: "hashibaC_uchikomi_20260807.jpg",
        originalName: "橋台C打設状況.jpg",
        contentType: "image/jpeg",
        fileSize: 2_483_712,
        objectKey: "demo-photos/hashibaC_uchikomi_20260807.jpg",
        category: "progress",
        caption: "橋台C コンクリート打設状況（デモ）",
        takenAt: "2026-08-07T10:15:00.000Z",
        createdAt: ts("2026-08-07T10:20:00.000Z"),
      }),
      "d-photo-1",
    ),
  );
  await repos.photos.save(
    must(
      createPhoto({
        id: "d-photo-2",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        fileName: "anzen_patrol_20260811.jpg",
        originalName: "安全パトロール記録.jpg",
        contentType: "image/jpeg",
        fileSize: 1_204_224,
        objectKey: "demo-photos/anzen_patrol_20260811.jpg",
        category: "safety",
        caption: "合同安全パトロール（デモ）",
        takenAt: "2026-08-11T10:05:00.000Z",
        createdAt: ts("2026-08-11T10:10:00.000Z"),
      }),
      "d-photo-2",
    ),
  );
  await repos.photos.save(
    must(
      createPhoto({
        id: "d-photo-3",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        fileName: "kaburi_sokutei_20260808.jpg",
        originalName: "かぶり厚測定.jpg",
        contentType: "image/jpeg",
        fileSize: 936_448,
        objectKey: "demo-photos/kaburi_sokutei_20260808.jpg",
        category: "quality",
        caption: "鉄筋かぶり厚測定（デモ）",
        takenAt: "2026-08-08T11:30:00.000Z",
        createdAt: ts("2026-08-08T11:35:00.000Z"),
      }),
      "d-photo-3",
    ),
  );
  await repos.photos.save(
    must(
      createPhoto({
        id: "d-photo-4",
        organizationId: "org-site-01",
        projectId: "project-demo-1",
        fileName: "zenkei_20260801.jpg",
        originalName: "現場全景.jpg",
        contentType: "image/jpeg",
        fileSize: 3_145_728,
        objectKey: "demo-photos/zenkei_20260801.jpg",
        category: "general",
        caption: "現場全景（ドローン撮影・デモ）",
        takenAt: "2026-08-01T09:00:00.000Z",
        createdAt: ts("2026-08-01T09:05:00.000Z"),
      }),
      "d-photo-4",
    ),
  );
  await repos.photos.save(
    must(
      createPhoto({
        id: "d-photo-5",
        organizationId: "org-site-01",
        projectId: "d-project-road",
        fileName: "kannsei_kensa_20260630.jpg",
        originalName: "完成検査写真.jpg",
        contentType: "image/jpeg",
        fileSize: 2_097_152,
        objectKey: "demo-photos/kannsei_kensa_20260630.jpg",
        category: "handover",
        caption: "完工検査（デモ）",
        takenAt: "2026-06-30T14:00:00.000Z",
        createdAt: ts("2026-06-30T14:05:00.000Z"),
      }),
      "d-photo-5",
    ),
  );

  // ── 15. Documents ────────────────────────────────────────────────────────

  const documents = [
    ["d-doc-1", "project-demo-1", "橋台A配筋図 Rev.0（デモ）", "drawing", 0, "approved"],
    ["d-doc-2", "project-demo-1", "橋台A配筋図 Rev.1（デモ）", "drawing", 1, "issued"],
    ["d-doc-3", "project-demo-1", "コンクリート配合計画書（デモ）", "quality", 2, "approved"],
    ["d-doc-4", "project-demo-1", "施工計画書（安全）（デモ）", "safety", 1, "approved"],
    ["d-doc-5", "project-demo-1", "元請契約書（デモ）", "contract", 0, "issued"],
    ["d-doc-6", "project-demo-1", "週間工程会議議事録（デモ）", "other", 0, "review"],
  ] as const;
  for (const [id, projectId, title, documentType, revision, status] of documents) {
    await repos.documents.save(
      must(
        createDocument({
          id,
          organizationId: "org-hq",
          projectId,
          title,
          documentType,
          revision,
          status,
          fileSize: 512_000,
          tags: ["デモ", documentType],
          createdAt: ts("2026-06-01T00:00:00.000Z"),
        }),
        id,
      ),
    );
  }

  // ── 16. AI actions (governed) ────────────────────────────────────────────

  const ai1 = must(
    createAiAction({
      id: "d-ai-1",
      requester: "user-quality",
      organizationId: "org-hq",
      model: "demo:llm-simulator-v1",
      purpose: "施工計画書の要点抽出（デモ）",
      promptHash: fakeHash("ai-1-prompt"),
      evidenceRefs: ["d-doc-4"],
      inputRetentionDays: 7,
      piiSensitive: false,
      wrongAnswerMitigation: "生成結果は担当者の目視確認を必須とする",
      createdAt: ts("2026-08-01T09:00:00.000Z"),
    }),
    "d-ai-1",
  );
  await repos.aiActions.save(
    must(
      decideAiAction(ai1, {
        decision: "approved",
        decidedBy: "user-admin",
        decidedAt: ts("2026-08-01T10:00:00.000Z"),
        note: "根拠資料と検証手順を確認し承認（デモ）",
      }),
      "d-ai-1 approved",
    ),
  );
  await repos.aiActions.save(
    must(
      createAiAction({
        id: "d-ai-2",
        requester: "user-sm-a",
        organizationId: "org-site-01",
        model: "demo:llm-simulator-v1",
        purpose: "工事日誌の要約生成（デモ）",
        promptHash: fakeHash("ai-2-prompt"),
        inputRetentionDays: 0,
        piiSensitive: true,
        createdAt: ts("2026-08-12T08:00:00.000Z"),
      }),
      "d-ai-2",
    ),
  );
  const ai3 = must(
    createAiAction({
      id: "d-ai-3",
      requester: "user-procurement",
      organizationId: "org-hq",
      model: "demo:llm-simulator-v1",
      purpose: "下請契約書のリスク条項抽出（デモ）",
      promptHash: fakeHash("ai-3-prompt"),
      inputRetentionDays: 30,
      piiSensitive: false,
      createdAt: ts("2026-08-02T11:00:00.000Z"),
    }),
    "d-ai-3",
  );
  await repos.aiActions.save(
    must(
      decideAiAction(ai3, {
        decision: "rejected",
        decidedBy: "user-admin",
        decidedAt: ts("2026-08-02T12:00:00.000Z"),
        note: "根拠資料の添付が不足（デモ）",
      }),
      "d-ai-3 rejected",
    ),
  );
  const ai4 = must(
    createAiAction({
      id: "d-ai-4",
      requester: "user-admin",
      organizationId: "org-hq",
      model: "demo:llm-simulator-v1",
      purpose: "監査指摘の分類支援（デモ）",
      promptHash: fakeHash("ai-4-prompt"),
      inputRetentionDays: 14,
      piiSensitive: false,
      createdAt: ts("2026-07-20T09:00:00.000Z"),
    }),
    "d-ai-4",
  );
  const ai4Approved = must(
    decideAiAction(ai4, {
      decision: "approved",
      decidedBy: "user-auditor",
      decidedAt: ts("2026-07-20T10:00:00.000Z"),
    }),
    "d-ai-4 approved",
  );
  await repos.aiActions.save(
    must(
      setAiOperationStatus(ai4Approved, {
        status: "limited",
        actor: "user-admin",
        at: ts("2026-07-25T09:00:00.000Z"),
        reason: "精度検証中のため承認済み用途に限定（デモ）",
      }),
      "d-ai-4 limited",
    ),
  );

  // ── 17. Knowledge articles ───────────────────────────────────────────────

  await repos.knowledgeArticles.save(
    must(
      createKnowledgeArticle({
        id: "d-know-1",
        organizationId: "org-hq",
        title: "夏季の熱中症予防対策ガイド（デモ）",
        content: "水分補給・休憩計画・WBGT 計測と熱中症警戒アラートの運用手順（架空のデモ内容）。",
        category: "safety",
        tags: ["熱中症", "夏期"],
        isPublished: true,
        rating: 4.8,
        createdAt: ts("2026-07-01T00:00:00.000Z"),
      }),
      "d-know-1",
    ),
  );
  await repos.knowledgeArticles.save(
    must(
      createKnowledgeArticle({
        id: "d-know-2",
        organizationId: "org-hq",
        title: "コンクリート打設時の注意点 FAQ（デモ）",
        content:
          "打設速度・コールドジョイント対策・養生方法に関するよくある質問（架空のデモ内容）。",
        category: "faq",
        tags: ["コンクリート", "FAQ"],
        isPublished: true,
        rating: 4.5,
        createdAt: ts("2026-07-10T00:00:00.000Z"),
      }),
      "d-know-2",
    ),
  );
  await repos.knowledgeArticles.save(
    must(
      createKnowledgeArticle({
        id: "d-know-3",
        organizationId: "org-hq",
        title: "高所作業の基本ルール（デモ）",
        content: "安全帯・作業床・立入制限に関する社内ルール（架空のデモ内容）。",
        category: "safety",
        tags: ["高所作業", "安全"],
        isPublished: true,
        rating: 5,
        createdAt: ts("2026-07-15T00:00:00.000Z"),
      }),
      "d-know-3",
    ),
  );
  await repos.knowledgeArticles.save(
    must(
      createKnowledgeArticle({
        id: "d-know-4",
        organizationId: "org-hq",
        title: "仮設足場崩落ヒヤリ事例と再発防止（デモ）",
        content: "過去に共有された仮設足場のヒヤリハット事例と対策（架空のデモ内容）。",
        category: "incident",
        tags: ["足場", "ヒヤリハット"],
        isPublished: true,
        rating: 4.2,
        createdAt: ts("2026-07-20T00:00:00.000Z"),
      }),
      "d-know-4",
    ),
  );
  await repos.knowledgeArticles.save(
    must(
      createKnowledgeArticle({
        id: "d-know-5",
        organizationId: "org-hq",
        title: "下請契約チェックリスト（デモ）",
        content: "下請契約締結前に確認すべき条項の一覧（架空のデモ内容）。",
        category: "contract",
        tags: ["契約", "チェックリスト"],
        isPublished: false,
        createdAt: ts("2026-08-01T00:00:00.000Z"),
      }),
      "d-know-5",
    ),
  );
  await repos.knowledgeArticles.save(
    must(
      createKnowledgeArticle({
        id: "d-know-6",
        organizationId: "org-hq",
        title: "AI 要約: 施工計画書の要点（デモ）",
        content:
          "施工計画書から抽出した主要な工程・品質・安全の要点（AI 生成・承認済みのデモ内容）。",
        category: "general",
        tags: ["AI", "要約"],
        isPublished: true,
        rating: 4.2,
        aiGenerated: true,
        aiActionId: "d-ai-1",
        createdAt: ts("2026-08-01T10:30:00.000Z"),
      }),
      "d-know-6",
    ),
  );

  // ── 18. Notification templates / preferences / deliveries ───────────────

  await repos.notificationTemplates.save(
    must(
      createNotificationTemplate({
        id: "d-tmpl-1",
        organizationId: "org-hq",
        templateKey: "daily_report_submitted",
        subject: "日報が提出されました（デモ）",
        body: "{{projectName}} の {{reportDate}} の日報が提出されました。承認をお願いします。",
        channel: "email",
        createdAt: ts("2026-06-01T00:00:00.000Z"),
      }),
      "d-tmpl-1",
    ),
  );
  await repos.notificationTemplates.save(
    must(
      createNotificationTemplate({
        id: "d-tmpl-2",
        organizationId: "org-hq",
        templateKey: "approval_request",
        subject: "承認依頼があります（デモ）",
        body: "{{title}} の承認依頼が届いています。",
        channel: "slack",
        createdAt: ts("2026-06-01T00:00:00.000Z"),
      }),
      "d-tmpl-2",
    ),
  );
  await repos.notificationTemplates.save(
    must(
      createNotificationTemplate({
        id: "d-tmpl-3",
        organizationId: "org-hq",
        templateKey: "safety_alert",
        subject: "安全アラート（デモ）",
        body: "{{projectName}} で安全上の指摘が記録されました。",
        channel: "webhook",
        createdAt: ts("2026-06-01T00:00:00.000Z"),
      }),
      "d-tmpl-3",
    ),
  );

  await repos.notificationPreferences.save(
    must(
      createNotificationPreference({
        id: "d-pref-admin",
        organizationId: "org-hq",
        userId: "user-admin",
        emailEnabled: true,
        slackEnabled: true,
        events: {
          daily_report_submitted: true,
          approval_request: true,
          safety_alert: true,
        },
        createdAt: ts("2026-06-01T00:00:00.000Z"),
      }),
      "d-pref-admin",
    ),
  );
  await repos.notificationPreferences.save(
    must(
      createNotificationPreference({
        id: "d-pref-sm-a",
        organizationId: "org-site-01",
        userId: "user-sm-a",
        emailEnabled: true,
        slackEnabled: false,
        events: { daily_report_submitted: true, approval_request: true, safety_alert: false },
        createdAt: ts("2026-06-01T00:00:00.000Z"),
      }),
      "d-pref-sm-a",
    ),
  );
  await repos.notificationPreferences.save(
    must(
      createNotificationPreference({
        id: "d-pref-op-a",
        organizationId: "org-site-01",
        userId: "user-op-a",
        emailEnabled: false,
        slackEnabled: false,
        events: { safety_alert: true },
        createdAt: ts("2026-06-01T00:00:00.000Z"),
      }),
      "d-pref-op-a",
    ),
  );

  const ntf1 = must(
    createNotificationDelivery({
      id: "d-ntf-1",
      organizationId: "org-hq",
      userId: "user-admin",
      eventKey: "daily_report_submitted",
      channel: "email",
      subject: "日報が提出されました（デモ）",
      bodyPreview: "2026-08-05 の日報が提出されました。",
      createdAt: ts("2026-08-05T17:45:00.000Z"),
    }),
    "d-ntf-1",
  );
  await repos.notificationDeliveries.save({
    ...ntf1,
    status: "sent",
    attempts: 1,
    sentAt: ts("2026-08-05T17:45:05.000Z"),
    readAt: ts("2026-08-05T18:00:00.000Z"),
    updatedAt: ts("2026-08-05T18:00:00.000Z"),
  });

  await repos.notificationDeliveries.save(
    must(
      createNotificationDelivery({
        id: "d-ntf-2",
        organizationId: "org-hq",
        userId: "user-admin",
        eventKey: "approval_request",
        channel: "slack",
        subject: "承認依頼があります（デモ）",
        bodyPreview: "発注書 DEMO-PO-2026-0002 の承認依頼。",
        createdAt: ts("2026-08-12T09:30:00.000Z"),
      }),
      "d-ntf-2",
    ),
  );

  const ntf3 = must(
    createNotificationDelivery({
      id: "d-ntf-3",
      organizationId: "org-site-01",
      userId: "user-sm-a",
      eventKey: "safety_alert",
      channel: "webhook",
      subject: "安全アラート（デモ）",
      bodyPreview: "安全パトロールで指摘2件が記録されました。",
      createdAt: ts("2026-08-11T10:10:00.000Z"),
    }),
    "d-ntf-3",
  );
  await repos.notificationDeliveries.save({
    ...ntf3,
    status: "failed",
    attempts: 1,
    errorDetail: "webhook not configured (demo)",
    failureKind: "not-configured",
    updatedAt: ts("2026-08-11T10:10:10.000Z"),
  });

  const ntf4 = must(
    createNotificationDelivery({
      id: "d-ntf-4",
      organizationId: "org-site-01",
      userId: "user-op-a",
      eventKey: "safety_alert",
      channel: "email",
      subject: "安全アラート（デモ）",
      createdAt: ts("2026-08-11T10:11:00.000Z"),
    }),
    "d-ntf-4",
  );
  await repos.notificationDeliveries.save({
    ...ntf4,
    status: "retry",
    attempts: 2,
    updatedAt: ts("2026-08-11T10:12:00.000Z"),
  });

  // ── 19. Workflows + instances ────────────────────────────────────────────

  await repos.workflows.save(
    must(
      createWorkflow({
        id: "d-wf-daily",
        name: "日報承認フロー（デモ）",
        type: "approval",
        status: "active",
        steps: [
          { key: "submit", name: "提出", requiredPermission: "daily-report:write" },
          { key: "approve", name: "所長承認", requiredPermission: "workflow:write" },
        ],
      }),
      "d-wf-daily",
    ),
  );
  await repos.workflows.save(
    must(
      createWorkflow({
        id: "d-wf-po",
        name: "発注承認フロー（デモ）",
        type: "approval",
        status: "active",
        steps: [
          { key: "draft", name: "起票", requiredPermission: "purchase-order:write" },
          { key: "procure", name: "調達承認", requiredPermission: "workflow:write" },
          { key: "finance", name: "経理承認", requiredPermission: "workflow:write" },
        ],
      }),
      "d-wf-po",
    ),
  );
  await repos.workflows.save(
    must(
      createWorkflow({
        id: "d-wf-safety",
        name: "安全アラート通知フロー（デモ）",
        type: "notification",
        status: "active",
        steps: [{ key: "notify", name: "安全通知", requiredPermission: "notification:write" }],
      }),
      "d-wf-safety",
    ),
  );

  await repos.workflowInstances.save(
    must(
      createWorkflowInstance({
        id: "d-wfi-1",
        workflowId: "d-wf-daily",
        organizationId: "org-site-01",
        subject: "user-op-a",
        stepKey: "approve",
        stepName: "所長承認",
        requestedAt: "2026-08-07T17:16:00.000Z",
        resourceType: "daily-report",
        resourceId: "d-report-5",
      }),
      "d-wfi-1",
    ),
  );
  const wfi2 = must(
    createWorkflowInstance({
      id: "d-wfi-2",
      workflowId: "d-wf-daily",
      organizationId: "org-site-01",
      subject: "user-op-a",
      stepKey: "approve",
      stepName: "所長承認",
      requestedAt: "2026-08-03T17:31:00.000Z",
      resourceType: "daily-report",
      resourceId: "d-report-1",
    }),
    "d-wfi-2",
  );
  await repos.workflowInstances.save(
    must(
      decideWorkflowInstance(wfi2, {
        decision: "approve",
        decidedBy: "user-sm-a",
        decidedAt: "2026-08-04T08:10:00.000Z",
        comment: "内容確認のうえ承認（デモ）",
      }),
      "d-wfi-2 approved",
    ),
  );
  const wfi3 = must(
    createWorkflowInstance({
      id: "d-wfi-3",
      workflowId: "d-wf-po",
      organizationId: "org-hq",
      subject: "user-procurement",
      stepKey: "procure",
      stepName: "調達承認",
      requestedAt: "2026-08-10T09:00:00.000Z",
      resourceType: "purchase-order",
      resourceId: "d-po-5",
    }),
    "d-wfi-3",
  );
  await repos.workflowInstances.save(
    must(
      decideWorkflowInstance(wfi3, {
        decision: "reject",
        decidedBy: "user-procurement",
        decidedAt: "2026-08-10T10:00:00.000Z",
        comment: "単価根拠が不足（デモ）",
      }),
      "d-wfi-3 rejected",
    ),
  );
  await repos.workflowInstances.save(
    must(
      createWorkflowInstance({
        id: "d-wfi-4",
        workflowId: "d-wf-po",
        organizationId: "org-hq",
        subject: "user-procurement",
        stepKey: "finance",
        stepName: "経理承認",
        requestedAt: "2026-08-12T09:30:00.000Z",
        resourceType: "purchase-order",
        resourceId: "d-po-2",
      }),
      "d-wfi-4",
    ),
  );

  // ── 20. ISO records (kind-discriminated, parents before children) ────────

  const isoRecords = [
    {
      id: "d-iso-qp",
      kind: "quality-plan" as const,
      projectId: "project-demo-1",
      number: "DEMO-QP-2026-001",
      title: "橋梁補修工事 品質計画（デモ）",
      status: "published",
      payload: { planNo: "DEMO-QP-2026-001", target: "橋台A〜C補修" },
    },
    {
      id: "d-iso-qi",
      kind: "quality-inspection" as const,
      title: "コンクリート圧縮強度試験（デモ）",
      status: "pass",
      payload: { inspectionType: "圧縮強度試験", measured: "26.8 N/mm²" },
    },
    {
      id: "d-iso-nc",
      kind: "nonconformity" as const,
      projectId: "project-demo-1",
      title: "鉄筋かぶり厚不足（デモ）",
      status: "in_progress",
      payload: { description: "橋台Cのかぶり厚が基準値を下回る", severity: "moderate" },
    },
    {
      id: "d-iso-env-aspect",
      kind: "environmental-aspect" as const,
      title: "夜間作業の騒音・振動（デモ）",
      status: "major",
      payload: { aspectName: "騒音・振動", activity: "夜間コンクリート打設" },
    },
    {
      id: "d-iso-legal",
      kind: "legal-requirement" as const,
      title: "騒音規制法の適用確認（デモ）",
      status: "compliant",
      payload: { lawName: "騒音規制法", applicable: "夜間作業" },
    },
    {
      id: "d-iso-waste",
      kind: "waste-record" as const,
      projectId: "project-demo-1",
      title: "コンクリート殻の搬出記録（デモ）",
      status: "in_progress",
      payload: { wasteType: "コンクリート殻", quantity: 12.5, unit: "t" },
    },
    {
      id: "d-iso-hazard",
      kind: "hazard" as const,
      projectId: "project-demo-1",
      title: "開口部からの墜落危険（デモ）",
      status: "high",
      payload: {
        workActivity: "高所作業",
        hazardType: "墜落",
        hazardDescription: "開口部付近での型枠作業",
      },
    },
    {
      id: "d-iso-near-miss",
      kind: "near-miss" as const,
      projectId: "project-demo-1",
      title: "吊荷直下の通行（デモ）",
      status: "closed",
      payload: { description: "クレーン吊荷の直下を作業員が通行した", location: "橋台B付近" },
    },
    {
      id: "d-iso-edu",
      kind: "safety-education" as const,
      title: "新規入場者教育（デモ）",
      status: "closed",
      payload: { educationType: "新規入場者教育", participants: 8 },
    },
    {
      id: "d-iso-tbt",
      kind: "toolbox-talk" as const,
      projectId: "project-demo-1",
      title: "熱中症予防 KY（デモ）",
      status: "closed",
      payload: { topic: "熱中症予防", conductedAt: "2026-08-12" },
    },
    {
      id: "d-iso-si",
      kind: "safety-inspection" as const,
      projectId: "project-demo-1",
      title: "合同安全パトロール（デモ）",
      status: "closed",
      payload: { inspectionType: "合同パトロール", inspectedAt: "2026-08-11" },
    },
    {
      id: "d-iso-incident",
      kind: "safety-incident" as const,
      projectId: "project-demo-1",
      title: "仮設通路の手すり破損（デモ）",
      status: "open",
      payload: {
        incidentType: "unsafe_condition",
        occurredAt: "2026-08-11T08:40:00.000Z",
        description: "仮設通路の手すりが破損していた",
      },
    },
    {
      id: "d-iso-asset",
      kind: "asset" as const,
      title: "クローラクレーン 50t（デモ）",
      status: "active",
      payload: { name: "クローラクレーン 50t", assetType: "construction_machinery" },
    },
    {
      id: "d-iso-asset-mp",
      kind: "asset-maintenance-plan" as const,
      parentId: "d-iso-asset",
      title: "クレーン定期点検計画（デモ）",
      status: "active",
      payload: { maintenanceType: "定期点検", intervalMonths: 6 },
    },
    {
      id: "d-iso-asset-insp",
      kind: "asset-inspection" as const,
      parentId: "d-iso-asset",
      title: "クレーン月次点検（デモ）",
      status: "pass",
      payload: { conductedAt: "2026-08-05", inspector: "user-safety" },
    },
    {
      id: "d-iso-asset-risk",
      kind: "asset-risk-assessment" as const,
      parentId: "d-iso-asset",
      title: "クレーン転倒リスク評価（デモ）",
      status: "medium",
      payload: {
        assessedAt: "2026-07-01",
        failureProbability: 0.02,
        consequenceSeverity: 0.8,
      },
    },
    {
      id: "d-iso-asset-disposal",
      kind: "asset-disposal" as const,
      title: "老朽発電機の売却（デモ）",
      status: "closed",
      payload: {
        disposalType: "売却",
        disposalDate: "2026-07-31",
        reason: "耐用年数超過",
      },
    },
    {
      id: "d-iso-asset-handover",
      kind: "asset-handover" as const,
      projectId: "project-demo-1",
      title: "高所作業車の引渡し（デモ）",
      status: "in_progress",
      payload: {
        handoverDate: "2026-08-01",
        handoverFrom: "デモ機材センター（デモ）",
        handoverTo: "港区現場（デモ）",
        handoverType: "リース",
      },
    },
    {
      id: "d-iso-eir",
      kind: "bim-eir" as const,
      title: "発注者情報要件 EIR（デモ）",
      status: "published",
      payload: { owner: "東京都港区土木事務所（デモ）" },
    },
    {
      id: "d-iso-bep",
      kind: "bim-bep" as const,
      projectId: "project-demo-1",
      parentId: "d-iso-eir",
      title: "橋梁補修 BIM 実行計画 BEP（デモ）",
      status: "approved",
      payload: { author: "user-quality" },
    },
    {
      id: "d-iso-container",
      kind: "bim-container" as const,
      projectId: "project-demo-1",
      title: "橋台B モデルコンテナ（デモ）",
      status: "shared",
      payload: { containerCode: "DEMO-MDL-BRG-B-001" },
    },
    {
      id: "d-iso-coord",
      kind: "bim-coordination-issue" as const,
      projectId: "project-demo-1",
      title: "配筋と埋設管の干渉（デモ）",
      status: "open",
      payload: { issueType: "干渉", discipline: "構造/設備" },
    },
    {
      id: "d-iso-audit-plan",
      kind: "audit-plan" as const,
      title: "ISO9001 内部監査計画（デモ）",
      status: "planned",
      payload: { isoStandard: "ISO9001", scheduledAt: "2026-08-20" },
    },
    {
      id: "d-iso-audit-finding",
      kind: "audit-finding" as const,
      parentId: "d-iso-audit-plan",
      title: "記録の署名漏れ（デモ）",
      status: "open",
      payload: { findingType: "minor", description: "一部の点検記録に署名がなかった" },
    },
    {
      id: "d-iso-corrective",
      kind: "corrective-action" as const,
      parentId: "d-iso-audit-finding",
      title: "署名漏れの再発防止（デモ）",
      status: "in_progress",
      payload: { sourceType: "audit_finding", description: "点検記録のチェックリスト化" },
    },
    {
      id: "d-iso-isms-asset",
      kind: "isms-asset" as const,
      title: "施工管理サーバ（デモ）",
      status: "open",
      payload: { name: "施工管理サーバ", assetType: "server", classification: "confidential" },
    },
    {
      id: "d-iso-isms-threat",
      kind: "isms-threat" as const,
      title: "マルウェア感染の脅威（デモ）",
      status: "open",
      payload: {
        threatType: "マルウェア",
        description: "現場端末の感染",
        likelihood: 0.3,
        impact: 0.7,
      },
    },
    {
      id: "d-iso-isms-risk",
      kind: "isms-risk-assessment" as const,
      title: "情報セキュリティリスク評価（デモ）",
      status: "open",
      payload: { assessedAt: "2026-08-01", assessedBy: "user-auditor", overallRiskLevel: "medium" },
    },
    {
      id: "d-iso-isms-incident",
      kind: "isms-incident" as const,
      title: "不正ログイン試行（デモ）",
      status: "closed",
      payload: {
        incidentType: "unauthorized_access",
        occurredAt: "2026-07-20T03:00:00.000Z",
        description: "外部からのログイン試行を遮断した",
      },
    },
    {
      id: "d-iso-bcp-plan",
      kind: "bcp-plan" as const,
      title: "事業継続計画 BCP（デモ）",
      status: "published",
      payload: { scope: "全社・全現場" },
    },
    {
      id: "d-iso-bcp-scenario",
      kind: "bcp-risk-scenario" as const,
      title: "大規模地震シナリオ（デモ）",
      status: "open",
      payload: { scenarioType: "earthquake", probability: 0.1, impact: 0.9 },
    },
    {
      id: "d-iso-bcp-drill",
      kind: "bcp-drill" as const,
      title: "初動対応訓練（デモ）",
      status: "closed",
      payload: { drillType: "初動対応訓練", conductedAt: "2026-06-30" },
    },
  ];
  for (const record of isoRecords) {
    await repos.isoRecords.save(
      must(
        createIsoRecord({
          ...record,
          organizationId: "org-hq",
          createdBy: "user-quality",
          createdAt: ts("2026-06-01T00:00:00.000Z"),
        }),
        record.id,
      ),
    );
  }

  // ── 21. Integration events ───────────────────────────────────────────────

  await repos.integrationEvents.save(
    must(
      createIntegrationEvent({
        id: "d-int-1",
        system: "site-management",
        eventType: "site.daily_report",
        direction: "inbound",
        idempotencyKey: "demo-site-management-20260807-1",
        organizationId: "org-site-01",
        payload: { projectCode: "DEMO-2026-001", reportDate: "2026-08-07" },
        createdAt: ts("2026-08-07T17:20:00.000Z"),
      }),
      "d-int-1",
    ),
  );
  await repos.integrationEvents.save(
    must(
      createIntegrationEvent({
        id: "d-int-2",
        system: "photo-logger",
        eventType: "photo.captured",
        direction: "inbound",
        idempotencyKey: "demo-photo-logger-20260807-1",
        organizationId: "org-site-01",
        payload: { objectKey: "demo-photos/hashibaC_uchikomi_20260807.jpg" },
        createdAt: ts("2026-08-07T10:21:00.000Z"),
      }),
      "d-int-2",
    ),
  );
  await repos.integrationEvents.save(
    must(
      createIntegrationEvent({
        id: "d-int-3",
        system: "4d-planner",
        eventType: "schedule.updated",
        direction: "outbound",
        idempotencyKey: "demo-4d-20260812-1",
        organizationId: "org-hq",
        payload: { projectCode: "DEMO-2026-001" },
        createdAt: ts("2026-08-12T07:00:00.000Z"),
      }),
      "d-int-3",
    ),
  );
  const int4 = must(
    createIntegrationEvent({
      id: "d-int-4",
      system: "portfolio-atlas",
      eventType: "kpi.updated",
      direction: "outbound",
      idempotencyKey: "demo-atlas-20260812-1",
      organizationId: "org-hq",
      payload: { projectCode: "DEMO-2026-001", progressRate: 55 },
      createdAt: ts("2026-08-12T07:05:00.000Z"),
    }),
    "d-int-4",
  );
  await repos.integrationEvents.save(
    must(markIntegrationEvent(int4, "sent", ts("2026-08-12T07:05:01.000Z")), "d-int-4 sent"),
  );
  const int5 = must(
    createIntegrationEvent({
      id: "d-int-5",
      system: "dx-idea",
      eventType: "idea.submitted",
      direction: "outbound",
      idempotencyKey: "demo-idea-20260812-1",
      organizationId: "org-hq",
      payload: { ideaId: "DEMO-IDEA-001" },
      createdAt: ts("2026-08-12T07:10:00.000Z"),
    }),
    "d-int-5",
  );
  const int5Retrying = must(
    markIntegrationEvent(int5, "retrying", ts("2026-08-12T07:10:10.000Z"), "timeout"),
    "d-int-5 retrying",
  );
  await repos.integrationEvents.save(
    must(
      markIntegrationEvent(int5Retrying, "retrying", ts("2026-08-12T07:11:10.000Z"), "timeout"),
      "d-int-5 retrying 2",
    ),
  );
  const int6 = must(
    createIntegrationEvent({
      id: "d-int-6",
      system: "ai-build",
      eventType: "model.risk_assessed",
      direction: "outbound",
      idempotencyKey: "demo-ai-build-20260812-1",
      organizationId: "org-hq",
      payload: { model: "demo:llm-simulator-v1", risk: "medium" },
      createdAt: ts("2026-08-12T07:20:00.000Z"),
    }),
    "d-int-6",
  );
  await repos.integrationEvents.save(
    must(
      markIntegrationEvent(int6, "failed", ts("2026-08-12T07:20:30.000Z"), "502 upstream"),
      "d-int-6 failed",
    ),
  );

  // ── 22. Audit history (optional, so the evidence chain demos are non-empty)

  let auditEvents = 0;
  if (options?.auditLog !== undefined) {
    const auditSeed = [
      [
        "d-audit-1",
        "2026-04-01T00:05:00.000Z",
        "system",
        "organization:create",
        "org-hq",
        "success",
      ],
      ["d-audit-2", "2026-04-01T00:06:00.000Z", "user-admin", "auth:login", "api-key", "success"],
      [
        "d-audit-3",
        "2026-06-01T01:10:00.000Z",
        "user-quality",
        "iso:publish",
        "d-iso-qp",
        "success",
      ],
      [
        "d-audit-4",
        "2026-08-03T17:31:00.000Z",
        "user-op-a",
        "daily-report:submit",
        "d-report-1",
        "success",
      ],
      [
        "d-audit-5",
        "2026-08-04T08:10:00.000Z",
        "user-sm-a",
        "daily-report:approve",
        "d-report-1",
        "success",
      ],
      [
        "d-audit-6",
        "2026-08-11T10:10:00.000Z",
        "user-safety",
        "safety:create",
        "d-safety-2",
        "success",
      ],
      ["d-audit-7", "2026-08-11T10:15:00.000Z", "user-partner", "ai:read", "d-ai-1", "denied"],
      [
        "d-audit-8",
        "2026-08-12T09:30:00.000Z",
        "user-procurement",
        "workflow:request",
        "d-wfi-4",
        "success",
      ],
      [
        "d-audit-9",
        "2026-08-12T07:05:01.000Z",
        "system",
        "integration:send",
        "portfolio-atlas",
        "success",
      ],
      [
        "d-audit-10",
        "2026-08-12T07:20:30.000Z",
        "system",
        "integration:send",
        "ai-build",
        "failure",
      ],
    ] as const;
    for (const [id, at, actor, action, resource, outcome] of auditSeed) {
      const event = must(
        createAuditEvent({
          id,
          at: ts(at),
          actor,
          action,
          resource,
          outcome,
          metadata: { organizationId: "org-hq" },
        }),
        id,
      );
      try {
        options.auditLog.append(event);
        auditEvents += 1;
      } catch {
        // Duplicate id on re-seed: keep seeding idempotent.
      }
    }
  }

  return {
    organizations: 5,
    roles: 8,
    users: users.length,
    policies: 4,
    applications: 6,
    devices: 7,
    projects: 5,
    dailyReports: 6,
    contracts: 6,
    legalEvidences: evidences.length,
    purchaseOrders: 6,
    safetyChecks: 3,
    qualityInspections: 4,
    costRecords: costRecords.length,
    workHours: workHours.length,
    workSchedules: 5,
    photos: 5,
    documents: documents.length,
    knowledgeArticles: 6,
    aiActions: 4,
    notificationTemplates: 3,
    notificationPreferences: 3,
    notificationDeliveries: 4,
    workflows: 3,
    workflowInstances: 4,
    isoRecords: isoRecords.length,
    integrationEvents: 6,
    auditEvents,
  };
}
