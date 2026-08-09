-- Phase 5: ISMS (ISO/IEC 27001) + BCP models

-- isms_assets
CREATE TABLE "isms_assets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assetNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "owner" TEXT,
    "location" TEXT,
    "classification" TEXT NOT NULL,
    "sensitivity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "isms_assets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "isms_assets_organizationId_assetNo_key" ON "isms_assets"("organizationId", "assetNo");
CREATE INDEX "isms_assets_organizationId_idx" ON "isms_assets"("organizationId");
ALTER TABLE "isms_assets" ADD CONSTRAINT "isms_assets_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- isms_threats
CREATE TABLE "isms_threats" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "threatType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "existingControls" TEXT,
    "status" "CorrectiveActionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "isms_threats_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "isms_threats" ADD CONSTRAINT "isms_threats_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "isms_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- isms_risk_assessments
CREATE TABLE "isms_risk_assessments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assetId" TEXT,
    "assessmentNo" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL,
    "assessedBy" TEXT NOT NULL,
    "summary" TEXT,
    "overallRiskLevel" "RiskLevel" NOT NULL,
    "treatmentPlan" TEXT,
    "nextReviewAt" TIMESTAMP(3),
    "status" "CorrectiveActionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "isms_risk_assessments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "isms_risk_assessments_organizationId_assessmentNo_key" ON "isms_risk_assessments"("organizationId", "assessmentNo");
CREATE INDEX "isms_risk_assessments_organizationId_idx" ON "isms_risk_assessments"("organizationId");
ALTER TABLE "isms_risk_assessments" ADD CONSTRAINT "isms_risk_assessments_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "isms_risk_assessments" ADD CONSTRAINT "isms_risk_assessments_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "isms_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- isms_incidents
CREATE TABLE "isms_incidents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "incidentNo" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "detectedAt" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "affectedSystems" TEXT,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "status" "CorrectiveActionStatus" NOT NULL DEFAULT 'OPEN',
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "reportedBy" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "isms_incidents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "isms_incidents_organizationId_incidentNo_key" ON "isms_incidents"("organizationId", "incidentNo");
CREATE INDEX "isms_incidents_organizationId_idx" ON "isms_incidents"("organizationId");
ALTER TABLE "isms_incidents" ADD CONSTRAINT "isms_incidents_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- bcp_plans
CREATE TABLE "bcp_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "scope" TEXT,
    "rto" INTEGER,
    "rpo" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "bcp_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bcp_plans_organizationId_planNo_key" ON "bcp_plans"("organizationId", "planNo");
CREATE INDEX "bcp_plans_organizationId_idx" ON "bcp_plans"("organizationId");
ALTER TABLE "bcp_plans" ADD CONSTRAINT "bcp_plans_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- bcp_risk_scenarios
CREATE TABLE "bcp_risk_scenarios" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "probability" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "responseActions" TEXT,
    "responsiblePerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "bcp_risk_scenarios_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "bcp_risk_scenarios" ADD CONSTRAINT "bcp_risk_scenarios_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "bcp_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- bcp_drill_records
CREATE TABLE "bcp_drill_records" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "drillNo" TEXT NOT NULL,
    "drillType" TEXT NOT NULL,
    "conductedAt" TIMESTAMP(3) NOT NULL,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "scenario" TEXT,
    "findings" TEXT,
    "improvements" TEXT,
    "evaluationScore" INTEGER,
    "nextDrillAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "bcp_drill_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bcp_drill_records_planId_drillNo_key" ON "bcp_drill_records"("planId", "drillNo");
ALTER TABLE "bcp_drill_records" ADD CONSTRAINT "bcp_drill_records_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "bcp_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
