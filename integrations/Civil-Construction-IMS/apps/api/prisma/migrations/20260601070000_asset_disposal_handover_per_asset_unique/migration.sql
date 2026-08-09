-- Fix cross-tenant enumeration leak: replace global unique with per-asset unique
-- disposalNo and handoverNo are now unique per asset, not globally unique

-- asset_disposals: global unique → per-asset unique
DROP INDEX IF EXISTS "asset_disposals_disposalNo_key";
ALTER TABLE "asset_disposals" DROP CONSTRAINT IF EXISTS "asset_disposals_disposalNo_key";
CREATE UNIQUE INDEX "asset_disposals_assetId_disposalNo_key" ON "asset_disposals"("assetId", "disposalNo");

-- asset_handovers: global unique → per-asset unique
DROP INDEX IF EXISTS "asset_handovers_handoverNo_key";
ALTER TABLE "asset_handovers" DROP CONSTRAINT IF EXISTS "asset_handovers_handoverNo_key";
CREATE UNIQUE INDEX "asset_handovers_assetId_handoverNo_key" ON "asset_handovers"("assetId", "handoverNo");
