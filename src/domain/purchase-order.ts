/**
 * Purchase order domain (Enterprise-OS E-05 / ERP).
 */

import {
  type Brand,
  type IsoTimestamp,
  type Result,
  ValidationBuilder,
  err,
  ok,
} from "./common.ts";
import { type ProjectId, projectId } from "./project.ts";

export type PurchaseOrderId = Brand<string, "PurchaseOrderId">;
export const purchaseOrderId = (value: string): PurchaseOrderId => value as PurchaseOrderId;

export const PURCHASE_ORDER_STATUSES = [
  "draft",
  "issued",
  "approved",
  "received",
  "delivered",
  "inspected",
  "paid",
  "cancelled",
] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

/**
 * Lifecycle transitions for the procurement → payment workflow
 * (draft → issued → approved → received → delivered → inspected → paid),
 * with `cancelled` reachable from any non-terminal state.
 * `paid` and `cancelled` are terminal — no further transitions are allowed.
 */
export const PURCHASE_ORDER_TRANSITIONS: Readonly<
  Record<PurchaseOrderStatus, readonly PurchaseOrderStatus[]>
> = {
  draft: ["issued", "cancelled"],
  issued: ["approved", "cancelled"],
  approved: ["received", "cancelled"],
  received: ["delivered", "cancelled"],
  delivered: ["inspected", "cancelled"],
  inspected: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

export interface PurchaseOrder {
  readonly id: PurchaseOrderId;
  readonly organizationId: string;
  readonly projectId: ProjectId;
  readonly orderNumber: string;
  readonly supplier: string;
  readonly item: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly amount: number;
  readonly status: PurchaseOrderStatus;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreatePurchaseOrderInput {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly orderNumber: string;
  readonly supplier: string;
  readonly item: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly status?: PurchaseOrderStatus | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: IsoTimestamp;
}

export function createPurchaseOrder(input: CreatePurchaseOrderInput): Result<PurchaseOrder> {
  const issues = new ValidationBuilder()
    .nonEmpty(input.id, "id")
    .nonEmpty(input.organizationId, "organizationId")
    .nonEmpty(input.projectId, "projectId")
    .nonEmpty(input.orderNumber, "orderNumber")
    .nonEmpty(input.supplier, "supplier")
    .nonEmpty(input.item, "item")
    .require(
      Number.isFinite(input.quantity) && input.quantity >= 0,
      "quantity",
      "quantity must be a non-negative number",
    )
    .require(
      Number.isFinite(input.unitPrice) && input.unitPrice >= 0,
      "unitPrice",
      "unitPrice must be a non-negative number",
    )
    .oneOf(input.status ?? "draft", PURCHASE_ORDER_STATUSES, "status");
  const problems = issues.build();
  if (problems.length > 0) {
    return err(problems);
  }
  const amount = input.quantity * input.unitPrice;
  return ok({
    id: purchaseOrderId(input.id),
    organizationId: input.organizationId,
    projectId: projectId(input.projectId),
    orderNumber: input.orderNumber,
    supplier: input.supplier,
    item: input.item,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    amount,
    status: input.status ?? "draft",
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

/**
 * Transition a purchase order's lifecycle status
 * (draft → issued → approved → received → delivered → inspected → paid).
 * Invalid transitions (e.g. `draft` → `paid` directly) are rejected as a
 * validation error rather than silently applied.
 */
export function transitionPurchaseOrder(
  order: PurchaseOrder,
  status: PurchaseOrderStatus,
  at: IsoTimestamp,
): Result<PurchaseOrder> {
  const allowed = PURCHASE_ORDER_TRANSITIONS[order.status];
  if (!allowed.includes(status)) {
    return err([
      {
        path: "status",
        message: `cannot transition '${order.status}' to '${status}'`,
      },
    ]);
  }
  return ok({ ...order, status, updatedAt: at });
}
