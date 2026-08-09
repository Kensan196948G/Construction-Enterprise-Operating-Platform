// Shared types between web and api

export type IsoStandard = '9001' | '14001' | '45001' | '55001' | '19650';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DocumentStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'SUPERSEDED'
  | 'WITHDRAWN';

export type WorkflowStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED';

export type ProjectStatus =
  | 'PLANNING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'COMPLETED'
  | 'CANCELLED';

export type CorrectiveActionStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING_VERIFICATION'
  | 'CLOSED'
  | 'CANCELLED';

export type CdeStatus =
  | 'WORK_IN_PROGRESS'
  | 'SHARED'
  | 'PUBLISHED'
  | 'ARCHIVED';

// Common audit fields
export interface AuditableEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deletedAt?: string | null;
  versionNo?: number;
}

// Audit trail record
export interface AuditTrailRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorName?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  occurredAt: string;
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Dashboard KPI types
export interface ImsKpiSummary {
  openCorrectiveActions: number;
  overdueCas: number;
  pendingWorkflows: number;
  upcomingAudits: number;
  openNonconformities: number;
  overdueInspections: number;
  openNearMisses: number;
  assetsOverdueInspection: number;
}

// User session
export interface UserSession {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  organizationId: string;
}
