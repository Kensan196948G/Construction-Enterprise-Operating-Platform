/**
 * ISO integrated-management domain (Civil-Construction-IMS absorption).
 *
 * The IMS Prisma model was re-architected into a single kind-discriminated
 * record store so every ISO entity shares CEOP's organisation scoping,
 * audit trail, pagination, and persistence guarantees. Kind metadata drives
 * validation, status transitions, and analytics without one repository per
 * Prisma model.
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";

export type IsoRecordId = Brand<string, "IsoRecordId">;
export const isoRecordId = (value: string): IsoRecordId => value as IsoRecordId;

export const ISO_KINDS = [
  "quality-plan",
  "quality-inspection",
  "nonconformity",
  "environmental-aspect",
  "legal-requirement",
  "waste-record",
  "hazard",
  "near-miss",
  "safety-education",
  "toolbox-talk",
  "safety-inspection",
  "safety-incident",
  "asset",
  "asset-maintenance-plan",
  "asset-inspection",
  "asset-risk-assessment",
  "asset-disposal",
  "asset-handover",
  "bim-eir",
  "bim-bep",
  "bim-container",
  "bim-coordination-issue",
  "audit-plan",
  "audit-finding",
  "corrective-action",
  "isms-asset",
  "isms-threat",
  "isms-risk-assessment",
  "isms-incident",
  "bcp-plan",
  "bcp-risk-scenario",
  "bcp-drill",
] as const;
export type IsoKind = (typeof ISO_KINDS)[number];

export const DOCUMENT_STATUSES = [
  "draft",
  "under_review",
  "approved",
  "published",
  "superseded",
  "withdrawn",
] as const;
export const CORRECTIVE_STATUSES = [
  "open",
  "in_progress",
  "pending_verification",
  "closed",
  "cancelled",
] as const;
export const AUDIT_STATUSES = ["planned", "in_progress", "completed", "cancelled"] as const;
export const INSPECTION_RESULTS = ["pending", "pass", "fail", "conditional_pass"] as const;
export const SAFETY_INSPECTION_STATUSES = ["open", "in_progress", "closed"] as const;
export const RISK_LEVELS = ["critical", "high", "medium", "low", "negligible"] as const;
export const SIGNIFICANCE_LEVELS = ["major", "moderate", "minor"] as const;
export const COMPLIANCE_STATUSES = [
  "compliant",
  "partially_compliant",
  "non_compliant",
  "not_applicable",
] as const;
export const ASSET_STATUSES = ["active", "inactive", "under_maintenance", "disposed"] as const;
export const ASSET_CONDITIONS = ["excellent", "good", "fair", "poor", "critical"] as const;
export const ASSET_CRITICALITIES = ["critical", "high", "medium", "low"] as const;
export const MAINTENANCE_STATUSES = ["active", "suspended", "completed"] as const;
export const SUITABILITY_CODES = ["S0", "S1", "S2", "S3", "S4", "S5", "S6"] as const;
export const CDE_STATUSES = ["work_in_progress", "shared", "published", "archived"] as const;
export const REVIEW_STATUSES = [
  "not_started",
  "in_review",
  "approved",
  "rejected",
  "revision_required",
] as const;
export const HANDOVER_STATUSES = ["not_initiated", "in_progress", "completed"] as const;
export const SEVERITY_LEVELS = ["critical", "high", "medium", "low"] as const;
export const INCIDENT_TYPES = [
  "accident",
  "near_miss_serious",
  "unsafe_condition",
  "unsafe_act",
  "occupational_disease",
] as const;

export interface IsoRecord {
  readonly id: IsoRecordId;
  readonly kind: IsoKind;
  readonly organizationId: string;
  readonly projectId?: string | undefined;
  /** Parent record (quality plan, asset, audit plan, BEP, ISMS asset, BCP plan). */
  readonly parentId?: string | undefined;
  readonly number?: string | undefined;
  readonly title: string;
  readonly status: string;
  /** Kind-specific fields; validated by {@link ISO_KIND_META}. */
  readonly payload: Readonly<Record<string, unknown>>;
  readonly createdBy: string;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly versionNo: number;
}

export interface CreateIsoRecordInput {
  readonly id: string;
  readonly kind: IsoKind;
  readonly organizationId: string;
  readonly projectId?: string | undefined;
  readonly parentId?: string | undefined;
  readonly number?: string | undefined;
  readonly title: string;
  readonly status?: string | undefined;
  readonly payload?: Readonly<Record<string, unknown>> | undefined;
  readonly createdBy: string;
  readonly createdAt: IsoTimestamp;
}

interface KindMeta {
  readonly label: string;
  readonly statuses: readonly string[];
  readonly required: readonly string[];
  readonly projectRequired: boolean;
}

const KIND_META: Readonly<Record<IsoKind, KindMeta>> = {
  "quality-plan": {
    label: "品質計画 (ISO 9001)",
    statuses: DOCUMENT_STATUSES,
    required: [],
    projectRequired: true,
  },
  "quality-inspection": {
    label: "品質検査 (ISO 9001)",
    statuses: INSPECTION_RESULTS,
    required: ["inspectionType"],
    projectRequired: false,
  },
  nonconformity: {
    label: "不適合 (ISO 9001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["description"],
    projectRequired: false,
  },
  "environmental-aspect": {
    label: "環境側面 (ISO 14001)",
    statuses: SIGNIFICANCE_LEVELS,
    required: ["aspectName"],
    projectRequired: false,
  },
  "legal-requirement": {
    label: "法的要求 (ISO 14001)",
    statuses: COMPLIANCE_STATUSES,
    required: ["lawName"],
    projectRequired: false,
  },
  "waste-record": {
    label: "廃棄物記録 (ISO 14001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["wasteType", "quantity", "unit"],
    projectRequired: false,
  },
  hazard: {
    label: "危険源 (ISO 45001)",
    statuses: RISK_LEVELS,
    required: ["workActivity", "hazardType", "hazardDescription"],
    projectRequired: false,
  },
  "near-miss": {
    label: "ヒヤリハット (ISO 45001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["description"],
    projectRequired: false,
  },
  "safety-education": {
    label: "安全教育 (ISO 45001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["educationType"],
    projectRequired: false,
  },
  "toolbox-talk": {
    label: "KY活動 (ISO 45001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["topic", "conductedAt"],
    projectRequired: false,
  },
  "safety-inspection": {
    label: "安全パトロール (ISO 45001)",
    statuses: SAFETY_INSPECTION_STATUSES,
    required: ["inspectionType", "inspectedAt"],
    projectRequired: false,
  },
  "safety-incident": {
    label: "事故・インシデント (ISO 45001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["incidentType", "occurredAt", "description"],
    projectRequired: false,
  },
  asset: {
    label: "資産台帳 (ISO 55001)",
    statuses: ASSET_STATUSES,
    required: ["name", "assetType"],
    projectRequired: false,
  },
  "asset-maintenance-plan": {
    label: "保全計画 (ISO 55001)",
    statuses: MAINTENANCE_STATUSES,
    required: ["maintenanceType"],
    projectRequired: false,
  },
  "asset-inspection": {
    label: "資産点検 (ISO 55001)",
    statuses: INSPECTION_RESULTS,
    required: ["conductedAt"],
    projectRequired: false,
  },
  "asset-risk-assessment": {
    label: "資産リスク評価 (ISO 55001)",
    statuses: RISK_LEVELS,
    required: ["assessedAt", "failureProbability", "consequenceSeverity"],
    projectRequired: false,
  },
  "asset-disposal": {
    label: "資産廃棄 (ISO 55001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["disposalType", "disposalDate", "reason"],
    projectRequired: false,
  },
  "asset-handover": {
    label: "資産引渡し (ISO 55001)",
    statuses: HANDOVER_STATUSES,
    required: ["handoverDate", "handoverFrom", "handoverTo", "handoverType"],
    projectRequired: false,
  },
  "bim-eir": {
    label: "EIR (ISO 19650)",
    statuses: DOCUMENT_STATUSES,
    required: [],
    projectRequired: false,
  },
  "bim-bep": {
    label: "BEP (ISO 19650)",
    statuses: DOCUMENT_STATUSES,
    required: [],
    projectRequired: true,
  },
  "bim-container": {
    label: "情報コンテナ (ISO 19650)",
    statuses: CDE_STATUSES,
    required: ["containerCode"],
    projectRequired: false,
  },
  "bim-coordination-issue": {
    label: "調整課題 (ISO 19650)",
    statuses: CORRECTIVE_STATUSES,
    required: ["issueType"],
    projectRequired: false,
  },
  "audit-plan": {
    label: "監査計画",
    statuses: AUDIT_STATUSES,
    required: ["isoStandard", "scheduledAt"],
    projectRequired: false,
  },
  "audit-finding": {
    label: "監査指摘",
    statuses: CORRECTIVE_STATUSES,
    required: ["findingType", "description"],
    projectRequired: false,
  },
  "corrective-action": {
    label: "是正処置",
    statuses: CORRECTIVE_STATUSES,
    required: ["sourceType", "description"],
    projectRequired: false,
  },
  "isms-asset": {
    label: "情報資産 (ISO 27001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["name", "assetType", "classification"],
    projectRequired: false,
  },
  "isms-threat": {
    label: "情報セキュリティ脅威 (ISO 27001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["threatType", "description", "likelihood", "impact"],
    projectRequired: false,
  },
  "isms-risk-assessment": {
    label: "情報セキュリティリスク評価 (ISO 27001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["assessedAt", "assessedBy", "overallRiskLevel"],
    projectRequired: false,
  },
  "isms-incident": {
    label: "情報セキュリティインシデント (ISO 27001)",
    statuses: CORRECTIVE_STATUSES,
    required: ["incidentType", "occurredAt", "description"],
    projectRequired: false,
  },
  "bcp-plan": {
    label: "事業継続計画 (BCP)",
    statuses: DOCUMENT_STATUSES,
    required: [],
    projectRequired: false,
  },
  "bcp-risk-scenario": {
    label: "BCPリスクシナリオ",
    statuses: CORRECTIVE_STATUSES,
    required: ["scenarioType", "probability", "impact"],
    projectRequired: false,
  },
  "bcp-drill": {
    label: "BCP訓練記録",
    statuses: CORRECTIVE_STATUSES,
    required: ["drillType", "conductedAt"],
    projectRequired: false,
  },
};

/** Shared action vocabulary for every ISO kind. */
export const ISO_ACTIONS = [
  "submit-review",
  "approve",
  "reject",
  "return",
  "publish",
  "withdraw",
  "start",
  "close",
  "complete",
  "cancel",
] as const;
export type IsoAction = (typeof ISO_ACTIONS)[number];

const TRANSITIONS: Readonly<Record<IsoKind, Readonly<Record<string, readonly string[]>>>> = {
  "quality-plan": {
    draft: ["submit-review"],
    under_review: ["approve", "reject", "return"],
    approved: ["publish"],
    published: ["withdraw"],
    withdrawn: ["submit-review"],
  },
  "quality-inspection": {
    pending: ["start", "complete"],
    in_progress: ["complete"],
    pass: ["complete"],
    fail: ["complete"],
    conditional_pass: ["complete"],
  },
  nonconformity: {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close", "cancel"],
    closed: [],
    cancelled: [],
  },
  "environmental-aspect": { major: ["close"], moderate: ["close"], minor: ["close"] },
  "legal-requirement": {
    compliant: ["close"],
    partially_compliant: ["close"],
    non_compliant: ["close"],
    not_applicable: ["close"],
  },
  "waste-record": {
    open: ["complete", "cancel"],
    in_progress: ["complete", "cancel"],
    pending_verification: ["complete"],
    closed: [],
    cancelled: [],
  },
  hazard: {
    critical: ["close"],
    high: ["close"],
    medium: ["close"],
    low: ["close"],
    negligible: ["close"],
  },
  "near-miss": {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close"],
    closed: [],
    cancelled: [],
  },
  "safety-education": {
    open: ["start", "complete", "cancel"],
    in_progress: ["complete"],
    pending_verification: ["complete"],
    closed: [],
    cancelled: [],
  },
  "toolbox-talk": {
    open: ["complete", "cancel"],
    in_progress: ["complete"],
    pending_verification: ["complete"],
    closed: [],
    cancelled: [],
  },
  "safety-inspection": {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    closed: [],
  },
  "safety-incident": {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close"],
    closed: [],
    cancelled: [],
  },
  asset: {
    active: ["close", "cancel"],
    inactive: ["close"],
    under_maintenance: ["close"],
    disposed: [],
  },
  "asset-maintenance-plan": {
    active: ["complete", "cancel"],
    suspended: ["close", "complete", "cancel"],
    completed: [],
  },
  "asset-inspection": {
    pending: ["complete"],
    in_progress: ["complete"],
    pass: ["complete"],
    fail: ["complete"],
    conditional_pass: ["complete"],
  },
  "asset-risk-assessment": {
    critical: ["close"],
    high: ["close"],
    medium: ["close"],
    low: ["close"],
    negligible: ["close"],
  },
  "asset-disposal": {
    open: ["approve", "cancel"],
    in_progress: ["approve", "complete", "cancel"],
    pending_verification: ["approve", "complete"],
    closed: [],
    cancelled: [],
  },
  "asset-handover": {
    not_initiated: ["start", "complete"],
    in_progress: ["complete"],
    completed: [],
  },
  "bim-eir": {
    draft: ["submit-review"],
    under_review: ["approve", "reject", "return"],
    approved: ["publish"],
    published: ["withdraw"],
    withdrawn: ["submit-review"],
  },
  "bim-bep": {
    draft: ["submit-review"],
    under_review: ["approve", "reject", "return"],
    approved: ["publish"],
    published: ["withdraw"],
    withdrawn: ["submit-review"],
  },
  "bim-container": {
    work_in_progress: ["submit-review", "publish", "withdraw"],
    shared: ["submit-review", "publish", "withdraw"],
    published: ["withdraw"],
    archived: [],
  },
  "bim-coordination-issue": {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close"],
    closed: [],
    cancelled: [],
  },
  "audit-plan": {
    planned: ["start", "cancel"],
    in_progress: ["complete", "cancel"],
    completed: [],
    cancelled: [],
  },
  "audit-finding": {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close"],
    closed: [],
    cancelled: [],
  },
  "corrective-action": {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close"],
    closed: [],
    cancelled: [],
  },
  "isms-asset": {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close"],
    closed: [],
    cancelled: [],
  },
  "isms-threat": {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close"],
    closed: [],
    cancelled: [],
  },
  "isms-risk-assessment": {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close"],
    closed: [],
    cancelled: [],
  },
  "isms-incident": {
    open: ["start", "close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close"],
    closed: [],
    cancelled: [],
  },
  "bcp-plan": {
    draft: ["submit-review"],
    under_review: ["approve", "reject", "return"],
    approved: ["publish"],
    published: ["withdraw"],
    withdrawn: ["submit-review"],
  },
  "bcp-risk-scenario": {
    open: ["close", "cancel"],
    in_progress: ["close", "cancel"],
    pending_verification: ["close"],
    closed: [],
    cancelled: [],
  },
  "bcp-drill": {
    open: ["complete", "cancel"],
    in_progress: ["complete"],
    pending_verification: ["complete"],
    closed: [],
    cancelled: [],
  },
};

/** Validate a kind-specific payload against required fields and number bounds. */
function validatePayload(
  kind: IsoKind,
  payload: Readonly<Record<string, unknown>>,
): readonly string[] {
  const issues: string[] = [];
  for (const key of KIND_META[kind].required) {
    const value = payload[key];
    if (value === undefined || value === null || value === "") {
      issues.push(`${key} is required for ${kind}`);
    }
  }
  for (const key of [
    "quantity",
    "failureProbability",
    "consequenceSeverity",
    "likelihood",
    "impact",
    "probability",
    "riskScore",
    "evaluationScore",
  ] as const) {
    const value = payload[key];
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value))) {
      issues.push(`${key} must be a finite number`);
    }
  }
  return issues;
}

export function isoKind(value: string): IsoKind | null {
  return (ISO_KINDS as readonly string[]).includes(value) ? (value as IsoKind) : null;
}

export function createIsoRecord(input: CreateIsoRecordInput): Result<IsoRecord> {
  const kind = isoKind(input.kind);
  const payload = input.payload ?? {};
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.title, "title")
    .nonEmpty(input.createdBy, "createdBy")
    .require(kind !== null, "kind", `kind must be one of: ${ISO_KINDS.join(", ")}`);
  if (kind !== null) {
    issues
      .require(
        KIND_META[kind].statuses.includes(input.status ?? KIND_META[kind].statuses[0] ?? ""),
        "status",
        `status must be one of: ${KIND_META[kind].statuses.join(", ")}`,
      )
      .require(
        !KIND_META[kind].projectRequired || input.projectId !== undefined,
        "projectId",
        `${kind} requires a projectId`,
      );
    for (const detail of validatePayload(kind, payload)) {
      issues.require(false, "payload", detail);
    }
  }
  const problems = issues.build();
  if (problems.length > 0) return err(problems);
  const resolvedKind = kind as IsoKind;
  return ok({
    id: isoRecordId(input.id),
    kind: resolvedKind,
    organizationId: input.organizationId,
    ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
    ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
    ...(input.number !== undefined ? { number: input.number } : {}),
    title: input.title.trim(),
    status: input.status ?? KIND_META[resolvedKind].statuses[0] ?? "open",
    payload: { ...payload },
    createdBy: input.createdBy,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    versionNo: 1,
  });
}

/**
 * Merge a patch into an ISO record. Only fields that pass kind validation are
 * accepted; the version number increments on every mutation.
 */
export function updateIsoRecord(
  record: IsoRecord,
  patch: Readonly<Record<string, unknown>>,
  updatedAt: IsoTimestamp,
): Result<IsoRecord> {
  const nextPayload = { ...record.payload, ...patch };
  const problems = validatePayload(record.kind, nextPayload);
  if (problems.length > 0) {
    return err(problems.map((message) => ({ path: "payload", message })));
  }
  return ok({
    ...record,
    payload: nextPayload,
    updatedAt,
    versionNo: record.versionNo + 1,
  });
}

/**
 * Apply a lifecycle action. Returns a new record with the next status and any
 * action metadata (approvedBy/closedAt) recorded in the payload.
 */
export function applyIsoAction(
  record: IsoRecord,
  action: string,
  actorId: string,
  now: IsoTimestamp,
): Result<IsoRecord> {
  if (!(ISO_ACTIONS as readonly string[]).includes(action)) {
    return err([{ path: "action", message: `action must be one of: ${ISO_ACTIONS.join(", ")}` }]);
  }
  const allowed = TRANSITIONS[record.kind][record.status] ?? [];
  if (!allowed.includes(action)) {
    return err([
      {
        path: "action",
        message: `action '${action}' is not allowed from status '${record.status}' for ${record.kind}`,
      },
    ]);
  }
  const nextStatus: Record<string, string> = {
    "submit-review": "under_review",
    approve: "approved",
    reject: "withdrawn",
    return: "draft",
    publish: "published",
    withdraw: "withdrawn",
    start: "in_progress",
    close: "closed",
    complete: "closed",
    cancel: "cancelled",
  };
  const payload: Record<string, unknown> = { ...record.payload };
  if (action === "approve" || action === "close" || action === "complete") {
    payload[`${action}dAt`] = now;
    payload[`${action}dBy`] = actorId;
  }
  if (action === "cancel") {
    payload.cancelledAt = now;
    payload.cancelledBy = actorId;
  }
  return ok({
    ...record,
    status: nextStatus[action] ?? record.status,
    payload,
    updatedAt: now,
    versionNo: record.versionNo + 1,
  });
}

export interface IsoAnalytics {
  readonly total: number;
  readonly byKind: Readonly<Record<string, number>>;
  readonly byStatus: Readonly<Record<string, number>>;
  readonly open: number;
  readonly overdue: number;
  readonly compliance: Readonly<Record<string, number>>;
}

/** Compute ISO compliance analytics from a set of records. */
export function isoAnalytics(records: readonly IsoRecord[]): IsoAnalytics {
  const byKind: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let open = 0;
  let overdue = 0;
  const compliance: Record<string, number> = {};
  const now = Date.now();
  for (const record of records) {
    byKind[record.kind] = (byKind[record.kind] ?? 0) + 1;
    byStatus[record.status] = (byStatus[record.status] ?? 0) + 1;
    if (
      !["closed", "cancelled", "completed", "published", "withdrawn", "archived"].includes(
        record.status,
      )
    ) {
      open++;
    }
    const due = record.payload["dueDate"];
    const next = record.payload["nextInspectionDate"];
    const target = typeof due === "string" ? due : typeof next === "string" ? next : undefined;
    if (target !== undefined && !["closed", "cancelled", "completed"].includes(record.status)) {
      const parsed = Date.parse(target);
      if (!Number.isNaN(parsed) && parsed < now) overdue++;
    }
  }
  for (const kind of ISO_KINDS) {
    compliance[kind] = byKind[kind] ?? 0;
  }
  return { total: records.length, byKind, byStatus, open, overdue, compliance };
}

export const ISO_KIND_LABELS: Readonly<Record<IsoKind, string>> = Object.fromEntries(
  ISO_KINDS.map((kind) => [kind, KIND_META[kind].label]),
) as Readonly<Record<IsoKind, string>>;
