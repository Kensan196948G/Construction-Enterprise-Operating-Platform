/**
 * Compliance check / legal evidence API (ServiceHub S-07).
 */

import { randomUUID } from "node:crypto";
import type { IsoTimestamp } from "../../domain/common.ts";
import { contractId } from "../../domain/contract.ts";
import {
  COMPLIANCE_RESULTS,
  COMPLIANCE_STANDARDS,
  complianceCheckId,
  createComplianceCheck,
  createLegalEvidence,
  legalEvidenceId,
} from "../../domain/compliance.ts";
import { projectId } from "../../domain/project.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, nowTs, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerComplianceRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/projects/:projectId/compliance-checks", async (req, ctx, res) => {
    if (!hasPermission(ctx, "compliance", "read")) {
      forbidden(res, "compliance:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    const page = paginate(
      await repositories.complianceChecks.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      complianceChecks: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/compliance-checks", async (req, ctx, res) => {
    if (!hasPermission(ctx, "compliance", "write")) {
      forbidden(res, "compliance:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    const standard = str(req.body, "standard");
    if (standard !== undefined && !COMPLIANCE_STANDARDS.includes(standard as never)) {
      badRequest(res, [
        {
          field: "standard",
          message: `standard must be one of: ${COMPLIANCE_STANDARDS.join(", ")}`,
        },
      ]);
      return;
    }
    const result = str(req.body, "result");
    if (result !== undefined && !COMPLIANCE_RESULTS.includes(result as never)) {
      badRequest(res, [
        { field: "result", message: `result must be one of: ${COMPLIANCE_RESULTS.join(", ")}` },
      ]);
      return;
    }
    const created = createComplianceCheck({
      id: `compliance-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      standard: standard as never,
      item: str(req.body, "item") ?? "",
      result: result as never,
      checkedAt: str(req.body, "checkedAt"),
      notes: str(req.body, "notes"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.complianceChecks.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "compliance:create",
      `compliance-checks/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { complianceCheck: created.value });
  });

  router.get("/api/v1/compliance-checks/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "compliance", "read")) {
      forbidden(res, "compliance:read");
      return;
    }
    const check = await repositories.complianceChecks.findById(
      complianceCheckId(req.params["id"] ?? ""),
    );
    if (
      check === null ||
      (ctx?.organizationId !== undefined && check.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "compliance check");
      return;
    }
    writeJson(res, 200, { complianceCheck: check });
  });

  router.get("/api/v1/contracts/:contractId/legal-evidence", async (req, ctx, res) => {
    if (!hasPermission(ctx, "legal", "read")) {
      forbidden(res, "legal:read");
      return;
    }
    const contract = await repositories.contracts.findById(
      contractId(req.params["contractId"] ?? ""),
    );
    if (
      contract === null ||
      (ctx?.organizationId !== undefined && contract.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "contract");
      return;
    }
    const page = paginate(
      await repositories.legalEvidences.findByContract(contract.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      legalEvidence: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/contracts/:contractId/legal-evidence", async (req, ctx, res) => {
    if (!hasPermission(ctx, "legal", "write")) {
      forbidden(res, "legal:write");
      return;
    }
    const contract = await repositories.contracts.findById(
      contractId(req.params["contractId"] ?? ""),
    );
    if (
      contract === null ||
      (ctx?.organizationId !== undefined && contract.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "contract");
      return;
    }
    const created = createLegalEvidence({
      id: `legal-evidence-${randomUUID()}`,
      organizationId: contract.organizationId,
      contractId: contract.id as string,
      eventType: str(req.body, "eventType") ?? "",
      description: str(req.body, "description") ?? "",
      evidenceHash: str(req.body, "evidenceHash"),
      occurredAt: (str(req.body, "occurredAt") ?? nowTs()) as IsoTimestamp,
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.legalEvidences.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "legal:create",
      `legal-evidence/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { legalEvidence: created.value });
  });

  router.get("/api/v1/legal-evidence/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "legal", "read")) {
      forbidden(res, "legal:read");
      return;
    }
    const evidence = await repositories.legalEvidences.findById(
      legalEvidenceId(req.params["id"] ?? ""),
    );
    if (
      evidence === null ||
      (ctx?.organizationId !== undefined && evidence.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "legal evidence");
      return;
    }
    writeJson(res, 200, { legalEvidence: evidence });
  });
}
