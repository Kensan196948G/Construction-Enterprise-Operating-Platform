-- ISO 19650 Phase 3 BIM Migration

-- Create SuitabilityCode enum
CREATE TYPE "SuitabilityCode" AS ENUM ('S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6');

-- Add organizationId to bim_eirs
ALTER TABLE "bim_eirs"
  ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'PLACEHOLDER',
  ADD COLUMN "loidLevel" INTEGER,
  ADD COLUMN "deliveryMilestones" JSONB;

-- Remove the default once data is set
ALTER TABLE "bim_eirs" ALTER COLUMN "organizationId" DROP DEFAULT;
CREATE INDEX "bim_eirs_organizationId_idx" ON "bim_eirs"("organizationId");

-- Add FK constraint for organizationId on bim_eirs
ALTER TABLE "bim_eirs" ADD CONSTRAINT "bim_eirs_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add organizationId to bim_beps
ALTER TABLE "bim_beps"
  ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'PLACEHOLDER';
ALTER TABLE "bim_beps" ALTER COLUMN "organizationId" DROP DEFAULT;
CREATE INDEX "bim_beps_organizationId_idx" ON "bim_beps"("organizationId");
ALTER TABLE "bim_beps" ADD CONSTRAINT "bim_beps_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add columns to bim_information_containers
ALTER TABLE "bim_information_containers"
  ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'PLACEHOLDER',
  ADD COLUMN "suitabilityCode" "SuitabilityCode" NOT NULL DEFAULT 'S0',
  ADD COLUMN "ifcVersion" TEXT,
  ADD COLUMN "fileSize" BIGINT,
  ADD COLUMN "checksum" TEXT;

-- Change containerCode from global unique to per-organization unique
DROP INDEX IF EXISTS "bim_information_containers_containerCode_key";
ALTER TABLE "bim_information_containers" DROP CONSTRAINT IF EXISTS "bim_information_containers_containerCode_key";
ALTER TABLE "bim_information_containers" ALTER COLUMN "organizationId" DROP DEFAULT;
CREATE UNIQUE INDEX "bim_information_containers_organizationId_containerCode_key" ON "bim_information_containers"("organizationId", "containerCode");
CREATE INDEX "bim_information_containers_organizationId_idx" ON "bim_information_containers"("organizationId");
ALTER TABLE "bim_information_containers" ADD CONSTRAINT "bim_information_containers_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create bim_coordination_issues table
CREATE TABLE "bim_coordination_issues" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bepId" TEXT,
    "issueNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "issueType" TEXT NOT NULL,
    "priority" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "status" "CorrectiveActionStatus" NOT NULL DEFAULT 'OPEN',
    "discipline" TEXT,
    "location" TEXT,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "bim_coordination_issues_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bim_coordination_issues_organizationId_issueNo_key" ON "bim_coordination_issues"("organizationId", "issueNo");
CREATE INDEX "bim_coordination_issues_organizationId_idx" ON "bim_coordination_issues"("organizationId");

ALTER TABLE "bim_coordination_issues" ADD CONSTRAINT "bim_coordination_issues_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bim_coordination_issues" ADD CONSTRAINT "bim_coordination_issues_bepId_fkey"
  FOREIGN KEY ("bepId") REFERENCES "bim_beps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
