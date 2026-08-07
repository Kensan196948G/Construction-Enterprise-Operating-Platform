/**
 * Legal Tech API クライアント
 * Phase 1: 契約書 AI 解析
 * Phase 2: 証跡タイムライン + コンプライアンスチェック
 */
import api from "./client";
import type { PaginatedResponse } from "./projects";

// ---------------------------------------------------------------------------
// Phase 1 Types — 契約書解析
// ---------------------------------------------------------------------------

export interface ContractAnalysisCreate {
  project_id: string;
  contract_type: string;
  content: string;
}

export interface ContractAnalysisResponse {
  id: string;
  project_id: string;
  contract_type: string;
  status: string;
  risk_score: string | null;
  issues: ContractIssue[];
  recommendations: string[];
  ai_used: boolean;
  created_at: string;
}

export interface ContractIssue {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string;
  description: string;
  location: string | null;
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Phase 2 Types — 証跡タイムライン
// ---------------------------------------------------------------------------

export type EvidenceSourceType =
  | "daily_report"
  | "safety"
  | "photo"
  | "contract"
  | "manual";

export interface LegalEvidenceCreate {
  project_id: string;
  source_type: EvidenceSourceType;
  title: string;
  event_date: string; // YYYY-MM-DD
  description?: string | null;
  source_id?: string | null;
  content_hash?: string | null;
  metadata_json?: Record<string, unknown> | null;
}

export interface LegalEvidenceResponse {
  id: string;
  project_id: string;
  source_type: EvidenceSourceType;
  source_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  content_hash: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
}

export interface LegalEvidenceTimeline {
  project_id: string;
  total_entries: number;
  entries: LegalEvidenceResponse[];
  integrity_ok: boolean;
  evaluated_at: string;
}

export interface EvidenceVerifyResult {
  project_id: string;
  total_checked: number;
  hash_mismatches: number;
  tampered_ids: string[];
  integrity_ok: boolean;
  verified_at: string;
}

// ---------------------------------------------------------------------------
// Phase 2 Types — コンプライアンスチェック
// ---------------------------------------------------------------------------

export type ComplianceCheckType =
  | "all"
  | "construction_law"
  | "subcontract_law"
  | "labor_safety";

export type ComplianceStatus =
  | "PASS"
  | "FAIL"
  | "WARNING"
  | "PENDING"
  | "NOT_CHECKED";

export interface ComplianceCheckRequest {
  check_type: ComplianceCheckType;
  project_summary?: string | null;
  payment_overdue_days?: number | null;
  near_miss_count?: number | null;
}

export interface ComplianceViolation {
  law: "construction_law" | "subcontract_law" | "labor_safety" | "other";
  article: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommendation: string;
}

export interface ComplianceCheckResponse {
  id: string;
  project_id: string;
  check_type: ComplianceCheckType;
  status: ComplianceStatus;
  score: number | null;
  violations: ComplianceViolation[];
  recommendations: string[];
  ai_used: boolean;
  checked_at: string;
}

export interface ComplianceStatusSummary {
  project_id: string;
  latest_check_id: string | null;
  overall_status: ComplianceStatus;
  overall_score: number | null;
  critical_violations: number;
  high_violations: number;
  last_checked_at: string | null;
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

export const legalApi = {
  // --- Phase 1: 契約書解析 ---

  analyzeContract: async (data: ContractAnalysisCreate) => {
    const res = await api.post<{ data: ContractAnalysisResponse }>(
      "/legal/contracts",
      data
    );
    return res.data.data;
  },

  listContracts: async (projectId: string, page = 1, perPage = 20) => {
    const res = await api.get<PaginatedResponse<ContractAnalysisResponse>>(
      `/legal/contracts/project/${projectId}`,
      { params: { page, per_page: perPage } }
    );
    return res.data;
  },

  getContract: async (id: string) => {
    const res = await api.get<{ data: ContractAnalysisResponse }>(
      `/legal/contracts/${id}`
    );
    return res.data.data;
  },

  // --- Phase 2: 証跡タイムライン ---

  getTimeline: async (
    projectId: string,
    sourceType?: EvidenceSourceType,
    limit = 100
  ) => {
    const res = await api.get<{ data: LegalEvidenceTimeline }>(
      `/legal/evidence/${projectId}/timeline`,
      { params: { source_type: sourceType, limit } }
    );
    return res.data.data;
  },

  addEvidence: async (projectId: string, data: LegalEvidenceCreate) => {
    const res = await api.post<{ data: LegalEvidenceResponse }>(
      `/legal/evidence/${projectId}`,
      data
    );
    return res.data.data;
  },

  verifyIntegrity: async (projectId: string) => {
    const res = await api.get<{ data: EvidenceVerifyResult }>(
      `/legal/evidence/${projectId}/verify`
    );
    return res.data.data;
  },

  getEvidence: async (evidenceId: string) => {
    const res = await api.get<{ data: LegalEvidenceResponse }>(
      `/legal/evidence/entry/${evidenceId}`
    );
    return res.data.data;
  },

  // --- Phase 2: コンプライアンスチェック ---

  runComplianceCheck: async (
    projectId: string,
    data: ComplianceCheckRequest
  ) => {
    const res = await api.post<{ data: ComplianceCheckResponse }>(
      `/legal/compliance/${projectId}/check`,
      data
    );
    return res.data.data;
  },

  getComplianceStatus: async (projectId: string) => {
    const res = await api.get<{ data: ComplianceStatusSummary }>(
      `/legal/compliance/${projectId}/status`
    );
    return res.data.data;
  },

  getComplianceHistory: async (
    projectId: string,
    page = 1,
    perPage = 20
  ) => {
    const res = await api.get<PaginatedResponse<ComplianceCheckResponse>>(
      `/legal/compliance/${projectId}/history`,
      { params: { page, per_page: perPage } }
    );
    return res.data;
  },
};
