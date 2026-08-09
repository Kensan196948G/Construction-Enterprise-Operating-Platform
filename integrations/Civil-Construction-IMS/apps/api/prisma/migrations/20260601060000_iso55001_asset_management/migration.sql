-- ISO 55001 Phase 4: Asset Management Enhancement

-- Create new enums
CREATE TYPE "AssetCriticality" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "DisposalType" AS ENUM ('SCRAPPED', 'SOLD', 'DONATED', 'RETURNED', 'TRANSFERRED');

-- Add criticality and new cost fields to assets
ALTER TABLE "assets"
  ADD COLUMN "criticality" "AssetCriticality" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "acquisitionCost" DECIMAL,
  DROP CONSTRAINT IF EXISTS "assets_assetNo_key";
DROP INDEX IF EXISTS "assets_assetNo_key";
CREATE UNIQUE INDEX "assets_organizationId_assetNo_key" ON "assets"("organizationId", "assetNo");

-- Add actualCost and notes to asset_maintenance_plans
ALTER TABLE "asset_maintenance_plans"
  ADD COLUMN "actualCost" DECIMAL,
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "notes" TEXT;

-- Fix AssetInspection inspectionNo: global unique → per-asset unique
ALTER TABLE "asset_inspections"
  ADD COLUMN "conditionAfter" "AssetCondition",
  DROP CONSTRAINT IF EXISTS "asset_inspections_inspectionNo_key";
DROP INDEX IF EXISTS "asset_inspections_inspectionNo_key";
CREATE UNIQUE INDEX "asset_inspections_assetId_inspectionNo_key" ON "asset_inspections"("assetId", "inspectionNo");

-- Create asset_risk_assessments table
CREATE TABLE "asset_risk_assessments" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL,
    "assessedBy" TEXT NOT NULL,
    "failureProbability" INTEGER NOT NULL,
    "consequenceSeverity" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "mitigationPlan" TEXT,
    "nextAssessmentAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "asset_risk_assessments_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "asset_risk_assessments" ADD CONSTRAINT "asset_risk_assessments_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create asset_disposals table
CREATE TABLE "asset_disposals" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "disposalNo" TEXT NOT NULL,
    "disposalType" "DisposalType" NOT NULL,
    "disposalDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "disposalValue" DECIMAL,
    "contractor" TEXT,
    "environmentalNote" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "asset_disposals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "asset_disposals_disposalNo_key" ON "asset_disposals"("disposalNo");
ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create asset_handovers table
CREATE TABLE "asset_handovers" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "handoverNo" TEXT NOT NULL,
    "handoverDate" TIMESTAMP(3) NOT NULL,
    "handoverFrom" TEXT NOT NULL,
    "handoverTo" TEXT NOT NULL,
    "handoverType" TEXT NOT NULL,
    "status" "HandoverStatus" NOT NULL DEFAULT 'NOT_INITIATED',
    "conditionAtHandover" "AssetCondition",
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "asset_handovers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "asset_handovers_handoverNo_key" ON "asset_handovers"("handoverNo");
ALTER TABLE "asset_handovers" ADD CONSTRAINT "asset_handovers_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
