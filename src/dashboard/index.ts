/**
 * Dashboard read-model — access-filtered aggregation for role-based views.
 *
 * {@link buildDashboard} composes the domain model and Governance Core into the
 * governance status / app health / device status / pending approvals surface,
 * showing each viewer only what they are permitted to read.
 */
export * from "./dashboard.ts";
