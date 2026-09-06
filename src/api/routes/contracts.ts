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
import type { Contract } from "../../domain/contract.ts";
import { projectId } from "../../domain/project.ts";
import { toCsv } from "../csv.ts";
import { csvNum, csvStr, parseCsv } from "../csv-import.ts";
import { toXlsx } from "../xlsx.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeBinaryAttachment, writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, nowTs, num, rowErrors, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

const CONTRACT_CSV_HEADERS = [
  "id",
  "contractType",
  "contractNumber",
  "title",
  "party",
  "periodStart",
  "periodEnd",
  "amount",
  "description",
  "documentUrl",
  "aiRiskScore",
  "status",
  "createdAt",
  "updatedAt",
] as const;

/** Shared row shape for both CSV and Excel export — keeps the two in lockstep. */
function contractExportRow(c: Contract): Record<string, string> {
  return {
    id: c.id,
    contractType: c.contractType,
    contractNumber: c.contractNumber,
    title: c.title,
    party: c.party ?? "",
    periodStart: c.periodStart ?? "",
    periodEnd: c.periodEnd ?? "",
    amount: c.amount !== undefined ? String(c.amount) : "",
    description: c.description ?? "",
    documentUrl: c.documentUrl ?? "",
    aiRiskScore: c.aiRiskScore,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

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

  router.get("/api/v1/projects/:projectId/contracts/export.csv", async (req, ctx, res) => {
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
    const items = await repositories.contracts.findByProject(project.id);
    const csv = toCsv(CONTRACT_CSV_HEADERS, items.map(contractExportRow));
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contracts-${project.id}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(csv);
  });

  router.get("/api/v1/projects/:projectId/contracts/export.xlsx", async (req, ctx, res) => {
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
    const items = await repositories.contracts.findByProject(project.id);
    const xlsx = toXlsx(CONTRACT_CSV_HEADERS, items.map(contractExportRow), "Contracts");
    writeBinaryAttachment(
      res,
      200,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      `contracts-${project.id}.xlsx`,
      xlsx,
    );
  });

  // CSV bulk import — additive to the single-record POST below. Body:
  // `{ "csv": "contractNumber,title,...\nC-1,...\n" }`. All rows are
  // validated (including contractNumber uniqueness, both within the file and
  // against existing records) before any are saved.
  router.post("/api/v1/projects/:projectId/contracts/import.csv", async (req, ctx, res) => {
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
    const csvText = str(req.body, "csv");
    if (csvText === undefined) {
      badRequest(res, [{ path: "csv", message: "csv (string) is required" }]);
      return;
    }
    const { rows } = parseCsv(csvText);
    if (rows.length === 0) {
      badRequest(res, [{ path: "csv", message: "csv must contain at least one data row" }]);
      return;
    }

    const created: Contract[] = [];
    const errors: ReturnType<typeof rowErrors> = [];
    const numbersSeen = new Set<string>();
    for (const [i, row] of rows.entries()) {
      const rowNum = i + 1;
      const contractNumber = csvStr(row, "contractNumber") ?? "";
      if (contractNumber !== "") {
        if (numbersSeen.has(contractNumber)) {
          errors.push({
            row: rowNum,
            path: "contractNumber",
            message: "contractNumber duplicated within the import file",
          });
          continue;
        }
        numbersSeen.add(contractNumber);
        const existing = await repositories.contracts.findByNumber(contractNumber);
        if (existing !== null) {
          errors.push({
            row: rowNum,
            path: "contractNumber",
            message: "contractNumber already exists",
          });
          continue;
        }
      }
      const contractType = csvStr(row, "contractType");
      if (contractType !== undefined && !CONTRACT_TYPES.includes(contractType as never)) {
        errors.push({
          row: rowNum,
          path: "contractType",
          message: `contractType must be one of: ${CONTRACT_TYPES.join(", ")}`,
        });
        continue;
      }
      const risk = csvStr(row, "aiRiskScore");
      if (risk !== undefined && !CONTRACT_RISK_SCORES.includes(risk as never)) {
        errors.push({
          row: rowNum,
          path: "aiRiskScore",
          message: `aiRiskScore must be one of: ${CONTRACT_RISK_SCORES.join(", ")}`,
        });
        continue;
      }
      const status = csvStr(row, "status");
      if (status !== undefined && !CONTRACT_STATUSES.includes(status as never)) {
        errors.push({
          row: rowNum,
          path: "status",
          message: `status must be one of: ${CONTRACT_STATUSES.join(", ")}`,
        });
        continue;
      }
      const result = createContract({
        id: `contract-${randomUUID()}`,
        organizationId: project.organizationId,
        projectId: project.id as string,
        contractType: contractType as never,
        contractNumber,
        title: csvStr(row, "title") ?? "",
        party: csvStr(row, "party"),
        periodStart: csvStr(row, "periodStart"),
        periodEnd: csvStr(row, "periodEnd"),
        amount: csvNum(row, "amount"),
        description: csvStr(row, "description"),
        documentUrl: csvStr(row, "documentUrl"),
        aiRiskScore: risk as never,
        status: status as never,
        createdAt: nowTs(),
      });
      if (!result.ok) {
        errors.push(...rowErrors(rowNum, result.error));
        continue;
      }
      created.push(result.value);
    }
    if (errors.length > 0) {
      badRequest(res, errors);
      return;
    }
    for (const contract of created) {
      await repositories.contracts.save(contract);
    }
    recordAudit(
      container.auditLog,
      ctx,
      "contract:import",
      `projects/${project.id}/contracts/import`,
      "success",
      { count: String(created.length) },
    );
    writeJson(res, 201, { imported: created.length, contracts: created });
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
