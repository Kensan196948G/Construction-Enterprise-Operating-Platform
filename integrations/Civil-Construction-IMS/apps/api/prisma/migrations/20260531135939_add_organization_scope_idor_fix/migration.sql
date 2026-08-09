/*
  Warnings:

  - Added the required column `organizationId` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `legal_requirements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `near_misses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `waste_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "legal_requirements" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "near_misses" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "waste_records" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "assets_organizationId_idx" ON "assets"("organizationId");

-- CreateIndex
CREATE INDEX "legal_requirements_organizationId_idx" ON "legal_requirements"("organizationId");

-- CreateIndex
CREATE INDEX "near_misses_organizationId_idx" ON "near_misses"("organizationId");

-- CreateIndex
CREATE INDEX "waste_records_organizationId_idx" ON "waste_records"("organizationId");

-- AddForeignKey
ALTER TABLE "legal_requirements" ADD CONSTRAINT "legal_requirements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_records" ADD CONSTRAINT "waste_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "near_misses" ADD CONSTRAINT "near_misses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
