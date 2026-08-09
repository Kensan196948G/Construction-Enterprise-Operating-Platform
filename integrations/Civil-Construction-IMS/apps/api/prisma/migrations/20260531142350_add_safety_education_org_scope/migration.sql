/*
  Warnings:

  - Added the required column `organizationId` to the `safety_educations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "safety_educations" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "safety_educations_organizationId_idx" ON "safety_educations"("organizationId");

-- AddForeignKey
ALTER TABLE "safety_educations" ADD CONSTRAINT "safety_educations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
