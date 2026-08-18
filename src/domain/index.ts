/**
 * Platform domain model — all domain modules re-exported for unified access.
 *
 * Core domains (M1): organization, user, role, device, application, workflow,
 * policy, audit-event.
 *
 * Extended domains (P3 / v0.11.0): project, daily-report, photo, safety, cost,
 * notification, knowledge, contract, document, work-schedule, purchase-order,
 * notification-preference, compliance, notification-template, iso, integration,
 * ai-action, gateway-service, workflow-instance.
 */
export * from "./common.ts";
export * from "./organization.ts";
export * from "./role.ts";
export * from "./user.ts";
export * from "./device.ts";
export * from "./application.ts";
export * from "./workflow.ts";
export * from "./workflow-instance.ts";
export * from "./policy.ts";
export * from "./audit-event.ts";
export * from "./ai-action.ts";
export * from "./compliance.ts";
export * from "./contract.ts";
export * from "./cost.ts";
export * from "./daily-report.ts";
export * from "./document.ts";
export * from "./gateway-service.ts";
export * from "./integration.ts";
export * from "./knowledge.ts";
export * from "./notification-preference.ts";
export * from "./notification-template.ts";
export * from "./notification.ts";
export * from "./photo.ts";
export * from "./project.ts";
export * from "./purchase-order.ts";
export * from "./safety.ts";
export * from "./work-schedule.ts";
export * from "./work-order.ts";
export * from "./inspection.ts";
export * from "./supplier.ts";
export * from "./quality-objective.ts";
export * from "./risk.ts";
export * from "./management-review.ts";
export * from "./ai-build-project.ts";
export * from "./dx-project.ts";
export * from "./material-photo-log.ts";
// iso.ts は DOCUMENT_STATUSES を document.ts と同名でエクスポートするため
// `export *` ではなく明示列挙で再エクスポートする（競合名はエイリアス化）。
export {
  isoRecordId,
  ISO_KINDS,
  CORRECTIVE_STATUSES,
  AUDIT_STATUSES,
  INSPECTION_RESULTS,
  SAFETY_INSPECTION_STATUSES,
  RISK_LEVELS,
  SIGNIFICANCE_LEVELS,
  COMPLIANCE_STATUSES,
  ASSET_STATUSES,
  ASSET_CONDITIONS,
  ASSET_CRITICALITIES,
  MAINTENANCE_STATUSES,
  SUITABILITY_CODES,
  CDE_STATUSES,
  REVIEW_STATUSES,
  HANDOVER_STATUSES,
  SEVERITY_LEVELS,
  INCIDENT_TYPES,
  ISO_ACTIONS,
  isoKind,
  createIsoRecord,
  updateIsoRecord,
  applyIsoAction,
  isoAnalytics,
  ISO_KIND_LABELS,
} from "./iso.ts";
export type {
  IsoRecordId,
  IsoKind,
  IsoRecord,
  CreateIsoRecordInput,
  IsoAction,
  IsoAnalytics,
} from "./iso.ts";
export { DOCUMENT_STATUSES as ISO_DOCUMENT_STATUSES } from "./iso.ts";
