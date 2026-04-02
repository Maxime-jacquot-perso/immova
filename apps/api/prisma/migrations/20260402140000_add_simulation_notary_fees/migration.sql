-- CreateEnum
CREATE TYPE "SimulationPropertyType" AS ENUM ('ANCIEN', 'NEUF_VEFA');

-- AlterTable
ALTER TABLE "Simulation"
ADD COLUMN "propertyType" "SimulationPropertyType",
ADD COLUMN "departmentCode" VARCHAR(3),
ADD COLUMN "isFirstTimeBuyer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "furnitureValue" DECIMAL(12,2),
ADD COLUMN "estimatedDisbursements" DECIMAL(12,2),
ADD COLUMN "notaryFees" DECIMAL(12,2),
ADD COLUMN "notaryFeesBreakdown" JSONB;

-- Backfill existing rows with the legacy acquisition fees total when available.
UPDATE "Simulation"
SET "notaryFees" = "acquisitionFees"
WHERE "notaryFees" IS NULL;
