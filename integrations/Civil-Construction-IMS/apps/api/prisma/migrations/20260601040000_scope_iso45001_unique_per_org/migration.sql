-- Change global unique to per-organization unique for ISO 45001 models
-- Prevents cross-tenant duplicate-check leakage (MEDIUM security fix)

-- SafetyInspection: inspectionNo unique per organization
DROP INDEX IF EXISTS "safety_inspections_inspectionNo_key";
ALTER TABLE "safety_inspections" DROP CONSTRAINT IF EXISTS "safety_inspections_inspectionNo_key";
CREATE UNIQUE INDEX "safety_inspections_organizationId_inspectionNo_key" ON "safety_inspections"("organizationId", "inspectionNo");

-- SafetyIncident: incidentNo unique per organization
DROP INDEX IF EXISTS "safety_incidents_incidentNo_key";
ALTER TABLE "safety_incidents" DROP CONSTRAINT IF EXISTS "safety_incidents_incidentNo_key";
CREATE UNIQUE INDEX "safety_incidents_organizationId_incidentNo_key" ON "safety_incidents"("organizationId", "incidentNo");

-- ToolboxTalk: talkNo unique per organization
DROP INDEX IF EXISTS "toolbox_talks_talkNo_key";
ALTER TABLE "toolbox_talks" DROP CONSTRAINT IF EXISTS "toolbox_talks_talkNo_key";
CREATE UNIQUE INDEX "toolbox_talks_organizationId_talkNo_key" ON "toolbox_talks"("organizationId", "talkNo");
