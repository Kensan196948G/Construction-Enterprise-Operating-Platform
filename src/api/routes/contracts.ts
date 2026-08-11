/**
 * Legal contract API (ServiceHub S-07).
 */

import { randomUUID } from "node:crypto";
import {
  CONTRACT_RISK_SCORES,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  contractId,
  createContract,
} from "../../domain/contract.ts";
import { projectId } from "../../domain/project.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, nowTs, num, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerContractRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/projects/:projectId/contracts", async (req, ctx, res) => {
    if (!hasPermission(ctx, "contract", "read")) {
      forbidden(res, "contract:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "contract");
      return;
    }
    const page = paginate(
      await repositories.contracts.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      contracts: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/contracts", async (req, ctx, res) => {
    if (!hasPermission(ctx, "contract", "write")) {
      forbidden(res, "contract:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "contract");
      return;
    }
    const contractNumber = str(req.body, "contractNumber") ?? "";
    const existing = await repositories.contracts.findByNumber(contractNumber);
    if (existing !== null) {
      badRequest(res, [{ field: "contractNumber", message: "contractNumber already exists" }]);
      return;
    }
    const contractType = str(req.body, "contractType");
    if (contractType !== undefined && !CONTRACT_TYPES.includes(contractType as never)) {
      badRequest(res, [
        {
          field: "contractType",
          message: `contractType must be one of: ${CONTRACT_TYPES.join(", ")}`,
        },
      ]);
      return;
    }
    const risk = str(req.body, "aiRiskScore");
    if (risk !== undefined && !CONTRACT_RISK_SCORES.includes(risk as never)) {
      badRequest(res, [
        {
          field: "aiRiskScore",
          message: `aiRiskScore must be one of: ${CONTRACT_RISK_SCORES.join(", ")}`,
        },
      ]);
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !CONTRACT_STATUSES.includes(status as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${CONTRACT_STATUSES.join(", ")}` },
      ]);
      return;
    }
    const created = createContract({
      id: `contract-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      contractType: contractType as never,
      contractNumber,
      title: str(req.body, "title") ?? "",
      party: str(req.body, "party"),
      periodStart: str(req.body, "periodStart"),
      periodEnd: str(req.body, "periodEnd"),
      amount: num(req.body, "amount"),
      description: str(req.body, "description"),
      documentUrl: str(req.body, "documentUrl"),
      aiRiskScore: risk as never,
      status: status as never,
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.contracts.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "contract:create",
      `contracts/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { contract: created.value });
  });

  router.get("/api/v1/contracts/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "contract", "read")) {
      forbidden(res, "contract:read");
      return;
    }
    const contract = await repositories.contracts.findById(contractId(req.params["id"] ?? ""));
    if (
      contract === null ||
      (ctx?.organizationId !== undefined && contract.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "contract");
      return;
    }
    writeJson(res, 200, { contract });
  });
}
