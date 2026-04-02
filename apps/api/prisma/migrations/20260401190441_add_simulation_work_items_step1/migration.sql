-- CreateEnum
CREATE TYPE "OptionStatus" AS ENUM ('ACTIVE', 'CANDIDATE');

-- CreateTable
CREATE TABLE "SimulationWorkItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initialCost" DECIMAL(12,2) NOT NULL,
    "estimatedDurationDays" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationWorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItemOption" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "durationDays" INTEGER,
    "notes" TEXT,
    "status" "OptionStatus" NOT NULL DEFAULT 'CANDIDATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SimulationWorkItem_organizationId_simulationId_position_idx" ON "SimulationWorkItem"("organizationId", "simulationId", "position");

-- CreateIndex
CREATE INDEX "WorkItemOption_organizationId_workItemId_status_idx" ON "WorkItemOption"("organizationId", "workItemId", "status");

-- AddForeignKey
ALTER TABLE "SimulationWorkItem" ADD CONSTRAINT "SimulationWorkItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationWorkItem" ADD CONSTRAINT "SimulationWorkItem_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItemOption" ADD CONSTRAINT "WorkItemOption_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItemOption" ADD CONSTRAINT "WorkItemOption_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "SimulationWorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
