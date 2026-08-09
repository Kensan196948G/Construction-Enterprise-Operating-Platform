import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CorrectiveActionStatus,
  DocumentStatus,
  AssetStatus,
  AssetCondition,
  AuditStatus,
  WorkflowStatus,
  ProjectStatus,
  Severity,
  RiskLevel,
  ComplianceStatus,
  Significance,
} from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(organizationId: string) {
    const projectScope = { project: { organizationId } };

    const [
      openCorrectiveActions,
      pendingWorkflows,
      openNearMisses,
      activeAssets,
      criticalAssets,
      openDocuments,
      scheduledAudits,
      openIsmsIncidents,
      activeBcpPlans,
      activeProjects,
      openNonconformities,
      openIncidents,
      significantAspects,
      legalNonCompliant,
    ] = await this.prisma.$transaction([
      this.prisma.correctiveAction.count({
        where: { ...projectScope, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.workflowRequest.count({
        where: { requester: { organizationId }, status: WorkflowStatus.PENDING },
      }),
      this.prisma.nearMiss.count({
        where: { organizationId, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.asset.count({ where: { organizationId, status: AssetStatus.ACTIVE } }),
      this.prisma.asset.count({
        where: { organizationId, currentCondition: AssetCondition.CRITICAL },
      }),
      this.prisma.document.count({
        where: {
          project: { organizationId },
          status: DocumentStatus.UNDER_REVIEW,
          deletedAt: null,
        },
      }),
      this.prisma.auditPlan.count({
        where: { ...projectScope, status: AuditStatus.PLANNED },
      }),
      this.prisma.ismsIncident.count({
        where: { organizationId, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.bcpPlan.count({
        where: { organizationId, status: { not: DocumentStatus.WITHDRAWN } },
      }),
      this.prisma.project.count({
        where: { organizationId, status: ProjectStatus.ACTIVE },
      }),
      this.prisma.nonconformity.count({
        where: { ...projectScope, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.safetyIncident.count({
        where: { organizationId, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.environmentalAspect.count({
        where: { project: { organizationId }, significance: Significance.MAJOR },
      }),
      this.prisma.legalRequirement.count({
        where: { organizationId, complianceStatus: ComplianceStatus.NON_COMPLIANT },
      }),
    ]);

    return {
      corrective_actions: { open: openCorrectiveActions },
      workflows: { pending: pendingWorkflows },
      safety: {
        open_near_misses: openNearMisses,
        open_incidents: openIncidents,
      },
      assets: { active: activeAssets, critical: criticalAssets },
      documents: { under_review: openDocuments },
      audits: { scheduled: scheduledAudits },
      isms: { open_incidents: openIsmsIncidents },
      bcp: { active_plans: activeBcpPlans },
      projects: { active: activeProjects },
      quality: { open_nonconformities: openNonconformities },
      environment: {
        significant_aspects: significantAspects,
        legal_non_compliant: legalNonCompliant,
      },
    };
  }

  async getIsoComplianceStatus(organizationId: string) {
    const projectScope = { project: { organizationId } };

    const [
      // ISO 9001 — 品質管理
      openNCs,
      totalNCs,
      // ISO 14001 — 環境管理
      nonCompliantLegal,
      totalLegal,
      // ISO 45001 — 安全衛生
      openIncidents,
      totalIncidents,
      // ISO 55001 — アセット管理
      poorConditionAssets,
      totalActiveAssets,
      // ISO 19650 — BIM
      wip_containers,
      total_containers,
    ] = await this.prisma.$transaction([
      this.prisma.nonconformity.count({
        where: {
          qualityPlan: { project: { organizationId } },
          status: CorrectiveActionStatus.OPEN,
        },
      }),
      this.prisma.nonconformity.count({ where: { qualityPlan: { project: { organizationId } } } }),
      this.prisma.legalRequirement.count({
        where: { organizationId, complianceStatus: ComplianceStatus.NON_COMPLIANT },
      }),
      this.prisma.legalRequirement.count({ where: { organizationId } }),
      this.prisma.safetyIncident.count({
        where: { organizationId, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.safetyIncident.count({ where: { organizationId } }),
      this.prisma.asset.count({
        where: {
          organizationId,
          currentCondition: { in: [AssetCondition.POOR, AssetCondition.CRITICAL] },
        },
      }),
      this.prisma.asset.count({ where: { organizationId, status: AssetStatus.ACTIVE } }),
      this.prisma.bimInformationContainer.count({
        where: { organizationId, cdeStatus: 'WORK_IN_PROGRESS' },
      }),
      this.prisma.bimInformationContainer.count({ where: { organizationId } }),
    ]);

    const safeScore = (compliant: number, total: number) =>
      total === 0 ? 100 : Math.round((compliant / total) * 100);

    return {
      iso9001: {
        name: '品質マネジメント',
        score: safeScore(totalNCs - openNCs, totalNCs),
        open_nonconformities: openNCs,
        total_nonconformities: totalNCs,
      },
      iso14001: {
        name: '環境マネジメント',
        score: safeScore(totalLegal - nonCompliantLegal, totalLegal),
        non_compliant_legal: nonCompliantLegal,
        total_legal_requirements: totalLegal,
      },
      iso45001: {
        name: '労働安全衛生',
        score: safeScore(totalIncidents - openIncidents, totalIncidents === 0 ? 1 : totalIncidents),
        open_incidents: openIncidents,
        total_incidents: totalIncidents,
      },
      iso55001: {
        name: 'アセット管理',
        score: safeScore(totalActiveAssets - poorConditionAssets, totalActiveAssets),
        poor_condition_assets: poorConditionAssets,
        total_active_assets: totalActiveAssets,
      },
      iso19650: {
        name: 'BIM/CIM',
        score: safeScore(total_containers - wip_containers, total_containers),
        wip_containers,
        total_containers,
      },
    };
  }

  async getSafetyKpi(organizationId: string) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      nearMissesTotal,
      nearMissesOpen,
      nearMissesClosed,
      incidentsYtd,
      incidentsOpen,
      incidentsClosed,
      incidentsWithLostDays,
      educationsYtd,
      criticalHazards,
      highHazards,
    ] = await this.prisma.$transaction([
      this.prisma.nearMiss.count({ where: { organizationId } }),
      this.prisma.nearMiss.count({
        where: { organizationId, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.nearMiss.count({
        where: { organizationId, status: CorrectiveActionStatus.CLOSED },
      }),
      this.prisma.safetyIncident.count({
        where: { organizationId, occurredAt: { gte: startOfYear } },
      }),
      this.prisma.safetyIncident.count({
        where: { organizationId, status: CorrectiveActionStatus.OPEN },
      }),
      this.prisma.safetyIncident.count({
        where: { organizationId, status: CorrectiveActionStatus.CLOSED },
      }),
      this.prisma.safetyIncident.count({
        where: { organizationId, lostDays: { gt: 0 } },
      }),
      this.prisma.safetyEducation.count({
        where: { organizationId, conductedAt: { gte: startOfYear } },
      }),
      this.prisma.hazardIdentification.count({
        where: { project: { organizationId }, riskLevel: RiskLevel.CRITICAL },
      }),
      this.prisma.hazardIdentification.count({
        where: { project: { organizationId }, riskLevel: RiskLevel.HIGH },
      }),
    ]);

    const nearMissClosureRate =
      nearMissesTotal > 0 ? Math.round((nearMissesClosed / nearMissesTotal) * 100) : 0;

    return {
      near_misses: {
        total: nearMissesTotal,
        open: nearMissesOpen,
        closed: nearMissesClosed,
        closure_rate: nearMissClosureRate,
      },
      incidents: {
        ytd: incidentsYtd,
        open: incidentsOpen,
        closed: incidentsClosed,
        with_lost_days: incidentsWithLostDays,
      },
      education: { sessions_ytd: educationsYtd },
      hazards: { critical: criticalHazards, high: highHazards },
    };
  }

  async getQualityKpi(organizationId: string) {
    const projectScope = { project: { organizationId } };

    const [
      totalNCs,
      openNCs,
      criticalNCs,
      highNCs,
      totalInspections,
      passedInspections,
      failedInspections,
      totalQualityPlans,
      approvedQualityPlans,
      underReviewDocs,
      publishedDocs,
      openAudits,
    ] = await this.prisma.$transaction([
      this.prisma.nonconformity.count({
        where: { qualityPlan: { project: { organizationId } } },
      }),
      this.prisma.nonconformity.count({
        where: {
          qualityPlan: { project: { organizationId } },
          status: CorrectiveActionStatus.OPEN,
        },
      }),
      this.prisma.nonconformity.count({
        where: {
          qualityPlan: { project: { organizationId } },
          severity: Severity.CRITICAL,
          status: CorrectiveActionStatus.OPEN,
        },
      }),
      this.prisma.nonconformity.count({
        where: {
          qualityPlan: { project: { organizationId } },
          severity: Severity.HIGH,
          status: CorrectiveActionStatus.OPEN,
        },
      }),
      this.prisma.qualityInspection.count({ where: { qualityPlan: { ...projectScope } } }),
      this.prisma.qualityInspection.count({
        where: { qualityPlan: { ...projectScope }, result: 'PASS' as any },
      }),
      this.prisma.qualityInspection.count({
        where: { qualityPlan: { ...projectScope }, result: 'FAIL' as any },
      }),
      this.prisma.qualityPlan.count({ where: { ...projectScope } }),
      this.prisma.qualityPlan.count({
        where: { ...projectScope, status: DocumentStatus.APPROVED },
      }),
      this.prisma.document.count({
        where: {
          project: { organizationId },
          status: DocumentStatus.UNDER_REVIEW,
          deletedAt: null,
        },
      }),
      this.prisma.document.count({
        where: { project: { organizationId }, status: DocumentStatus.PUBLISHED, deletedAt: null },
      }),
      this.prisma.auditPlan.count({
        where: { ...projectScope, status: AuditStatus.IN_PROGRESS },
      }),
    ]);

    const passRate =
      totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 0;

    return {
      nonconformities: {
        total: totalNCs,
        open: openNCs,
        critical: criticalNCs,
        high: highNCs,
      },
      inspections: {
        total: totalInspections,
        passed: passedInspections,
        failed: failedInspections,
        pass_rate: passRate,
      },
      quality_plans: { total: totalQualityPlans, approved: approvedQualityPlans },
      documents: { under_review: underReviewDocs, published: publishedDocs },
      audits: { in_progress: openAudits },
    };
  }

  async getAssetHealth(organizationId: string) {
    const [
      excellent,
      good,
      fair,
      poor,
      critical,
      totalAssets,
      underMaintenance,
      disposed,
      maintenanceDue,
    ] = await this.prisma.$transaction([
      this.prisma.asset.count({
        where: { organizationId, currentCondition: AssetCondition.EXCELLENT },
      }),
      this.prisma.asset.count({
        where: { organizationId, currentCondition: AssetCondition.GOOD },
      }),
      this.prisma.asset.count({
        where: { organizationId, currentCondition: AssetCondition.FAIR },
      }),
      this.prisma.asset.count({
        where: { organizationId, currentCondition: AssetCondition.POOR },
      }),
      this.prisma.asset.count({
        where: { organizationId, currentCondition: AssetCondition.CRITICAL },
      }),
      this.prisma.asset.count({ where: { organizationId } }),
      this.prisma.asset.count({ where: { organizationId, status: AssetStatus.UNDER_MAINTENANCE } }),
      this.prisma.asset.count({ where: { organizationId, status: AssetStatus.DISPOSED } }),
      this.prisma.assetMaintenancePlan.count({
        where: { asset: { organizationId }, status: 'ACTIVE', nextDueDate: { lte: new Date() } },
      }),
    ]);

    const total = excellent + good + fair + poor + critical;
    const healthScore =
      total === 0
        ? 100
        : Math.round(
            ((excellent * 5 + good * 4 + fair * 3 + poor * 2 + critical * 1) / (total * 5)) * 100,
          );

    return {
      condition_distribution: { excellent, good, fair, poor, critical },
      total_active: total,
      total: totalAssets,
      under_maintenance: underMaintenance,
      disposed,
      maintenance_overdue: maintenanceDue,
      health_score: healthScore,
    };
  }
}
