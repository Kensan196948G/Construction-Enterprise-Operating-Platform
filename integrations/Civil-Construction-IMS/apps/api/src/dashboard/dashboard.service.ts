import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CorrectiveActionStatus,
  WorkflowStatus,
  AuditStatus,
  DocumentStatus,
  Significance,
  ComplianceStatus,
  ProjectStatus,
  Severity,
} from '@prisma/client';

export interface DashboardKpi {
  corrective_actions: {
    open: number;
    in_progress: number;
    closed_this_month: number;
  };
  workflows: {
    pending_approval: number;
    in_progress: number;
  };
  audits: {
    scheduled: number;
    in_progress: number;
  };
  documents: {
    total: number;
    under_review: number;
    draft: number;
  };
  quality: {
    open_nonconformities: number;
    critical_nonconformities: number;
  };
  environment: {
    significant_aspects: number;
    legal_non_compliant: number;
  };
  projects: {
    active: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpi(organizationId: string): Promise<DashboardKpi> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Scope CorrectiveAction/Nonconformity/AuditPlan via project relation (projectId may be null;
    // rows without a project are excluded intentionally — they have no org boundary).
    const projectScope = { project: { organizationId } };

    // Document has no direct organizationId; scoped via project relation (same rationale).
    const documentScope = { project: { organizationId }, deletedAt: null };

    // WorkflowRequest scoped via requester's organization.
    const workflowScope = { requester: { organizationId } };

    const [
      caOpen,
      caInProgress,
      caClosed,
      workflowPending,
      workflowInProgress,
      auditScheduled,
      auditInProgress,
      documentTotal,
      documentUnderReview,
      documentDraft,
      ncOpen,
      ncCritical,
      aspectSignificant,
      legalNonCompliant,
      projectActive,
    ] = await this.prisma.$transaction([
      this.prisma.correctiveAction.count({
        where: { ...projectScope, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.correctiveAction.count({
        where: { ...projectScope, status: CorrectiveActionStatus.IN_PROGRESS },
      }),
      this.prisma.correctiveAction.count({
        where: {
          ...projectScope,
          status: CorrectiveActionStatus.CLOSED,
          closedAt: { gte: startOfMonth },
        },
      }),
      this.prisma.workflowRequest.count({
        where: { ...workflowScope, status: WorkflowStatus.PENDING },
      }),
      this.prisma.workflowRequest.count({
        where: { ...workflowScope, status: WorkflowStatus.IN_PROGRESS },
      }),
      this.prisma.auditPlan.count({
        where: { ...projectScope, status: AuditStatus.PLANNED },
      }),
      this.prisma.auditPlan.count({
        where: { ...projectScope, status: AuditStatus.IN_PROGRESS },
      }),
      this.prisma.document.count({ where: documentScope }),
      this.prisma.document.count({
        where: { ...documentScope, status: DocumentStatus.UNDER_REVIEW },
      }),
      this.prisma.document.count({
        where: { ...documentScope, status: DocumentStatus.DRAFT },
      }),
      this.prisma.nonconformity.count({
        where: { ...projectScope, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.nonconformity.count({
        where: {
          ...projectScope,
          severity: Severity.CRITICAL,
          status: CorrectiveActionStatus.OPEN,
        },
      }),
      this.prisma.environmentalAspect.count({
        where: { project: { organizationId }, significance: Significance.MAJOR },
      }),
      this.prisma.legalRequirement.count({
        where: { organizationId, complianceStatus: ComplianceStatus.NON_COMPLIANT },
      }),
      this.prisma.project.count({
        where: { organizationId, status: ProjectStatus.ACTIVE },
      }),
    ]);

    return {
      corrective_actions: {
        open: caOpen,
        in_progress: caInProgress,
        closed_this_month: caClosed,
      },
      workflows: {
        pending_approval: workflowPending,
        in_progress: workflowInProgress,
      },
      audits: {
        scheduled: auditScheduled,
        in_progress: auditInProgress,
      },
      documents: {
        total: documentTotal,
        under_review: documentUnderReview,
        draft: documentDraft,
      },
      quality: {
        open_nonconformities: ncOpen,
        critical_nonconformities: ncCritical,
      },
      environment: {
        significant_aspects: aspectSignificant,
        legal_non_compliant: legalNonCompliant,
      },
      projects: {
        active: projectActive,
      },
    };
  }
}
