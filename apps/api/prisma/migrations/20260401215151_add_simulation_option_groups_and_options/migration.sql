-- CreateEnum
CREATE TYPE "SimulationOptionGroupType" AS ENUM ('PURCHASE_PRICE', 'WORK_BUDGET', 'FINANCING');

-- CreateEnum
CREATE TYPE "SimulationOptionSource" AS ENUM ('MANUAL', 'FROM_EVENT');

-- CreateTable
CREATE TABLE "SimulationOptionGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "type" "SimulationOptionGroupType" NOT NULL,
    "label" TEXT NOT NULL,
    "activeOptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationOptionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationOption" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "source" "SimulationOptionSource" NOT NULL DEFAULT 'MANUAL',
    "sourceEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SimulationOptionGroup_organizationId_simulationId_idx" ON "SimulationOptionGroup"("organizationId", "simulationId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationOptionGroup_simulationId_type_key" ON "SimulationOptionGroup"("simulationId", "type");

-- CreateIndex
CREATE INDEX "SimulationOption_organizationId_groupId_idx" ON "SimulationOption"("organizationId", "groupId");

-- CreateIndex
CREATE INDEX "SimulationOption_groupId_isActive_idx" ON "SimulationOption"("groupId", "isActive");

-- CreateIndex
CREATE INDEX "SimulationOption_sourceEventId_idx" ON "SimulationOption"("sourceEventId");

-- AddForeignKey
ALTER TABLE "SimulationOptionGroup" ADD CONSTRAINT "SimulationOptionGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationOptionGroup" ADD CONSTRAINT "SimulationOptionGroup_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationOptionGroup" ADD CONSTRAINT "SimulationOptionGroup_activeOptionId_fkey" FOREIGN KEY ("activeOptionId") REFERENCES "SimulationOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationOption" ADD CONSTRAINT "SimulationOption_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationOption" ADD CONSTRAINT "SimulationOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SimulationOptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationOption" ADD CONSTRAINT "SimulationOption_sourceEventId_fkey" FOREIGN KEY ("sourceEventId") REFERENCES "OpportunityEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
