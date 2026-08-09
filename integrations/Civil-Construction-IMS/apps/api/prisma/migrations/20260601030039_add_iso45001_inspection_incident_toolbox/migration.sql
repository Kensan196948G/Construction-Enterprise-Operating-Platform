/*
  Warnings:

  - Added the required column `organizationId` to the `hazard_identifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SafetyInspectionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('ACCIDENT', 'NEAR_MISS_SERIOUS', 'UNSAFE_CONDITION', 'UNSAFE_ACT', 'OCCUPATIONAL_DISEASE');

-- AlterTable
ALTER TABLE "hazard_identifications" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "safety_inspections" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inspectionNo" TEXT NOT NULL,
    "projectId" TEXT,
    "inspectionType" TEXT NOT NULL,
    "inspectedAt" TIMESTAMP(3) NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "location" TEXT,
    "checkItems" JSONB,
    "findings" TEXT,
    "status" "SafetyInspectionStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "safety_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_inspection_items" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "itemNo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "correctiveAction" TEXT,
    "dueDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "safety_inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_incidents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "incidentNo" TEXT NOT NULL,
    "projectId" TEXT,
    "incidentType" "IncidentType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "injuredPerson" TEXT,
    "injuryType" TEXT,
    "lostDays" INTEGER NOT NULL DEFAULT 0,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "immediateAction" TEXT,
    "rootCause" TEXT,
    "preventiveMeasure" TEXT,
    "status" "CorrectiveActionStatus" NOT NULL DEFAULT 'OPEN',
    "reportedBy" TEXT NOT NULL,
    "investigatedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toolbox_talks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "talkNo" TEXT NOT NULL,
    "projectId" TEXT,
    "conductedAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "topic" TEXT NOT NULL,
    "content" TEXT,
    "leaderName" TEXT,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "toolbox_talks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toolbox_talk_participants" (
    "id" TEXT NOT NULL,
    "talkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "toolbox_talk_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "safety_inspections_inspectionNo_key" ON "safety_inspections"("inspectionNo");

-- CreateIndex
CREATE INDEX "safety_inspections_organizationId_idx" ON "safety_inspections"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "safety_incidents_incidentNo_key" ON "safety_incidents"("incidentNo");

-- CreateIndex
CREATE INDEX "safety_incidents_organizationId_idx" ON "safety_incidents"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "toolbox_talks_talkNo_key" ON "toolbox_talks"("talkNo");

-- CreateIndex
CREATE INDEX "toolbox_talks_organizationId_idx" ON "toolbox_talks"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "toolbox_talk_participants_talkId_userId_key" ON "toolbox_talk_participants"("talkId", "userId");

-- CreateIndex
CREATE INDEX "hazard_identifications_organizationId_idx" ON "hazard_identifications"("organizationId");

-- AddForeignKey
ALTER TABLE "hazard_identifications" ADD CONSTRAINT "hazard_identifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_inspections" ADD CONSTRAINT "safety_inspections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_inspections" ADD CONSTRAINT "safety_inspections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_inspections" ADD CONSTRAINT "safety_inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_inspection_items" ADD CONSTRAINT "safety_inspection_items_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "safety_inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toolbox_talks" ADD CONSTRAINT "toolbox_talks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toolbox_talks" ADD CONSTRAINT "toolbox_talks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toolbox_talk_participants" ADD CONSTRAINT "toolbox_talk_participants_talkId_fkey" FOREIGN KEY ("talkId") REFERENCES "toolbox_talks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
