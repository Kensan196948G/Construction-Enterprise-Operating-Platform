/**
 * M13: OpenAPI 3.1 specification generator.
 *
 * Produces docs/openapi.yaml from the hand-written schema definitions below.
 * Run: node --experimental-strip-types scripts/generate-openapi.ts
 *
 * Zero runtime dependencies — uses only node:fs/promises.
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { PLATFORM_VERSION } from "../src/version.ts";

// ---------------------------------------------------------------------------
// YAML helpers (minimal — no library)
// ---------------------------------------------------------------------------

function indent(n: number): string {
  return " ".repeat(n * 2);
}

type YamlValue = string | number | boolean | null | YamlValue[] | { [k: string]: YamlValue };

function serializeYaml(value: YamlValue, depth = 0): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (
      value.includes("\n") ||
      value.includes(":") ||
      value.includes("#") ||
      value.startsWith("-") ||
      value === "" ||
      /^[0-9]/.test(value)
    ) {
      const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${escaped}"`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value.map((v) => `\n${indent(depth)}- ${serializeYaml(v, depth + 1)}`).join("");
  }
  // object
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "{}";
  return entries
    .map(([k, v]) => {
      const valStr = serializeYaml(v, depth + 1);
      if (typeof v === "object" && v !== null && !Array.isArray(v) && Object.keys(v).length > 0) {
        return `\n${indent(depth)}${k}:${valStr}`;
      }
      if (Array.isArray(v) && v.length > 0) {
        return `\n${indent(depth)}${k}:${valStr}`;
      }
      return `\n${indent(depth)}${k}: ${valStr}`;
    })
    .join("");
}

function toYaml(root: { [k: string]: YamlValue }): string {
  return serializeYaml(root, 0).trimStart() + "\n";
}

// ---------------------------------------------------------------------------
// Reusable schema components
// ---------------------------------------------------------------------------

const schemas: { [k: string]: YamlValue } = {
  ErrorResponse: {
    type: "object",
    required: ["error"],
    properties: {
      error: { type: "string" },
      message: { type: "string" },
      details: { type: "object", additionalProperties: true },
    },
  },
  PaginationMeta: {
    type: "object",
    required: ["count", "total", "limit", "offset"],
    properties: {
      count: { type: "integer" },
      total: { type: "integer" },
      limit: { type: "integer" },
      offset: { type: "integer" },
    },
  },
  Organization: {
    type: "object",
    required: ["id", "name", "type", "status", "createdAt"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      type: { type: "string", enum: ["headquarters", "branch", "site", "partner"] },
      status: { type: "string", enum: ["active", "suspended", "archived"] },
      parentId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  User: {
    type: "object",
    required: ["id", "organizationId", "displayName", "email", "status", "roleIds", "createdAt"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      displayName: { type: "string" },
      email: { type: "string", format: "email" },
      status: { type: "string", enum: ["invited", "active", "suspended", "deactivated"] },
      roleIds: { type: "array", items: { type: "string" } },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  Role: {
    type: "object",
    required: ["id", "name", "scope", "permissions"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      scope: { type: "string", enum: ["global", "organization", "site"] },
      permissions: { type: "array", items: { type: "string" } },
    },
  },
  Device: {
    type: "object",
    required: ["id", "organizationId", "kind", "status"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      kind: { type: "string", enum: ["tablet", "phone", "kiosk", "sensor", "laptop"] },
      status: { type: "string", enum: ["provisioned", "active", "lost", "retired"] },
      assignedUserId: { type: "string" },
      lastSeenAt: { type: "string", format: "date-time" },
      metadata: { type: "object", additionalProperties: { type: "string" } },
    },
  },
  Application: {
    type: "object",
    required: ["id", "key", "name", "category", "health", "ownerOrganizationId"],
    properties: {
      id: { type: "string" },
      key: { type: "string" },
      name: { type: "string" },
      category: { type: "string", enum: ["portal", "governance", "field", "workflow", "document"] },
      health: { type: "string", enum: ["healthy", "degraded", "down", "unknown"] },
      ownerOrganizationId: { type: "string" },
    },
  },
  Policy: {
    type: "object",
    required: ["id", "name", "effect", "actions", "resources"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      effect: { type: "string", enum: ["allow", "deny"] },
      actions: { type: "array", items: { type: "string" } },
      resources: { type: "array", items: { type: "string" } },
    },
  },
  Workflow: {
    type: "object",
    required: ["id", "name", "type", "status", "steps"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      type: {
        type: "string",
        enum: ["approval", "notification", "task"],
      },
      status: {
        type: "string",
        enum: ["draft", "active", "suspended", "retired"],
      },
      steps: {
        type: "array",
        items: {
          type: "object",
          required: ["key", "name", "requiredPermission"],
          properties: {
            key: { type: "string" },
            name: { type: "string" },
            requiredPermission: { type: "string" },
          },
        },
      },
    },
  },
  WorkflowInstance: {
    type: "object",
    required: [
      "id",
      "workflowId",
      "organizationId",
      "subject",
      "stepKey",
      "stepName",
      "status",
      "requestedAt",
    ],
    properties: {
      id: { type: "string" },
      workflowId: { type: "string" },
      organizationId: { type: "string" },
      subject: { type: "string" },
      stepKey: { type: "string" },
      stepName: { type: "string" },
      status: { type: "string", enum: ["pending", "approved", "rejected", "cancelled"] },
      requestedAt: { type: "string", format: "date-time" },
      decidedAt: { type: "string", format: "date-time" },
      decidedBy: { type: "string" },
      decision: { type: "string", enum: ["approve", "reject"] },
      comment: { type: "string" },
    },
  },
  AiAction: {
    type: "object",
    required: [
      "id",
      "requester",
      "model",
      "purpose",
      "promptHash",
      "status",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      requester: { type: "string" },
      organizationId: { type: "string" },
      model: { type: "string" },
      purpose: { type: "string" },
      promptHash: { type: "string", description: "SHA-256 hex of the prompt payload" },
      status: { type: "string", enum: ["pending", "approved", "rejected"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      decidedBy: { type: "string" },
      decidedAt: { type: "string", format: "date-time" },
      decisionNote: { type: "string" },
    },
  },
  Project: {
    type: "object",
    required: ["id", "organizationId", "projectCode", "name", "status", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectCode: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      clientName: { type: "string" },
      siteAddress: { type: "string" },
      status: {
        type: "string",
        enum: ["planning", "in_progress", "completed", "suspended", "cancelled"],
      },
      startDate: { type: "string", format: "date" },
      endDate: { type: "string", format: "date" },
      budget: { type: "number" },
      managerId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  DailyReport: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectId",
      "reportDate",
      "workerCount",
      "safetyCheck",
      "status",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      reportDate: { type: "string", format: "date" },
      weather: { type: "string", enum: ["sunny", "cloudy", "rainy", "snowy"] },
      temperature: { type: "integer" },
      workerCount: { type: "integer" },
      workContent: { type: "string" },
      safetyCheck: { type: "boolean" },
      safetyNotes: { type: "string" },
      progressRate: { type: "integer" },
      issues: { type: "string" },
      status: { type: "string", enum: ["draft", "submitted", "approved"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  Photo: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectId",
      "fileName",
      "originalName",
      "contentType",
      "fileSize",
      "objectKey",
      "category",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      fileName: { type: "string" },
      originalName: { type: "string" },
      contentType: { type: "string" },
      fileSize: { type: "integer" },
      objectKey: { type: "string" },
      category: { type: "string", enum: ["general", "progress", "safety", "quality", "handover"] },
      caption: { type: "string" },
      takenAt: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  SafetyCheck: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectId",
      "checkDate",
      "checkType",
      "itemsTotal",
      "itemsOk",
      "itemsNg",
      "overallResult",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      checkDate: { type: "string", format: "date" },
      checkType: { type: "string", enum: ["daily", "patrol", "ky", "other"] },
      itemsTotal: { type: "integer" },
      itemsOk: { type: "integer" },
      itemsNg: { type: "integer" },
      overallResult: { type: "string", enum: ["pending", "ok", "ng"] },
      notes: { type: "string" },
      inspectorId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  QualityInspection: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectId",
      "inspectionDate",
      "inspectionType",
      "targetItem",
      "result",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      inspectionDate: { type: "string", format: "date" },
      inspectionType: { type: "string" },
      targetItem: { type: "string" },
      standardValue: { type: "string" },
      measuredValue: { type: "string" },
      result: { type: "string", enum: ["pending", "pass", "fail"] },
      notes: { type: "string" },
      inspectorId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CostRecord: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectId",
      "recordDate",
      "category",
      "description",
      "budgetedAmount",
      "actualAmount",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      recordDate: { type: "string", format: "date" },
      category: { type: "string" },
      description: { type: "string" },
      budgetedAmount: { type: "number" },
      actualAmount: { type: "number" },
      vendorName: { type: "string" },
      invoiceNumber: { type: "string" },
      notes: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  WorkHour: {
    type: "object",
    required: ["id", "organizationId", "projectId", "workDate", "hours", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      workerId: { type: "string" },
      workDate: { type: "string", format: "date" },
      hours: { type: "number" },
      workType: { type: "string" },
      notes: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  NotificationDelivery: {
    type: "object",
    required: [
      "id",
      "userId",
      "eventKey",
      "channel",
      "status",
      "attempts",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      userId: { type: "string" },
      eventKey: { type: "string" },
      channel: { type: "string", enum: ["email", "slack", "webhook"] },
      status: { type: "string", enum: ["pending", "sent", "failed", "retry"] },
      subject: { type: "string" },
      bodyPreview: { type: "string" },
      errorDetail: { type: "string" },
      failureKind: { type: "string" },
      attempts: { type: "integer" },
      sentAt: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  KnowledgeArticle: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "title",
      "content",
      "category",
      "tags",
      "isPublished",
      "viewCount",
      "aiGenerated",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      title: { type: "string" },
      content: { type: "string" },
      category: { type: "string", enum: ["general", "faq", "incident", "contract", "safety"] },
      tags: { type: "array", items: { type: "string" } },
      isPublished: { type: "boolean" },
      viewCount: { type: "integer" },
      rating: { type: "number" },
      aiGenerated: { type: "boolean" },
      aiActionId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  Contract: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectId",
      "contractType",
      "contractNumber",
      "title",
      "aiRiskScore",
      "status",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      contractType: { type: "string", enum: ["prime", "subcontract", "other"] },
      contractNumber: { type: "string" },
      title: { type: "string" },
      party: { type: "string" },
      periodStart: { type: "string", format: "date" },
      periodEnd: { type: "string", format: "date" },
      amount: { type: "number" },
      description: { type: "string" },
      documentUrl: { type: "string" },
      aiRiskScore: { type: "string", enum: ["pending", "low", "medium", "high"] },
      status: { type: "string", enum: ["draft", "active", "completed", "terminated"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  Document: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "title",
      "documentType",
      "revision",
      "status",
      "tags",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      title: { type: "string" },
      documentType: { type: "string", enum: ["drawing", "contract", "safety", "quality", "other"] },
      revision: { type: "integer" },
      status: { type: "string", enum: ["draft", "review", "approved", "issued", "archived"] },
      fileUrl: { type: "string" },
      fileSize: { type: "integer" },
      tags: { type: "array", items: { type: "string" } },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  WorkSchedule: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectId",
      "workDate",
      "title",
      "status",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      workDate: { type: "string", format: "date" },
      title: { type: "string" },
      assignee: { type: "string" },
      status: { type: "string", enum: ["planned", "in_progress", "completed", "cancelled"] },
      notes: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  PurchaseOrder: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectId",
      "orderNumber",
      "supplier",
      "item",
      "quantity",
      "unitPrice",
      "amount",
      "status",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      orderNumber: { type: "string" },
      supplier: { type: "string" },
      item: { type: "string" },
      quantity: { type: "number" },
      unitPrice: { type: "number" },
      amount: { type: "number" },
      status: { type: "string", enum: ["draft", "issued", "approved", "received", "cancelled"] },
      notes: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  NotificationPreference: {
    type: "object",
    required: ["id", "userId", "emailEnabled", "slackEnabled", "events", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      userId: { type: "string" },
      emailEnabled: { type: "boolean" },
      slackEnabled: { type: "boolean" },
      slackWebhookUrl: { type: "string" },
      events: { type: "object", additionalProperties: { type: "boolean" } },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },

  ComplianceCheck: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectId",
      "standard",
      "item",
      "result",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      standard: {
        type: "string",
        enum: ["kensetsugyo-ho", "shitauke-ho", "iso-9001", "iso-14001", "iso-45001", "other"],
      },
      item: { type: "string" },
      result: { type: "string", enum: ["pass", "fail", "pending"] },
      checkedAt: { type: "string", format: "date" },
      notes: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  LegalEvidence: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "contractId",
      "eventType",
      "description",
      "occurredAt",
      "createdAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      contractId: { type: "string" },
      eventType: { type: "string" },
      description: { type: "string" },
      evidenceHash: { type: "string" },
      occurredAt: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  NotificationTemplate: {
    type: "object",
    required: ["id", "templateKey", "subject", "body", "channel", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      templateKey: { type: "string" },
      subject: { type: "string" },
      body: { type: "string" },
      channel: { type: "string", enum: ["email", "slack", "webhook"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  AuditEntry: {
    type: "object",
    required: ["id", "at", "actor", "action", "resource", "outcome", "hash"],
    properties: {
      id: { type: "string" },
      at: { type: "string", format: "date-time" },
      actor: { type: "string" },
      action: { type: "string" },
      resource: { type: "string" },
      outcome: { type: "string", enum: ["success", "failure", "denied"] },
      hash: {
        type: "string",
        description: "SHA-256 of previous entry hash + this entry (tamper-evident chain)",
      },
      metadata: { type: "object", additionalProperties: { type: "string" } },
    },
  },
  TokenResponse: {
    type: "object",
    required: ["token", "expiresIn", "subject"],
    properties: {
      token: { type: "string", description: "HS256 JWT" },
      expiresIn: { type: "integer", description: "Seconds until expiry" },
      subject: { type: "string", description: "Authenticated subject" },
      organizationId: {
        type: "string",
        description:
          "Organization scope when the credential is org-scoped; absent for global credentials",
      },
    },
  },
  AuthKey: {
    type: "object",
    required: ["keyId", "subject", "permissions"],
    properties: {
      keyId: { type: "string", description: "Credential identifier used in `keyId:secret`" },
      subject: { type: "string", description: "Subject the key authenticates as" },
      permissions: { type: "array", items: { type: "string" }, description: "Granted permissions" },
      organizationId: {
        type: "string",
        description: "Organization scope; absent for platform-level credentials",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Provisioning time (SQLite mode)",
      },
    },
    description: "API key metadata. The secret hash is never returned.",
  },
  WorkOrder: {
    type: "object",
    required: ["id", "organizationId", "projectId", "title", "status", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"] },
      dueDate: { type: "string", format: "date" },
      completedAt: { type: "string", format: "date-time" },
      assigneeId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  Inspection: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectId",
      "title",
      "result",
      "checklistItems",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      result: { type: "string", enum: ["pass", "fail", "pending"] },
      inspectedAt: { type: "string", format: "date" },
      inspectorId: { type: "string" },
      checklistItems: {
        type: "array",
        items: {
          type: "object",
          required: ["label", "passed"],
          properties: {
            label: { type: "string" },
            passed: { type: "boolean" },
          },
        },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  SupplierEvaluation: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "supplierName",
      "status",
      "evaluationDate",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      supplierName: { type: "string" },
      supplierCode: { type: "string" },
      category: { type: "string" },
      status: {
        type: "string",
        enum: ["pending", "approved", "conditional", "rejected"],
      },
      evaluationDate: { type: "string", format: "date" },
      nextEvaluationDate: { type: "string", format: "date" },
      score: { type: "integer", minimum: 0, maximum: 100 },
      isoClause: { type: "string" },
      notes: { type: "string" },
      evaluatorId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  QualityObjective: {
    type: "object",
    required: ["id", "organizationId", "title", "status", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      isoClause: { type: "string" },
      target: { type: "string" },
      unit: { type: "string" },
      baseline: { type: "number" },
      targetValue: { type: "number" },
      status: { type: "string", enum: ["active", "achieved", "cancelled"] },
      dueDate: { type: "string", format: "date" },
      ownerId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  Risk: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "title",
      "likelihood",
      "impact",
      "riskLevel",
      "status",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      objectiveId: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      isoClause: { type: "string" },
      likelihood: { type: "integer", minimum: 1, maximum: 5 },
      impact: { type: "integer", minimum: 1, maximum: 5 },
      riskLevel: {
        type: "string",
        enum: ["very_low", "low", "medium", "high", "very_high"],
      },
      status: {
        type: "string",
        enum: ["identified", "assessed", "mitigated", "accepted", "closed"],
      },
      treatmentPlan: { type: "string" },
      residualRisk: { type: "string" },
      ownerId: { type: "string" },
      reviewDate: { type: "string", format: "date" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  ManagementReview: {
    type: "object",
    required: ["id", "organizationId", "title", "status", "reviewDate", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      title: { type: "string" },
      status: {
        type: "string",
        enum: ["scheduled", "in_progress", "completed", "cancelled"],
      },
      reviewDate: { type: "string", format: "date" },
      nextReviewDate: { type: "string", format: "date" },
      agenda: { type: "string" },
      outcomes: { type: "string" },
      isoClause: { type: "string" },
      facilitatorId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  AiBuildProject: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "name",
      "theme",
      "templateVersion",
      "status",
      "placeholderChecked",
      "generatedAt",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectId: { type: "string" },
      name: { type: "string" },
      theme: { type: "string" },
      purpose: { type: "string" },
      scope: { type: "string" },
      targetUsers: { type: "string" },
      templateVersion: { type: "string" },
      status: { type: "string", enum: ["generated", "archived", "restored", "deleted"] },
      placeholderChecked: { type: "boolean" },
      generatedAt: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  DxProject: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "slug",
      "nameJa",
      "portfolioType",
      "companyAssetUse",
      "lifecycleState",
      "importance",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      slug: { type: "string" },
      nameJa: { type: "string" },
      nameEn: { type: "string" },
      shortName: { type: "string" },
      summary: { type: "string" },
      portfolioType: {
        type: "string",
        enum: ["internal", "external", "common", "unclassified"],
      },
      companyAssetUse: { type: "string", enum: ["yes", "no", "review"] },
      domainCode: { type: "string" },
      lifecycleState: {
        type: "string",
        enum: [
          "planning",
          "requirements",
          "development",
          "verification",
          "production_ready",
          "production",
          "paused",
          "merging",
          "retired",
          "deleted",
        ],
      },
      importance: { type: "integer", minimum: 1, maximum: 5 },
      ownerTeam: { type: "string" },
      approvedProgress: { type: "number", minimum: 0, maximum: 100 },
      progressMilestone: { type: "string" },
      progressEvidenceUrl: { type: "string" },
      nextReviewAt: { type: "string", format: "date" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  MaterialPhotoLog: {
    type: "object",
    required: [
      "id",
      "organizationId",
      "projectCode",
      "materialName",
      "transactionType",
      "inspectionStatus",
      "needsReview",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      projectCode: { type: "string" },
      materialName: { type: "string" },
      materialCategory: { type: "string" },
      quantity: { type: "number" },
      unit: { type: "string" },
      storagePlace: { type: "string" },
      memo: { type: "string" },
      transactionType: {
        type: "string",
        enum: ["received", "placed", "used", "returned"],
      },
      inspectionStatus: {
        type: "string",
        enum: ["pending", "passed", "failed", "review"],
      },
      needsReview: { type: "boolean" },
      capturedAt: { type: "string", format: "date-time" },
      latitude: { type: "number" },
      longitude: { type: "number" },
      objectKey: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
};

// ---------------------------------------------------------------------------
// Security scheme
// ---------------------------------------------------------------------------

const securitySchemes: { [k: string]: YamlValue } = {
  ApiKeyAuth: {
    type: "http",
    scheme: "bearer",
    description:
      "API key in the format `keyId:rawSecret`. The server validates via HMAC-SHA256 and constant-time comparison.",
    bearerFormat: "keyId:rawSecret",
  },
  BearerJwt: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "HS256 JWT issued by POST /api/v1/auth/token. Include in Authorization header.",
  },
};

// ---------------------------------------------------------------------------
// Reusable parameters
// ---------------------------------------------------------------------------

const parameters: { [k: string]: YamlValue } = {
  limitParam: {
    name: "limit",
    in: "query",
    schema: { type: "integer", default: 20, minimum: 1, maximum: 200 },
    description: "Number of items per page",
  },
  offsetParam: {
    name: "offset",
    in: "query",
    schema: { type: "integer", default: 0, minimum: 0 },
    description: "Number of items to skip",
  },
  idPath: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string" },
    description: "Resource ID",
  },
  keyIdPath: {
    name: "keyId",
    in: "path",
    required: true,
    schema: { type: "string" },
    description: "API key ID",
  },
};

// ---------------------------------------------------------------------------
// Helper to build paginated list response
// ---------------------------------------------------------------------------

function paginatedList(listKey: string, schemaRef: string): YamlValue {
  return {
    type: "object",
    required: [listKey, "count", "total", "limit", "offset"],
    properties: {
      [listKey]: { type: "array", items: { $ref: `#/components/schemas/${schemaRef}` } },
      count: { type: "integer" },
      total: { type: "integer" },
      limit: { type: "integer" },
      offset: { type: "integer" },
    },
  };
}

function jsonResponse(code: number, schema: YamlValue): { [k: string]: YamlValue } {
  return {
    [String(code)]: {
      description: code === 200 ? "OK" : code === 201 ? "Created" : "Response",
      content: { "application/json": { schema } },
    },
  };
}

function errorResponses(...codes: number[]): { [k: string]: YamlValue } {
  const out: { [k: string]: YamlValue } = {};
  const msgs: { [k: number]: string } = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
  };
  for (const c of codes) {
    out[String(c)] = {
      description: msgs[c] ?? "Error",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
    };
  }
  return out;
}

const authSecurity: YamlValue = [{ ApiKeyAuth: [] }, { BearerJwt: [] }];

/** One gateway proxy operation (P1) — authenticated passthrough to an integration service. */
function gatewayOperation(method: string): YamlValue {
  return {
    operationId: `gateway${method.charAt(0).toUpperCase()}${method.slice(1).toLowerCase()}`,
    summary: `Proxy ${method.toUpperCase()} to an integration service through the CEOP gateway`,
    tags: ["IntegrationGateway"],
    security: authSecurity,
    parameters: [
      {
        name: "service",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Registered integration service id",
      },
      {
        name: "proxyPath",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Path forwarded to the upstream service",
      },
    ],
    responses: {
      ...jsonResponse(200, { type: "object", additionalProperties: true }),
      ...errorResponses(400, 401, 403, 404, 502, 504),
    },
  };
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const paths: { [k: string]: YamlValue } = {
  // ── Health ──────────────────────────────────────────────────────────────
  "/health": {
    get: {
      operationId: "getHealth",
      summary: "Liveness probe",
      tags: ["System"],
      responses: {
        "200": {
          description: "Service is healthy",
          content: {
            "application/json": {
              schema: { type: "object", properties: { status: { type: "string" } } },
            },
          },
        },
      },
    },
  },
  "/health/ready": {
    get: {
      operationId: "getReady",
      summary: "Readiness probe (verifies persistence tier)",
      tags: ["System"],
      responses: {
        "200": {
          description: "Persistence tier responds",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status", "storage", "timestamp"],
                properties: {
                  status: { type: "string", enum: ["ready"] },
                  storage: { type: "string" },
                  timestamp: { type: "string" },
                },
              },
            },
          },
        },
        ...errorResponses(503),
      },
    },
  },
  "/api/v1/info": {
    get: {
      operationId: "getInfo",
      summary: "Platform version and metadata",
      tags: ["System"],
      responses: {
        "200": {
          description: "Platform info",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  version: { type: "string" },
                  environment: { type: "string", description: "NODE_ENV at runtime" },
                  nodeVersion: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  "/api/v1/auth/token": {
    post: {
      operationId: "issueToken",
      summary: "Issue a JWT from an API key credential",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["credential"],
              properties: { credential: { type: "string", example: "keyId:rawSecret" } },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/TokenResponse" }),
        ...errorResponses(400, 401, 429),
      },
    },
  },

  "/api/v1/auth/revoke": {
    post: {
      operationId: "revokeToken",
      summary: "Revoke the caller's current JWT (logout)",
      tags: ["Auth"],
      security: authSecurity,
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["revoked"],
          properties: { revoked: { type: "boolean", example: true } },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },

  "/api/v1/auth/keys": {
    get: {
      operationId: "listApiKeys",
      summary: "List API key metadata (requires auth:write, platform-level credential)",
      tags: ["Auth"],
      security: authSecurity,
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["keys"],
          properties: {
            keys: {
              type: "array",
              items: { $ref: "#/components/schemas/AuthKey" },
              description: "Key metadata only — the secret hash is never exposed",
            },
          },
        }),
        ...errorResponses(401, 403),
      },
    },
  },

  "/api/v1/auth/keys/{keyId}": {
    delete: {
      operationId: "revokeApiKey",
      summary: "Revoke an API key (requires auth:write, platform-level credential)",
      tags: ["Auth"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/keyIdPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["revoked", "keyId"],
          properties: {
            revoked: { type: "boolean", example: true },
            keyId: { type: "string" },
          },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  "/api/v1/dashboard": {
    get: {
      operationId: "getDashboard",
      summary: "Role-filtered governance dashboard",
      tags: ["Dashboard"],
      security: authSecurity,
      responses: {
        "200": {
          description: "Dashboard view filtered by caller permissions",
          content: { "application/json": { schema: { type: "object" } } },
        },
        ...errorResponses(401, 403),
      },
    },
  },

  // ── Organizations (list + CRUD) ──────────────────────────────────────────
  "/api/v1/organizations": {
    get: {
      operationId: "listOrganizations",
      summary: "Paginated list of organizations",
      tags: ["Organizations"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("organizations", "Organization")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createOrganization",
      summary: "Create an organization",
      tags: ["Organizations"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "type"],
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: ["headquarters", "branch", "site", "partner"] },
                parentId: { type: "string", description: "Required for non-headquarters types" },
                status: { type: "string", enum: ["active", "suspended", "archived"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { $ref: "#/components/schemas/Organization" }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/organizations/{id}": {
    get: {
      operationId: "getOrganization",
      summary: "Get an organization by ID",
      tags: ["Organizations"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Organization" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateOrganization",
      summary: "Update an organization",
      tags: ["Organizations"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                status: { type: "string", enum: ["active", "suspended", "archived"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Organization" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteOrganization",
      summary: "Delete an organization",
      tags: ["Organizations"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Users ────────────────────────────────────────────────────────────────
  "/api/v1/users": {
    get: {
      operationId: "listUsers",
      summary: "Paginated list of users",
      tags: ["Users"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("users", "User")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createUser",
      summary: "Create a user",
      tags: ["Users"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["organizationId", "displayName", "email"],
              properties: {
                organizationId: { type: "string" },
                displayName: { type: "string" },
                email: { type: "string", format: "email" },
                status: { type: "string", enum: ["invited", "active", "suspended", "deactivated"] },
                roleIds: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { $ref: "#/components/schemas/User" }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/users/{id}": {
    get: {
      operationId: "getUser",
      summary: "Get a user by ID",
      tags: ["Users"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/User" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateUser",
      summary: "Update a user",
      tags: ["Users"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                displayName: { type: "string" },
                status: { type: "string", enum: ["invited", "active", "suspended", "deactivated"] },
                roleIds: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/User" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteUser",
      summary: "Soft-delete a user (status → deactivated)",
      tags: ["Users"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deactivated" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Roles ────────────────────────────────────────────────────────────────
  "/api/v1/roles": {
    get: {
      operationId: "listRoles",
      summary: "Paginated list of roles",
      tags: ["Roles"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("roles", "Role")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createRole",
      summary: "Create a role",
      tags: ["Roles"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "scope", "permissions"],
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                scope: { type: "string", enum: ["global", "organization", "site"] },
                permissions: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { $ref: "#/components/schemas/Role" }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/roles/{id}": {
    get: {
      operationId: "getRole",
      summary: "Get a role by ID",
      tags: ["Roles"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Role" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateRole",
      summary: "Update a role",
      tags: ["Roles"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                permissions: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Role" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteRole",
      summary: "Delete a role",
      tags: ["Roles"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Devices ──────────────────────────────────────────────────────────────
  "/api/v1/devices": {
    get: {
      operationId: "listDevices",
      summary: "Paginated list of devices",
      tags: ["Devices"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("devices", "Device")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createDevice",
      summary: "Register a device",
      tags: ["Devices"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["organizationId", "kind"],
              properties: {
                organizationId: { type: "string" },
                kind: { type: "string", enum: ["tablet", "phone", "kiosk", "sensor", "laptop"] },
                status: { type: "string", enum: ["provisioned", "active", "lost", "retired"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { $ref: "#/components/schemas/Device" }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/devices/{id}": {
    get: {
      operationId: "getDevice",
      summary: "Get a device by ID",
      tags: ["Devices"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Device" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateDevice",
      summary: "Update a device",
      tags: ["Devices"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["provisioned", "active", "lost", "retired"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Device" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteDevice",
      summary: "Remove a device",
      tags: ["Devices"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Applications ─────────────────────────────────────────────────────────
  "/api/v1/applications": {
    get: {
      operationId: "listApplications",
      summary: "Paginated list of applications",
      tags: ["Applications"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("applications", "Application")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createApplication",
      summary: "Register an application",
      tags: ["Applications"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["key", "name", "category", "ownerOrganizationId"],
              properties: {
                key: { type: "string", description: "Unique slug for the application" },
                name: { type: "string" },
                category: {
                  type: "string",
                  enum: ["portal", "governance", "field", "workflow", "document"],
                },
                health: { type: "string", enum: ["healthy", "degraded", "down", "unknown"] },
                ownerOrganizationId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { $ref: "#/components/schemas/Application" }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/applications/{id}": {
    get: {
      operationId: "getApplication",
      summary: "Get an application by ID",
      tags: ["Applications"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Application" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateApplication",
      summary: "Update an application",
      tags: ["Applications"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                health: { type: "string", enum: ["healthy", "degraded", "down", "unknown"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Application" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteApplication",
      summary: "Remove an application",
      tags: ["Applications"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Governance ───────────────────────────────────────────────────────────
  "/api/v1/governance/evaluate": {
    post: {
      operationId: "evaluateAccess",
      summary: "Evaluate an ABAC access decision",
      tags: ["Governance"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["subject", "resource", "action"],
              properties: {
                subject: { type: "string" },
                resource: { type: "string" },
                action: { type: "string" },
                attributes: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Access decision",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision"],
                properties: {
                  decision: { type: "string", enum: ["allow", "deny"] },
                  matchedPolicyIds: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/governance/audit": {
    get: {
      operationId: "getAuditLog",
      summary: "Retrieve recent audit log entries (requires audit:read)",
      description:
        "Organization-scoped credentials receive only entries attributed to their own " +
        "organization; globally-scoped credentials receive the whole chain. Entries " +
        "recorded before tenant attribution existed carry no organization and are " +
        "withheld from scoped credentials.",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 50, minimum: 1, maximum: 200 },
          description: "Maximum number of recent entries to return",
        },
        {
          name: "offset",
          in: "query",
          schema: { type: "integer", default: 0, minimum: 0 },
          description: "Number of most-recent entries to skip",
        },
      ],
      responses: {
        "200": {
          description: "Audit entries",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["entries", "count", "total", "limit", "offset"],
                properties: {
                  entries: { type: "array", items: { $ref: "#/components/schemas/AuditEntry" } },
                  count: { type: "integer" },
                  total: { type: "integer" },
                  limit: { type: "integer" },
                  offset: { type: "integer" },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
  "/api/v1/governance/audit/export": {
    get: {
      operationId: "exportAuditLog",
      summary: "Export the audit chain as a downloadable file (requires audit:export)",
      description:
        "Bulk extraction of the evidence trail. `audit:export` is deliberately distinct " +
        "from `audit:read`: paging through the log and walking out with all of it are " +
        "different capabilities. Note that a credential holding the wildcard `audit:*` " +
        "satisfies both. Denied attempts are themselves recorded in the chain.\n\n" +
        "Tenant scoping matches `GET /api/v1/governance/audit`. Each row carries " +
        "`sequence`, `previousHash` and `hash` so a recipient can re-verify the chain " +
        "offline. CSV cells beginning with a spreadsheet formula trigger (`=`, `+`, " +
        "`-`, `@`, TAB, CR) are prefixed with an apostrophe so the file is inert when " +
        "opened; the original value is preserved after the marker. The export's own " +
        "audit event is recorded after the range is snapshotted and therefore does not " +
        "appear in its own payload.",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [
        {
          name: "format",
          in: "query",
          schema: { type: "string", enum: ["csv", "json"], default: "csv" },
          description: "Output format",
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 1000, minimum: 1, maximum: 10000 },
          description: "Maximum number of entries to export",
        },
        {
          name: "offset",
          in: "query",
          schema: { type: "integer", default: 0, minimum: 0 },
          description: "Number of entries to skip",
        },
      ],
      responses: {
        "200": {
          description:
            "Attachment download. `Content-Disposition` carries a server-generated " +
            "filename; no caller-supplied value reaches the header.",
          headers: {
            "Content-Disposition": {
              description: 'e.g. attachment; filename="audit-export-2026-08-07T00-00-00-000Z.csv"',
              schema: { type: "string" },
            },
          },
          content: {
            "text/csv": {
              schema: { type: "string" },
              example:
                "sequence,id,at,actor,action,resource,outcome,metadata,previousHash,hash\r\n",
            },
            "application/json": {
              schema: {
                type: "object",
                required: ["exportedAt", "count", "total", "limit", "offset", "entries"],
                properties: {
                  exportedAt: { type: "string", format: "date-time" },
                  count: { type: "integer" },
                  total: { type: "integer" },
                  limit: { type: "integer" },
                  offset: { type: "integer" },
                  entries: { type: "array", items: { $ref: "#/components/schemas/AuditEntry" } },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/governance/audit/verify": {
    get: {
      operationId: "verifyAuditLog",
      summary: "Verify the tamper-evident audit chain (requires audit:read)",
      description:
        "Recomputes the SHA-256 hash chain over the persisted audit log and reports " +
        "whether the evidence trail is intact. The response includes `X-CEOP-Audit-Valid` " +
        "so a monitoring probe can react without parsing the body. Every check is itself " +
        "recorded in the chain, giving the platform a history of integrity verifications. " +
        "Tenant scoping does not apply: chain verification is a platform-wide property, " +
        "and the result exposes no tenant data.",
      tags: ["Governance"],
      security: authSecurity,
      responses: {
        "200": {
          description:
            "Verification result. `valid=false` means an entry was altered or the chain " +
            "is missing rows; `brokenAt` identifies the first broken sequence.",
          headers: {
            "X-CEOP-Audit-Valid": {
              description: "true when the chain is intact, false otherwise",
              schema: { type: "boolean" },
            },
          },
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["valid", "checkedAt"],
                properties: {
                  valid: { type: "boolean" },
                  brokenAt: { type: "integer", minimum: 0 },
                  checkedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
  "/api/v1/governance/policies": {
    get: {
      operationId: "listPolicies",
      summary: "Paginated list of policies",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("policies", "Policy")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createPolicy",
      summary: "Create a policy",
      tags: ["Governance"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "effect", "actions", "resources"],
              properties: {
                name: { type: "string" },
                effect: { type: "string", enum: ["allow", "deny"] },
                actions: { type: "array", items: { type: "string" } },
                resources: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { $ref: "#/components/schemas/Policy" }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/governance/policies/{id}": {
    get: {
      operationId: "getPolicy",
      summary: "Get a policy by ID",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Policy" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updatePolicy",
      summary: "Update a policy",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                effect: { type: "string", enum: ["allow", "deny"] },
                actions: { type: "array", items: { type: "string" } },
                resources: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Policy" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deletePolicy",
      summary: "Delete a policy",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Workflows ────────────────────────────────────────────────────────────
  "/api/v1/workflows": {
    get: {
      operationId: "listWorkflows",
      summary: "Paginated list of workflows (optional ?type= and ?status= filters)",
      tags: ["Workflows"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
        {
          name: "type",
          in: "query",
          schema: { type: "string", enum: ["approval", "notification", "task"] },
          description: "Filter by workflow type",
        },
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["draft", "active", "suspended", "retired"] },
          description: "Filter by workflow status",
        },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("workflows", "Workflow")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createWorkflow",
      summary: "Create a workflow",
      tags: ["Workflows"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "type", "steps"],
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: ["approval", "notification", "task"] },
                status: { type: "string", enum: ["draft", "active", "suspended", "retired"] },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["key", "name", "requiredPermission"],
                    properties: {
                      key: { type: "string" },
                      name: { type: "string" },
                      requiredPermission: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { $ref: "#/components/schemas/Workflow" }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/workflows/{id}": {
    get: {
      operationId: "getWorkflow",
      summary: "Get a workflow by ID",
      tags: ["Workflows"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Workflow" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateWorkflow",
      summary: "Update a workflow",
      tags: ["Workflows"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                status: { type: "string", enum: ["draft", "active", "suspended", "retired"] },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["key", "name", "requiredPermission"],
                    properties: {
                      key: { type: "string" },
                      name: { type: "string" },
                      requiredPermission: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { $ref: "#/components/schemas/Workflow" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteWorkflow",
      summary: "Delete a workflow",
      tags: ["Workflows"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Workflow instances (Issue→Approval→Audit / L-02) ────────────────────
  "/api/v1/workflow-instances": {
    get: {
      operationId: "listWorkflowInstances",
      summary: "Paginated list of workflow instances (optional ?status= filter)",
      tags: ["WorkflowInstances"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["pending", "approved", "rejected", "cancelled"] },
          description: "Filter by instance status",
        },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("workflowInstances", "WorkflowInstance")),
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      operationId: "createWorkflowInstance",
      summary: "Create a workflow instance from an active template",
      tags: ["WorkflowInstances"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["workflowId", "subject"],
              properties: {
                workflowId: { type: "string" },
                subject: { type: "string" },
                organizationId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["workflowInstance"],
          properties: { workflowInstance: { $ref: "#/components/schemas/WorkflowInstance" } },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/workflow-instances/{id}/decision": {
    post: {
      operationId: "decideWorkflowInstance",
      summary: "Approve or reject a pending workflow instance",
      tags: ["WorkflowInstances"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["decision"],
              properties: {
                decision: { type: "string", enum: ["approve", "reject"] },
                comment: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["workflowInstance"],
          properties: { workflowInstance: { $ref: "#/components/schemas/WorkflowInstance" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/workflow-instances/{id}/cancel": {
    post: {
      operationId: "cancelWorkflowInstance",
      summary: "Cancel a pending workflow instance",
      tags: ["WorkflowInstances"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["workflowInstance"],
          properties: { workflowInstance: { $ref: "#/components/schemas/WorkflowInstance" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/ai-actions": {
    get: {
      operationId: "listAiActions",
      summary: "Paginated list of governed AI actions (optional ?status= filter)",
      tags: ["AiGovernance"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["pending", "approved", "rejected"] },
          description: "Filter by action status",
        },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("aiActions", "AiAction")),
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      operationId: "createAiAction",
      summary: "Create a pending governed AI action request",
      tags: ["AiGovernance"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["model", "purpose", "promptHash"],
              properties: {
                model: { type: "string" },
                purpose: { type: "string" },
                promptHash: { type: "string" },
                organizationId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["aiAction"],
          properties: { aiAction: { $ref: "#/components/schemas/AiAction" } },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/ai-actions/{id}/decision": {
    post: {
      operationId: "decideAiAction",
      summary: "Approve or reject a pending AI action",
      tags: ["AiGovernance"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["decision"],
              properties: {
                decision: { type: "string", enum: ["approved", "rejected"] },
                note: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["aiAction"],
          properties: { aiAction: { $ref: "#/components/schemas/AiAction" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/devices/register": {
    post: {
      operationId: "registerDevice",
      summary: "D-01: register a field device agent",
      tags: ["Devices"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["kind"],
              properties: {
                id: { type: "string" },
                organizationId: { type: "string" },
                kind: { type: "string", enum: ["tablet", "phone", "kiosk", "sensor", "laptop"] },
                status: { type: "string", enum: ["provisioned", "active", "lost", "retired"] },
                metadata: { type: "object", additionalProperties: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["device"],
          properties: { device: { $ref: "#/components/schemas/Device" } },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/devices/{id}/heartbeat": {
    post: {
      operationId: "deviceHeartbeat",
      summary: "D-02: report device liveness",
      tags: ["Devices"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["provisioned", "active", "lost", "retired"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["device"],
          properties: { device: { $ref: "#/components/schemas/Device" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/devices/{id}/inventory": {
    post: {
      operationId: "deviceInventory",
      summary: "D-03: report device inventory/telemetry",
      tags: ["Devices"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["metadata"],
              properties: {
                metadata: { type: "object", additionalProperties: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["device"],
          properties: { device: { $ref: "#/components/schemas/Device" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/projects": {
    get: {
      operationId: "listProjects",
      summary: "Paginated list of construction projects (optional ?status= filter)",
      tags: ["Projects"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
        {
          name: "status",
          in: "query",
          schema: {
            type: "string",
            enum: ["planning", "in_progress", "completed", "suspended", "cancelled"],
          },
        },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("projects", "Project")),
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      operationId: "createProject",
      summary: "Create a construction project (ServiceHub S-01)",
      tags: ["Projects"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectCode", "name"],
              properties: {
                organizationId: { type: "string" },
                projectCode: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                clientName: { type: "string" },
                siteAddress: { type: "string" },
                status: {
                  type: "string",
                  enum: ["planning", "in_progress", "completed", "suspended", "cancelled"],
                },
                startDate: { type: "string", format: "date" },
                endDate: { type: "string", format: "date" },
                budget: { type: "number" },
                managerId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["project"],
          properties: { project: { $ref: "#/components/schemas/Project" } },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/projects/{id}": {
    get: {
      operationId: "getProject",
      summary: "Project detail",
      tags: ["Projects"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["project"],
          properties: { project: { $ref: "#/components/schemas/Project" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    patch: {
      operationId: "updateProject",
      summary: "Update a project",
      tags: ["Projects"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                clientName: { type: "string" },
                siteAddress: { type: "string" },
                status: {
                  type: "string",
                  enum: ["planning", "in_progress", "completed", "suspended", "cancelled"],
                },
                startDate: { type: "string", format: "date" },
                endDate: { type: "string", format: "date" },
                budget: { type: "number" },
                managerId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["project"],
          properties: { project: { $ref: "#/components/schemas/Project" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteProject",
      summary: "Delete a project (audited)",
      tags: ["Projects"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["deleted"],
          properties: { deleted: { type: "boolean" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/projects/{projectId}/daily-reports": {
    get: {
      operationId: "listDailyReports",
      summary: "Paginated list of daily reports for a project",
      tags: ["DailyReports"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["draft", "submitted", "approved"] },
        },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("dailyReports", "DailyReport")),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    post: {
      operationId: "createDailyReport",
      summary: "Create a daily report (ServiceHub S-02)",
      tags: ["DailyReports"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["reportDate"],
              properties: {
                reportDate: { type: "string", format: "date" },
                weather: { type: "string", enum: ["sunny", "cloudy", "rainy", "snowy"] },
                temperature: { type: "integer" },
                workerCount: { type: "integer" },
                workContent: { type: "string" },
                safetyCheck: { type: "boolean" },
                safetyNotes: { type: "string" },
                progressRate: { type: "integer" },
                issues: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["dailyReport"],
          properties: { dailyReport: { $ref: "#/components/schemas/DailyReport" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/daily-reports/{id}": {
    get: {
      operationId: "getDailyReport",
      summary: "Daily report detail",
      tags: ["DailyReports"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["dailyReport"],
          properties: { dailyReport: { $ref: "#/components/schemas/DailyReport" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    patch: {
      operationId: "updateDailyReport",
      summary: "Update a daily report",
      tags: ["DailyReports"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                weather: { type: "string", enum: ["sunny", "cloudy", "rainy", "snowy"] },
                temperature: { type: "integer" },
                workerCount: { type: "integer" },
                workContent: { type: "string" },
                safetyCheck: { type: "boolean" },
                safetyNotes: { type: "string" },
                progressRate: { type: "integer" },
                issues: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["dailyReport"],
          properties: { dailyReport: { $ref: "#/components/schemas/DailyReport" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/daily-reports/{id}/transition": {
    post: {
      operationId: "transitionDailyReport",
      summary: "Transition a daily report (draft → submitted → approved)",
      tags: ["DailyReports"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status"],
              properties: { status: { type: "string", enum: ["draft", "submitted", "approved"] } },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["dailyReport"],
          properties: { dailyReport: { $ref: "#/components/schemas/DailyReport" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },

  "/api/v1/projects/{projectId}/photos": {
    get: {
      operationId: "listPhotos",
      summary: "Paginated list of photos for a project (S-03)",
      tags: ["Photos"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("photos", "Photo")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createPhoto",
      summary: "Register photo/document metadata (S-03)",
      tags: ["Photos"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["fileName", "originalName", "contentType", "fileSize"],
              properties: {
                fileName: { type: "string" },
                originalName: { type: "string" },
                contentType: { type: "string" },
                fileSize: { type: "integer" },
                objectKey: { type: "string" },
                category: {
                  type: "string",
                  enum: ["general", "progress", "safety", "quality", "handover"],
                },
                caption: { type: "string" },
                takenAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["photo"],
          properties: { photo: { $ref: "#/components/schemas/Photo" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/photos/{id}": {
    get: {
      operationId: "getPhoto",
      summary: "Photo metadata detail",
      tags: ["Photos"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["photo"],
          properties: { photo: { $ref: "#/components/schemas/Photo" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    delete: {
      operationId: "deletePhoto",
      summary: "Delete photo metadata (audited)",
      tags: ["Photos"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { type: "object", properties: { deleted: { type: "boolean" } } }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/projects/{projectId}/safety-checks": {
    get: {
      operationId: "listSafetyChecks",
      summary: "Paginated list of safety checks for a project (S-04)",
      tags: ["SafetyChecks"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("safetyChecks", "SafetyCheck")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createSafetyCheck",
      summary: "Create a safety check (S-04)",
      tags: ["SafetyChecks"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["checkDate"],
              properties: {
                checkDate: { type: "string", format: "date" },
                checkType: { type: "string", enum: ["daily", "patrol", "ky", "other"] },
                itemsTotal: { type: "integer" },
                itemsOk: { type: "integer" },
                itemsNg: { type: "integer" },
                overallResult: { type: "string", enum: ["pending", "ok", "ng"] },
                notes: { type: "string" },
                inspectorId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["safetyCheck"],
          properties: { safetyCheck: { $ref: "#/components/schemas/SafetyCheck" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/safety-checks/{id}": {
    get: {
      operationId: "getSafetyCheck",
      summary: "Safety check detail",
      tags: ["SafetyChecks"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["safetyCheck"],
          properties: { safetyCheck: { $ref: "#/components/schemas/SafetyCheck" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteSafetyCheck",
      summary: "Delete a safety check (audited)",
      tags: ["SafetyChecks"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { type: "object", properties: { deleted: { type: "boolean" } } }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/projects/{projectId}/quality-inspections": {
    get: {
      operationId: "listQualityInspections",
      summary: "Paginated list of quality inspections for a project (S-04)",
      tags: ["QualityInspections"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("qualityInspections", "QualityInspection")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createQualityInspection",
      summary: "Create a quality inspection (S-04)",
      tags: ["QualityInspections"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["inspectionDate", "inspectionType", "targetItem"],
              properties: {
                inspectionDate: { type: "string", format: "date" },
                inspectionType: { type: "string" },
                targetItem: { type: "string" },
                standardValue: { type: "string" },
                measuredValue: { type: "string" },
                result: { type: "string", enum: ["pending", "pass", "fail"] },
                notes: { type: "string" },
                inspectorId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["qualityInspection"],
          properties: { qualityInspection: { $ref: "#/components/schemas/QualityInspection" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/quality-inspections/{id}": {
    get: {
      operationId: "getQualityInspection",
      summary: "Quality inspection detail",
      tags: ["QualityInspections"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["qualityInspection"],
          properties: { qualityInspection: { $ref: "#/components/schemas/QualityInspection" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteQualityInspection",
      summary: "Delete a quality inspection (audited)",
      tags: ["QualityInspections"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { type: "object", properties: { deleted: { type: "boolean" } } }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/projects/{projectId}/cost-records": {
    get: {
      operationId: "listCostRecords",
      summary: "Paginated list of cost records for a project (S-05)",
      tags: ["CostRecords"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("costRecords", "CostRecord")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createCostRecord",
      summary: "Create a cost record (S-05)",
      tags: ["CostRecords"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["recordDate", "category", "description"],
              properties: {
                recordDate: { type: "string", format: "date" },
                category: { type: "string" },
                description: { type: "string" },
                budgetedAmount: { type: "number" },
                actualAmount: { type: "number" },
                vendorName: { type: "string" },
                invoiceNumber: { type: "string" },
                notes: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["costRecord"],
          properties: { costRecord: { $ref: "#/components/schemas/CostRecord" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/cost-records/{id}": {
    get: {
      operationId: "getCostRecord",
      summary: "Cost record detail",
      tags: ["CostRecords"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["costRecord"],
          properties: { costRecord: { $ref: "#/components/schemas/CostRecord" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteCostRecord",
      summary: "Delete a cost record (audited)",
      tags: ["CostRecords"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { type: "object", properties: { deleted: { type: "boolean" } } }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/projects/{projectId}/work-hours": {
    get: {
      operationId: "listWorkHours",
      summary: "Paginated list of work hours for a project (S-05)",
      tags: ["CostRecords"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("workHours", "WorkHour")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createWorkHour",
      summary: "Create a work hour record (S-05)",
      tags: ["CostRecords"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["workDate", "hours"],
              properties: {
                workerId: { type: "string" },
                workDate: { type: "string", format: "date" },
                hours: { type: "number" },
                workType: { type: "string" },
                notes: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["workHour"],
          properties: { workHour: { $ref: "#/components/schemas/WorkHour" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/work-hours/{id}": {
    get: {
      operationId: "getWorkHour",
      summary: "Work hour detail",
      tags: ["CostRecords"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["workHour"],
          properties: { workHour: { $ref: "#/components/schemas/WorkHour" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/notifications": {
    get: {
      operationId: "listNotifications",
      summary: "Paginated list of notification deliveries (optional ?status=)",
      tags: ["Notifications"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["pending", "sent", "failed", "retry"] },
        },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("notifications", "NotificationDelivery")),
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      operationId: "createNotification",
      summary: "Create a notification delivery intent (S-09)",
      tags: ["Notifications"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["userId", "eventKey", "channel"],
              properties: {
                organizationId: { type: "string" },
                userId: { type: "string" },
                eventKey: { type: "string" },
                channel: { type: "string", enum: ["email", "slack", "webhook"] },
                subject: { type: "string" },
                bodyPreview: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["notification"],
          properties: { notification: { $ref: "#/components/schemas/NotificationDelivery" } },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/notifications/{id}": {
    get: {
      operationId: "getNotification",
      summary: "Notification delivery detail",
      tags: ["Notifications"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["notification"],
          properties: { notification: { $ref: "#/components/schemas/NotificationDelivery" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
  },

  "/api/v1/knowledge": {
    get: {
      operationId: "listKnowledge",
      summary: "Paginated knowledge articles (optional ?category= & ?q=)",
      tags: ["Knowledge"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
        {
          name: "category",
          in: "query",
          schema: { type: "string", enum: ["general", "faq", "incident", "contract", "safety"] },
        },
        { name: "q", in: "query", schema: { type: "string" } },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("knowledgeArticles", "KnowledgeArticle")),
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      operationId: "createKnowledge",
      summary: "Create a knowledge article (S-06; AI-generated requires approved aiActionId)",
      tags: ["Knowledge"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "content"],
              properties: {
                organizationId: { type: "string" },
                title: { type: "string" },
                content: { type: "string" },
                category: {
                  type: "string",
                  enum: ["general", "faq", "incident", "contract", "safety"],
                },
                tags: { type: "array", items: { type: "string" } },
                isPublished: { type: "boolean" },
                aiGenerated: { type: "boolean" },
                aiActionId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["knowledgeArticle"],
          properties: { knowledgeArticle: { $ref: "#/components/schemas/KnowledgeArticle" } },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/knowledge/{id}": {
    get: {
      operationId: "getKnowledge",
      summary: "Knowledge article detail",
      tags: ["Knowledge"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["knowledgeArticle"],
          properties: { knowledgeArticle: { $ref: "#/components/schemas/KnowledgeArticle" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteKnowledge",
      summary: "Delete a knowledge article (audited)",
      tags: ["Knowledge"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { type: "object", properties: { deleted: { type: "boolean" } } }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/projects/{projectId}/contracts": {
    get: {
      operationId: "listContracts",
      summary: "Paginated list of contracts for a project (S-07)",
      tags: ["Contracts"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("contracts", "Contract")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createContract",
      summary: "Create a legal contract (S-07)",
      tags: ["Contracts"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["contractNumber", "title"],
              properties: {
                contractType: { type: "string", enum: ["prime", "subcontract", "other"] },
                contractNumber: { type: "string" },
                title: { type: "string" },
                party: { type: "string" },
                periodStart: { type: "string", format: "date" },
                periodEnd: { type: "string", format: "date" },
                amount: { type: "number" },
                description: { type: "string" },
                documentUrl: { type: "string" },
                aiRiskScore: { type: "string", enum: ["pending", "low", "medium", "high"] },
                status: { type: "string", enum: ["draft", "active", "completed", "terminated"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["contract"],
          properties: { contract: { $ref: "#/components/schemas/Contract" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/contracts/{id}": {
    get: {
      operationId: "getContract",
      summary: "Contract detail",
      tags: ["Contracts"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["contract"],
          properties: { contract: { $ref: "#/components/schemas/Contract" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/projects/{projectId}/work-orders": {
    get: {
      operationId: "listWorkOrders",
      summary: "Paginated work orders for a project (Management-Platform)",
      tags: ["WorkOrders"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("workOrders", "WorkOrder")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createWorkOrder",
      summary: "Create a site work order (Management-Platform)",
      tags: ["WorkOrders"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                status: {
                  type: "string",
                  enum: ["pending", "in_progress", "completed", "cancelled"],
                },
                dueDate: { type: "string", format: "date" },
                assigneeId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["workOrder"],
          properties: { workOrder: { $ref: "#/components/schemas/WorkOrder" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/work-orders/{id}": {
    get: {
      operationId: "getWorkOrder",
      summary: "Work order detail",
      tags: ["WorkOrders"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["workOrder"],
          properties: { workOrder: { $ref: "#/components/schemas/WorkOrder" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateWorkOrder",
      summary: "Update a work order",
      tags: ["WorkOrders"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                status: {
                  type: "string",
                  enum: ["pending", "in_progress", "completed", "cancelled"],
                },
                dueDate: { type: "string", format: "date" },
                completedAt: { type: "string", format: "date-time" },
                assigneeId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["workOrder"],
          properties: { workOrder: { $ref: "#/components/schemas/WorkOrder" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteWorkOrder",
      summary: "Delete a work order",
      tags: ["WorkOrders"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(204, { type: "object", properties: {} }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/projects/{projectId}/inspections": {
    get: {
      operationId: "listInspections",
      summary: "Paginated inspections for a project (Management-Platform)",
      tags: ["Inspections"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("inspections", "Inspection")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createInspection",
      summary: "Create an inspection with checklist items",
      tags: ["Inspections"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                inspectedAt: { type: "string", format: "date" },
                inspectorId: { type: "string" },
                checklistItems: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["label", "passed"],
                    properties: {
                      label: { type: "string" },
                      passed: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["inspection"],
          properties: { inspection: { $ref: "#/components/schemas/Inspection" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/inspections/{id}": {
    get: {
      operationId: "getInspection",
      summary: "Inspection detail",
      tags: ["Inspections"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["inspection"],
          properties: { inspection: { $ref: "#/components/schemas/Inspection" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateInspection",
      summary: "Update an inspection",
      tags: ["Inspections"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                inspectedAt: { type: "string", format: "date" },
                inspectorId: { type: "string" },
                checklistItems: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["label", "passed"],
                    properties: {
                      label: { type: "string" },
                      passed: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["inspection"],
          properties: { inspection: { $ref: "#/components/schemas/Inspection" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteInspection",
      summary: "Delete an inspection",
      tags: ["Inspections"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(204, { type: "object", properties: {} }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/supplier-evaluations": {
    get: {
      operationId: "listSupplierEvaluations",
      summary: "Paginated supplier evaluations (Management-Platform)",
      tags: ["Suppliers"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("supplierEvaluations", "SupplierEvaluation")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createSupplierEvaluation",
      summary: "Create a supplier evaluation",
      tags: ["Suppliers"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["supplierName", "evaluationDate"],
              properties: {
                organizationId: { type: "string" },
                supplierName: { type: "string" },
                supplierCode: { type: "string" },
                category: { type: "string" },
                status: {
                  type: "string",
                  enum: ["pending", "approved", "conditional", "rejected"],
                },
                evaluationDate: { type: "string", format: "date" },
                nextEvaluationDate: { type: "string", format: "date" },
                score: { type: "integer", minimum: 0, maximum: 100 },
                isoClause: { type: "string" },
                notes: { type: "string" },
                evaluatorId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["supplierEvaluation"],
          properties: {
            supplierEvaluation: { $ref: "#/components/schemas/SupplierEvaluation" },
          },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/supplier-evaluations/{id}": {
    get: {
      operationId: "getSupplierEvaluation",
      summary: "Supplier evaluation detail",
      tags: ["Suppliers"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["supplierEvaluation"],
          properties: {
            supplierEvaluation: { $ref: "#/components/schemas/SupplierEvaluation" },
          },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateSupplierEvaluation",
      summary: "Update a supplier evaluation",
      tags: ["Suppliers"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                supplierName: { type: "string" },
                supplierCode: { type: "string" },
                category: { type: "string" },
                status: {
                  type: "string",
                  enum: ["pending", "approved", "conditional", "rejected"],
                },
                evaluationDate: { type: "string", format: "date" },
                nextEvaluationDate: { type: "string", format: "date" },
                score: { type: "integer", minimum: 0, maximum: 100 },
                isoClause: { type: "string" },
                notes: { type: "string" },
                evaluatorId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["supplierEvaluation"],
          properties: {
            supplierEvaluation: { $ref: "#/components/schemas/SupplierEvaluation" },
          },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteSupplierEvaluation",
      summary: "Delete a supplier evaluation",
      tags: ["Suppliers"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(204, { type: "object", properties: {} }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/quality-objectives": {
    get: {
      operationId: "listQualityObjectives",
      summary: "Paginated quality objectives (Management-Platform)",
      tags: ["QualityObjectives"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("qualityObjectives", "QualityObjective")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createQualityObjective",
      summary: "Create a quality objective",
      tags: ["QualityObjectives"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title"],
              properties: {
                organizationId: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                isoClause: { type: "string" },
                target: { type: "string" },
                unit: { type: "string" },
                baseline: { type: "number" },
                targetValue: { type: "number" },
                status: { type: "string", enum: ["active", "achieved", "cancelled"] },
                dueDate: { type: "string", format: "date" },
                ownerId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["qualityObjective"],
          properties: {
            qualityObjective: { $ref: "#/components/schemas/QualityObjective" },
          },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/quality-objectives/{id}": {
    get: {
      operationId: "getQualityObjective",
      summary: "Quality objective detail",
      tags: ["QualityObjectives"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["qualityObjective"],
          properties: {
            qualityObjective: { $ref: "#/components/schemas/QualityObjective" },
          },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateQualityObjective",
      summary: "Update a quality objective",
      tags: ["QualityObjectives"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                isoClause: { type: "string" },
                target: { type: "string" },
                unit: { type: "string" },
                baseline: { type: "number" },
                targetValue: { type: "number" },
                status: { type: "string", enum: ["active", "achieved", "cancelled"] },
                dueDate: { type: "string", format: "date" },
                ownerId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["qualityObjective"],
          properties: {
            qualityObjective: { $ref: "#/components/schemas/QualityObjective" },
          },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteQualityObjective",
      summary: "Delete a quality objective",
      tags: ["QualityObjectives"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(204, { type: "object", properties: {} }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/risks": {
    get: {
      operationId: "listRisks",
      summary: "Paginated risk register (Management-Platform)",
      tags: ["Risks"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("risks", "Risk")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createRisk",
      summary: "Create a risk register entry",
      tags: ["Risks"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title"],
              properties: {
                organizationId: { type: "string" },
                objectiveId: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                isoClause: { type: "string" },
                likelihood: { type: "integer", minimum: 1, maximum: 5 },
                impact: { type: "integer", minimum: 1, maximum: 5 },
                riskLevel: {
                  type: "string",
                  enum: ["very_low", "low", "medium", "high", "very_high"],
                },
                status: {
                  type: "string",
                  enum: ["identified", "assessed", "mitigated", "accepted", "closed"],
                },
                treatmentPlan: { type: "string" },
                residualRisk: { type: "string" },
                ownerId: { type: "string" },
                reviewDate: { type: "string", format: "date" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["risk"],
          properties: { risk: { $ref: "#/components/schemas/Risk" } },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/risks/{id}": {
    get: {
      operationId: "getRisk",
      summary: "Risk detail",
      tags: ["Risks"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["risk"],
          properties: { risk: { $ref: "#/components/schemas/Risk" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateRisk",
      summary: "Update a risk",
      tags: ["Risks"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                isoClause: { type: "string" },
                likelihood: { type: "integer", minimum: 1, maximum: 5 },
                impact: { type: "integer", minimum: 1, maximum: 5 },
                riskLevel: {
                  type: "string",
                  enum: ["very_low", "low", "medium", "high", "very_high"],
                },
                status: {
                  type: "string",
                  enum: ["identified", "assessed", "mitigated", "accepted", "closed"],
                },
                treatmentPlan: { type: "string" },
                residualRisk: { type: "string" },
                ownerId: { type: "string" },
                reviewDate: { type: "string", format: "date" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["risk"],
          properties: { risk: { $ref: "#/components/schemas/Risk" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteRisk",
      summary: "Delete a risk",
      tags: ["Risks"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(204, { type: "object", properties: {} }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/management-reviews": {
    get: {
      operationId: "listManagementReviews",
      summary: "Paginated management reviews (Management-Platform)",
      tags: ["ManagementReviews"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("managementReviews", "ManagementReview")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createManagementReview",
      summary: "Create a management review",
      tags: ["ManagementReviews"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "reviewDate"],
              properties: {
                organizationId: { type: "string" },
                title: { type: "string" },
                status: {
                  type: "string",
                  enum: ["scheduled", "in_progress", "completed", "cancelled"],
                },
                reviewDate: { type: "string", format: "date" },
                nextReviewDate: { type: "string", format: "date" },
                agenda: { type: "string" },
                outcomes: { type: "string" },
                isoClause: { type: "string" },
                facilitatorId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["managementReview"],
          properties: {
            managementReview: { $ref: "#/components/schemas/ManagementReview" },
          },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/management-reviews/{id}": {
    get: {
      operationId: "getManagementReview",
      summary: "Management review detail",
      tags: ["ManagementReviews"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["managementReview"],
          properties: {
            managementReview: { $ref: "#/components/schemas/ManagementReview" },
          },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateManagementReview",
      summary: "Update a management review",
      tags: ["ManagementReviews"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                status: {
                  type: "string",
                  enum: ["scheduled", "in_progress", "completed", "cancelled"],
                },
                reviewDate: { type: "string", format: "date" },
                nextReviewDate: { type: "string", format: "date" },
                agenda: { type: "string" },
                outcomes: { type: "string" },
                isoClause: { type: "string" },
                facilitatorId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["managementReview"],
          properties: {
            managementReview: { $ref: "#/components/schemas/ManagementReview" },
          },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteManagementReview",
      summary: "Delete a management review",
      tags: ["ManagementReviews"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(204, { type: "object", properties: {} }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/ai-build-projects": {
    get: {
      operationId: "listAiBuildProjects",
      summary: "Paginated AI build projects (AI-Build-Platform)",
      tags: ["AiBuildProjects"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("aiBuildProjects", "AiBuildProject")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createAiBuildProject",
      summary: "Register a generated AI build project",
      tags: ["AiBuildProjects"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "theme"],
              properties: {
                organizationId: { type: "string" },
                projectId: { type: "string" },
                name: { type: "string" },
                theme: { type: "string" },
                purpose: { type: "string" },
                scope: { type: "string" },
                targetUsers: { type: "string" },
                templateVersion: { type: "string" },
                status: {
                  type: "string",
                  enum: ["generated", "archived", "restored", "deleted"],
                },
                placeholderChecked: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["aiBuildProject"],
          properties: {
            aiBuildProject: { $ref: "#/components/schemas/AiBuildProject" },
          },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/ai-build-projects/{id}": {
    get: {
      operationId: "getAiBuildProject",
      summary: "AI build project detail",
      tags: ["AiBuildProjects"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["aiBuildProject"],
          properties: {
            aiBuildProject: { $ref: "#/components/schemas/AiBuildProject" },
          },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateAiBuildProject",
      summary: "Update an AI build project",
      tags: ["AiBuildProjects"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                theme: { type: "string" },
                purpose: { type: "string" },
                scope: { type: "string" },
                targetUsers: { type: "string" },
                templateVersion: { type: "string" },
                status: {
                  type: "string",
                  enum: ["generated", "archived", "restored", "deleted"],
                },
                placeholderChecked: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["aiBuildProject"],
          properties: {
            aiBuildProject: { $ref: "#/components/schemas/AiBuildProject" },
          },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteAiBuildProject",
      summary: "Delete an AI build project",
      tags: ["AiBuildProjects"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(204, { type: "object", properties: {} }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/dx-projects": {
    get: {
      operationId: "listDxProjects",
      summary: "Paginated DX project portfolio (Portfolio-Atlas)",
      tags: ["DxProjects"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("dxProjects", "DxProject")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createDxProject",
      summary: "Register a DX project in the portfolio",
      tags: ["DxProjects"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["slug", "nameJa"],
              properties: {
                organizationId: { type: "string" },
                slug: { type: "string" },
                nameJa: { type: "string" },
                nameEn: { type: "string" },
                shortName: { type: "string" },
                summary: { type: "string" },
                portfolioType: {
                  type: "string",
                  enum: ["internal", "external", "common", "unclassified"],
                },
                companyAssetUse: { type: "string", enum: ["yes", "no", "review"] },
                domainCode: { type: "string" },
                lifecycleState: {
                  type: "string",
                  enum: [
                    "planning",
                    "requirements",
                    "development",
                    "verification",
                    "production_ready",
                    "production",
                    "paused",
                    "merging",
                    "retired",
                    "deleted",
                  ],
                },
                importance: { type: "integer", minimum: 1, maximum: 5 },
                ownerTeam: { type: "string" },
                approvedProgress: { type: "number", minimum: 0, maximum: 100 },
                progressMilestone: { type: "string" },
                progressEvidenceUrl: { type: "string" },
                nextReviewAt: { type: "string", format: "date" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["dxProject"],
          properties: { dxProject: { $ref: "#/components/schemas/DxProject" } },
        }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/dx-projects/{id}": {
    get: {
      operationId: "getDxProject",
      summary: "DX project detail",
      tags: ["DxProjects"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["dxProject"],
          properties: { dxProject: { $ref: "#/components/schemas/DxProject" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateDxProject",
      summary: "Update a DX project",
      tags: ["DxProjects"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                nameJa: { type: "string" },
                nameEn: { type: "string" },
                shortName: { type: "string" },
                summary: { type: "string" },
                portfolioType: {
                  type: "string",
                  enum: ["internal", "external", "common", "unclassified"],
                },
                companyAssetUse: { type: "string", enum: ["yes", "no", "review"] },
                domainCode: { type: "string" },
                lifecycleState: {
                  type: "string",
                  enum: [
                    "planning",
                    "requirements",
                    "development",
                    "verification",
                    "production_ready",
                    "production",
                    "paused",
                    "merging",
                    "retired",
                    "deleted",
                  ],
                },
                importance: { type: "integer", minimum: 1, maximum: 5 },
                ownerTeam: { type: "string" },
                approvedProgress: { type: "number", minimum: 0, maximum: 100 },
                progressMilestone: { type: "string" },
                progressEvidenceUrl: { type: "string" },
                nextReviewAt: { type: "string", format: "date" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["dxProject"],
          properties: { dxProject: { $ref: "#/components/schemas/DxProject" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteDxProject",
      summary: "Delete a DX project",
      tags: ["DxProjects"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(204, { type: "object", properties: {} }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/material-photo-logs": {
    get: {
      operationId: "listMaterialPhotoLogs",
      summary: "Paginated material photo logs (Photo-Logger)",
      tags: ["MaterialPhotoLogs"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("materialPhotoLogs", "MaterialPhotoLog")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createMaterialPhotoLog",
      summary: "Register a material photo log entry",
      tags: ["MaterialPhotoLogs"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["projectCode", "materialName"],
              properties: {
                organizationId: { type: "string" },
                projectCode: { type: "string" },
                materialName: { type: "string" },
                materialCategory: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                storagePlace: { type: "string" },
                memo: { type: "string" },
                transactionType: {
                  type: "string",
                  enum: ["received", "placed", "used", "returned"],
                },
                inspectionStatus: {
                  type: "string",
                  enum: ["pending", "passed", "failed", "review"],
                },
                needsReview: { type: "boolean" },
                capturedAt: { type: "string", format: "date-time" },
                latitude: { type: "number" },
                longitude: { type: "number" },
                objectKey: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["materialPhotoLog"],
          properties: {
            materialPhotoLog: { $ref: "#/components/schemas/MaterialPhotoLog" },
          },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/material-photo-logs/export.csv": {
    get: {
      operationId: "exportMaterialPhotoLogsCsv",
      summary: "Export material photo logs as CSV",
      tags: ["MaterialPhotoLogs"],
      security: authSecurity,
      responses: {
        "200": {
          description: "CSV file",
          content: { "text/csv": { schema: { type: "string" } } },
        },
        ...errorResponses(401, 403),
      },
    },
  },
  "/api/v1/material-photo-logs/{id}": {
    get: {
      operationId: "getMaterialPhotoLog",
      summary: "Material photo log detail",
      tags: ["MaterialPhotoLogs"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["materialPhotoLog"],
          properties: {
            materialPhotoLog: { $ref: "#/components/schemas/MaterialPhotoLog" },
          },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateMaterialPhotoLog",
      summary: "Update a material photo log entry",
      tags: ["MaterialPhotoLogs"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                materialName: { type: "string" },
                materialCategory: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                storagePlace: { type: "string" },
                memo: { type: "string" },
                transactionType: {
                  type: "string",
                  enum: ["received", "placed", "used", "returned"],
                },
                inspectionStatus: {
                  type: "string",
                  enum: ["pending", "passed", "failed", "review"],
                },
                needsReview: { type: "boolean" },
                capturedAt: { type: "string", format: "date-time" },
                latitude: { type: "number" },
                longitude: { type: "number" },
                objectKey: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["materialPhotoLog"],
          properties: {
            materialPhotoLog: { $ref: "#/components/schemas/MaterialPhotoLog" },
          },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteMaterialPhotoLog",
      summary: "Delete a material photo log entry",
      tags: ["MaterialPhotoLogs"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(204, { type: "object", properties: {} }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/itsm/incidents": {
    get: {
      operationId: "listItsmIncidents",
      summary: "List ITSM incidents through the adapter (S-08)",
      tags: ["Itsm"],
      security: authSecurity,
      responses: {
        ...jsonResponse(200, {
          type: "object",
          properties: { incidents: { type: "array", items: { type: "object" } } },
        }),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createItsmIncident",
      summary: "Create an ITSM incident through the adapter (S-08)",
      tags: ["Itsm"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "severity"],
              properties: {
                title: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { type: "object", properties: { incident: { type: "object" } } }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/itsm/incidents/{id}": {
    get: {
      operationId: "getItsmIncident",
      summary: "ITSM incident detail",
      tags: ["Itsm"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { type: "object", properties: { incident: { type: "object" } } }),
        ...errorResponses(401, 403, 404),
      },
    },
  },

  "/api/v1/documents": {
    get: {
      operationId: "listDocuments",
      summary: "Paginated documents (optional ?type=)",
      tags: ["Documents"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
        {
          name: "type",
          in: "query",
          schema: { type: "string", enum: ["drawing", "contract", "safety", "quality", "other"] },
        },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("documents", "Document")),
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      operationId: "createDocument",
      summary: "Create a drawing/document (E-03)",
      tags: ["Documents"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title"],
              properties: {
                organizationId: { type: "string" },
                projectId: { type: "string" },
                title: { type: "string" },
                documentType: {
                  type: "string",
                  enum: ["drawing", "contract", "safety", "quality", "other"],
                },
                revision: { type: "integer" },
                status: {
                  type: "string",
                  enum: ["draft", "review", "approved", "issued", "archived"],
                },
                fileUrl: { type: "string" },
                fileSize: { type: "integer" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["document"],
          properties: { document: { $ref: "#/components/schemas/Document" } },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/documents/{id}": {
    get: {
      operationId: "getDocument",
      summary: "Document detail",
      tags: ["Documents"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["document"],
          properties: { document: { $ref: "#/components/schemas/Document" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteDocument",
      summary: "Delete a document (audited)",
      tags: ["Documents"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { type: "object", properties: { deleted: { type: "boolean" } } }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/projects/{projectId}/work-schedules": {
    get: {
      operationId: "listWorkSchedules",
      summary: "Paginated work schedules for a project (E-02)",
      tags: ["WorkSchedules"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("workSchedules", "WorkSchedule")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createWorkSchedule",
      summary: "Create a work schedule (E-02)",
      tags: ["WorkSchedules"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["workDate", "title"],
              properties: {
                workDate: { type: "string", format: "date" },
                title: { type: "string" },
                assignee: { type: "string" },
                status: {
                  type: "string",
                  enum: ["planned", "in_progress", "completed", "cancelled"],
                },
                notes: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["workSchedule"],
          properties: { workSchedule: { $ref: "#/components/schemas/WorkSchedule" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/work-schedules/{id}": {
    get: {
      operationId: "getWorkSchedule",
      summary: "Work schedule detail",
      tags: ["WorkSchedules"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["workSchedule"],
          properties: { workSchedule: { $ref: "#/components/schemas/WorkSchedule" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/projects/{projectId}/purchase-orders": {
    get: {
      operationId: "listPurchaseOrders",
      summary: "Paginated purchase orders for a project (E-05)",
      tags: ["PurchaseOrders"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("purchaseOrders", "PurchaseOrder")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createPurchaseOrder",
      summary: "Create a purchase order (E-05)",
      tags: ["PurchaseOrders"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["orderNumber", "supplier", "item", "quantity", "unitPrice"],
              properties: {
                orderNumber: { type: "string" },
                supplier: { type: "string" },
                item: { type: "string" },
                quantity: { type: "number" },
                unitPrice: { type: "number" },
                status: {
                  type: "string",
                  enum: ["draft", "issued", "approved", "received", "cancelled"],
                },
                notes: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["purchaseOrder"],
          properties: { purchaseOrder: { $ref: "#/components/schemas/PurchaseOrder" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/purchase-orders/{id}": {
    get: {
      operationId: "getPurchaseOrder",
      summary: "Purchase order detail",
      tags: ["PurchaseOrders"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["purchaseOrder"],
          properties: { purchaseOrder: { $ref: "#/components/schemas/PurchaseOrder" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/notification-preferences/{userId}": {
    get: {
      operationId: "getNotificationPreference",
      summary: "Notification preference for a user (E-11)",
      tags: ["Notifications"],
      security: authSecurity,
      parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["notificationPreference"],
          properties: {
            notificationPreference: { $ref: "#/components/schemas/NotificationPreference" },
          },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "upsertNotificationPreference",
      summary: "Create or update a notification preference",
      tags: ["Notifications"],
      security: authSecurity,
      parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                emailEnabled: { type: "boolean" },
                slackEnabled: { type: "boolean" },
                slackWebhookUrl: { type: "string" },
                events: { type: "object", additionalProperties: { type: "boolean" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["notificationPreference"],
          properties: {
            notificationPreference: { $ref: "#/components/schemas/NotificationPreference" },
          },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },

  "/api/v1/projects/{projectId}/compliance-checks": {
    get: {
      operationId: "listComplianceChecks",
      summary: "Paginated compliance checks for a project (S-07)",
      tags: ["Compliance"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("complianceChecks", "ComplianceCheck")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createComplianceCheck",
      summary: "Create a compliance check (S-07)",
      tags: ["Compliance"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["item"],
              properties: {
                standard: {
                  type: "string",
                  enum: [
                    "kensetsugyo-ho",
                    "shitauke-ho",
                    "iso-9001",
                    "iso-14001",
                    "iso-45001",
                    "other",
                  ],
                },
                item: { type: "string" },
                result: { type: "string", enum: ["pass", "fail", "pending"] },
                checkedAt: { type: "string", format: "date" },
                notes: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["complianceCheck"],
          properties: { complianceCheck: { $ref: "#/components/schemas/ComplianceCheck" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/compliance-checks/{id}": {
    get: {
      operationId: "getComplianceCheck",
      summary: "Compliance check detail",
      tags: ["Compliance"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["complianceCheck"],
          properties: { complianceCheck: { $ref: "#/components/schemas/ComplianceCheck" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/contracts/{contractId}/legal-evidence": {
    get: {
      operationId: "listLegalEvidence",
      summary: "Paginated legal evidence for a contract (S-07)",
      tags: ["LegalEvidence"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("legalEvidence", "LegalEvidence")),
        ...errorResponses(401, 403, 404),
      },
    },
    post: {
      operationId: "createLegalEvidence",
      summary: "Create legal evidence (S-07)",
      tags: ["LegalEvidence"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["eventType", "description"],
              properties: {
                eventType: { type: "string" },
                description: { type: "string" },
                evidenceHash: { type: "string" },
                occurredAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["legalEvidence"],
          properties: { legalEvidence: { $ref: "#/components/schemas/LegalEvidence" } },
        }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
  },
  "/api/v1/legal-evidence/{id}": {
    get: {
      operationId: "getLegalEvidence",
      summary: "Legal evidence detail",
      tags: ["LegalEvidence"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["legalEvidence"],
          properties: { legalEvidence: { $ref: "#/components/schemas/LegalEvidence" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/notification-templates": {
    get: {
      operationId: "listNotificationTemplates",
      summary: "Paginated notification templates (optional ?channel=)",
      tags: ["Notifications"],
      security: authSecurity,
      parameters: [
        { $ref: "#/components/parameters/limitParam" },
        { $ref: "#/components/parameters/offsetParam" },
        {
          name: "channel",
          in: "query",
          schema: { type: "string", enum: ["email", "slack", "webhook"] },
        },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("notificationTemplates", "NotificationTemplate")),
        ...errorResponses(400, 401, 403),
      },
    },
    post: {
      operationId: "createNotificationTemplate",
      summary: "Create a notification template (E-11)",
      tags: ["Notifications"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["templateKey", "subject", "body"],
              properties: {
                templateKey: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
                channel: { type: "string", enum: ["email", "slack", "webhook"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, {
          type: "object",
          required: ["notificationTemplate"],
          properties: {
            notificationTemplate: { $ref: "#/components/schemas/NotificationTemplate" },
          },
        }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/notification-templates/{id}": {
    get: {
      operationId: "getNotificationTemplate",
      summary: "Notification template detail",
      tags: ["Notifications"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["notificationTemplate"],
          properties: {
            notificationTemplate: { $ref: "#/components/schemas/NotificationTemplate" },
          },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/notifications/unread-count": {
    get: {
      operationId: "getUnreadNotificationCount",
      summary: "Unread notification count (E-11)",
      tags: ["Notifications"],
      security: authSecurity,
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["unreadCount"],
          properties: { unreadCount: { type: "integer" } },
        }),
        ...errorResponses(401, 403),
      },
    },
  },
  "/api/v1/notifications/{id}/read": {
    patch: {
      operationId: "markNotificationRead",
      summary: "Mark a notification as read",
      tags: ["Notifications"],
      security: authSecurity,
      parameters: [{ $ref: "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, {
          type: "object",
          required: ["notification"],
          properties: { notification: { $ref: "#/components/schemas/NotificationDelivery" } },
        }),
        ...errorResponses(401, 403, 404),
      },
    },
  },
  "/api/v1/integrations/{service}/{proxyPath}": {
    get: gatewayOperation("get"),
    post: gatewayOperation("post"),
    put: gatewayOperation("put"),
    patch: gatewayOperation("patch"),
    delete: gatewayOperation("delete"),
  },
};

// ---------------------------------------------------------------------------
// Assemble and write
// ---------------------------------------------------------------------------

const spec: { [k: string]: YamlValue } = {
  openapi: "3.1.0",
  info: {
    title: "Construction Enterprise Operating Platform API",
    version: PLATFORM_VERSION,
    description:
      "Unified enterprise operating platform for construction company governance, business portal, field OS, and AI governance.",
    contact: { name: "Platform Team" },
    license: { name: "Proprietary" },
  },
  servers: [
    { url: "http://localhost:3000", description: "Local development" },
    { url: "http://localhost:8080", description: "Docker compose" },
    { url: "https://ceop.mirai-dx-platform.com", description: "Production" },
  ],
  tags: [
    { name: "System", description: "Health and metadata endpoints" },
    { name: "Auth", description: "JWT token issuance" },
    { name: "Dashboard", description: "Governance dashboard" },
    { name: "Organizations", description: "Organization management" },
    { name: "Users", description: "User management" },
    { name: "Roles", description: "Role management" },
    { name: "Devices", description: "Field device management" },
    { name: "Applications", description: "Application registry" },
    { name: "Governance", description: "Policy engine, audit log, ABAC evaluation" },
    { name: "Workflows", description: "Workflow templates and CRUD" },
    { name: "WorkflowInstances", description: "Workflow instance runs (Issue→Approval→Audit)" },
    { name: "AiGovernance", description: "AI action governance (integration Y-09)" },
    { name: "Photos", description: "Photo/document metadata (ServiceHub S-03)" },
    { name: "SafetyChecks", description: "Safety checks (ServiceHub S-04)" },
    { name: "QualityInspections", description: "Quality inspections (ServiceHub S-04)" },
    { name: "CostRecords", description: "Cost records and work hours (ServiceHub S-05)" },
    { name: "Notifications", description: "Notification deliveries (ServiceHub S-09)" },
    { name: "Knowledge", description: "Knowledge articles (ServiceHub S-06)" },
    { name: "Contracts", description: "Legal contracts (ServiceHub S-07)" },
    { name: "Itsm", description: "ITSM adapter (ServiceHub S-08)" },
    { name: "Documents", description: "Drawings/documents (Enterprise-OS E-03)" },
    { name: "WorkSchedules", description: "Site work schedules (Enterprise-OS E-02)" },
    { name: "PurchaseOrders", description: "Purchase orders / ERP (Enterprise-OS E-05)" },
    { name: "Compliance", description: "Compliance checks (ServiceHub S-07)" },
    { name: "LegalEvidence", description: "Legal evidence timeline (ServiceHub S-07)" },
    { name: "Projects", description: "Construction project management (ServiceHub S-01)" },
    { name: "DailyReports", description: "Site daily reports (ServiceHub S-02)" },
    {
      name: "WorkOrders",
      description: "Site work orders (Civil-Construction-Management-Platform)",
    },
    {
      name: "Inspections",
      description: "Site inspections (Civil-Construction-Management-Platform)",
    },
    {
      name: "Suppliers",
      description: "Supplier evaluations (Civil-Construction-Management-Platform)",
    },
    {
      name: "QualityObjectives",
      description: "Quality objectives (Civil-Construction-Management-Platform)",
    },
    { name: "Risks", description: "Risk register (Civil-Construction-Management-Platform)" },
    {
      name: "ManagementReviews",
      description: "Management reviews (Civil-Construction-Management-Platform)",
    },
    {
      name: "AiBuildProjects",
      description: "AI build projects (Civil-Construction-AI-Build-Platform)",
    },
    { name: "DxProjects", description: "DX project portfolio (DX-Project-Portfolio-Atlas)" },
    {
      name: "MaterialPhotoLogs",
      description: "Material photo logs (Civil-Material-Photo-Logger)",
    },
    {
      name: "IntegrationGateway",
      description: "CEOP gateway reverse proxy for integration services (P1)",
    },
  ],
  paths,
  components: {
    schemas,
    parameters,
    securitySchemes,
  },
};

const outDir = join(import.meta.dirname ?? ".", "..", "docs");
const outPath = join(outDir, "openapi.yaml");
const content = toYaml(spec);

if (process.argv.includes("--check")) {
  const existing = await readFile(outPath, "utf8").catch(() => "");
  if (existing === content) {
    console.log("✅ OpenAPI spec is up to date");
  } else {
    console.error(
      "❌ OpenAPI drift detected — run `pnpm run openapi:gen` and commit docs/openapi.yaml",
    );
    process.exitCode = 1;
  }
} else {
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, content, "utf8");
  console.log(`✅ OpenAPI spec written to ${outPath}`);
}
