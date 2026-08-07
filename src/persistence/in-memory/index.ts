/**
 * In-memory repository implementations and factory.
 *
 * Use {@link createInMemoryRepositories} to obtain a ready-to-use
 * {@link Repositories} bundle for testing or local development.
 */

export { InMemoryApplicationRepository } from "./application-repository.ts";
export { InMemoryDeviceRepository } from "./device-repository.ts";
export { InMemoryOrganizationRepository } from "./organization-repository.ts";
export { InMemoryPolicyRepository } from "./policy-repository.ts";
export { InMemoryRoleRepository } from "./role-repository.ts";
export { InMemoryUserRepository } from "./user-repository.ts";
export { InMemoryWorkflowRepository } from "./workflow-repository.ts";
export { InMemoryWorkflowInstanceRepository } from "./workflow-instance-repository.ts";
export { InMemoryAiActionRepository } from "./ai-action-repository.ts";
export { InMemoryProjectRepository } from "./project-repository.ts";
export { InMemoryDailyReportRepository } from "./daily-report-repository.ts";

import type { Repositories } from "../ports.ts";
import { InMemoryApplicationRepository } from "./application-repository.ts";
import { InMemoryDeviceRepository } from "./device-repository.ts";
import { InMemoryOrganizationRepository } from "./organization-repository.ts";
import { InMemoryPolicyRepository } from "./policy-repository.ts";
import { InMemoryRoleRepository } from "./role-repository.ts";
import { InMemoryUserRepository } from "./user-repository.ts";
import { InMemoryWorkflowRepository } from "./workflow-repository.ts";
import { InMemoryWorkflowInstanceRepository } from "./workflow-instance-repository.ts";
import { InMemoryAiActionRepository } from "./ai-action-repository.ts";
import { InMemoryProjectRepository } from "./project-repository.ts";
import { InMemoryDailyReportRepository } from "./daily-report-repository.ts";
import {
  InMemoryPhotoRepository,
  InMemorySafetyCheckRepository,
  InMemoryQualityInspectionRepository,
  InMemoryCostRecordRepository,
  InMemoryWorkHourRepository,
  InMemoryNotificationDeliveryRepository,
  InMemoryKnowledgeRepository,
  InMemoryContractRepository,
  InMemoryDocumentRepository,
  InMemoryWorkScheduleRepository,
  InMemoryPurchaseOrderRepository,
  InMemoryNotificationPreferenceRepository,
} from "./business-repositories.ts";

/**
 * Construct a fresh set of empty in-memory repositories wired together as a
 * {@link Repositories} aggregate.  Each call produces an independent store
 * (no shared state), making it safe to use in parallel test suites.
 */
export function createInMemoryRepositories(): Repositories {
  return {
    users: new InMemoryUserRepository(),
    organizations: new InMemoryOrganizationRepository(),
    roles: new InMemoryRoleRepository(),
    devices: new InMemoryDeviceRepository(),
    applications: new InMemoryApplicationRepository(),
    policies: new InMemoryPolicyRepository(),
    workflows: new InMemoryWorkflowRepository(),
    workflowInstances: new InMemoryWorkflowInstanceRepository(),
    aiActions: new InMemoryAiActionRepository(),
    projects: new InMemoryProjectRepository(),
    dailyReports: new InMemoryDailyReportRepository(),
    photos: new InMemoryPhotoRepository(),
    safetyChecks: new InMemorySafetyCheckRepository(),
    qualityInspections: new InMemoryQualityInspectionRepository(),
    costRecords: new InMemoryCostRecordRepository(),
    workHours: new InMemoryWorkHourRepository(),
    notificationDeliveries: new InMemoryNotificationDeliveryRepository(),
    knowledgeArticles: new InMemoryKnowledgeRepository(),
    contracts: new InMemoryContractRepository(),
    documents: new InMemoryDocumentRepository(),
    workSchedules: new InMemoryWorkScheduleRepository(),
    purchaseOrders: new InMemoryPurchaseOrderRepository(),
    notificationPreferences: new InMemoryNotificationPreferenceRepository(),
  };
}
