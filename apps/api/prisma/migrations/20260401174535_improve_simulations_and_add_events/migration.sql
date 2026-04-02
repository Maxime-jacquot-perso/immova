/*
  Warnings:

  - The `type` column on the `SimulationLot` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SimulationLotType" AS ENUM ('APARTMENT', 'GARAGE', 'CELLAR', 'OTHER');

-- CreateEnum
CREATE TYPE "OpportunityEventType" AS ENUM ('NEGOTIATION_PRICE', 'BANK_FINANCING_QUOTE', 'VISIT_NOTE', 'RISK_ALERT', 'ASSUMPTION_CHANGE', 'OTHER');

-- AlterTable
ALTER TABLE "SimulationLot" DROP COLUMN "type",
ADD COLUMN     "type" "SimulationLotType" NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "OpportunityEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "type" "OpportunityEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "impact" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpportunityEvent_organizationId_simulationId_eventDate_idx" ON "OpportunityEvent"("organizationId", "simulationId", "eventDate");

-- AddForeignKey
ALTER TABLE "OpportunityEvent" ADD CONSTRAINT "OpportunityEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityEvent" ADD CONSTRAINT "OpportunityEvent_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
