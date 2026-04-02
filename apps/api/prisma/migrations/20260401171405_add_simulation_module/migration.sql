-- CreateEnum
CREATE TYPE "SimulationStrategy" AS ENUM ('FLIP', 'RENTAL');

-- CreateEnum
CREATE TYPE "FinancingMode" AS ENUM ('CASH', 'LOAN');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('GOOD', 'REVIEW', 'RISKY');

-- CreateTable
CREATE TABLE "SimulationFolder" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "strategy" "SimulationStrategy" NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "acquisitionFees" DECIMAL(12,2) NOT NULL,
    "worksBudget" DECIMAL(12,2) NOT NULL,
    "worksBreakdownJson" JSONB,
    "financingMode" "FinancingMode" NOT NULL,
    "downPayment" DECIMAL(12,2),
    "loanAmount" DECIMAL(12,2),
    "interestRate" DECIMAL(5,2),
    "loanDurationMonths" INTEGER,
    "estimatedMonthlyPayment" DECIMAL(10,2),
    "estimatedProjectDurationMonths" INTEGER,
    "targetResalePrice" DECIMAL(12,2),
    "targetMonthlyRent" DECIMAL(10,2),
    "bufferAmount" DECIMAL(12,2),
    "notes" TEXT,
    "decisionScore" INTEGER,
    "decisionStatus" "DecisionStatus",
    "resultSummaryJson" JSONB,
    "convertedProjectId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationLot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "surface" DECIMAL(10,2),
    "estimatedRent" DECIMAL(10,2),
    "targetResaleValue" DECIMAL(12,2),
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationLot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SimulationFolder_organizationId_archivedAt_idx" ON "SimulationFolder"("organizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "Simulation_organizationId_folderId_archivedAt_idx" ON "Simulation"("organizationId", "folderId", "archivedAt");

-- CreateIndex
CREATE INDEX "Simulation_organizationId_strategy_decisionStatus_idx" ON "Simulation"("organizationId", "strategy", "decisionStatus");

-- CreateIndex
CREATE INDEX "Simulation_convertedProjectId_idx" ON "Simulation"("convertedProjectId");

-- CreateIndex
CREATE INDEX "SimulationLot_organizationId_simulationId_position_idx" ON "SimulationLot"("organizationId", "simulationId", "position");

-- AddForeignKey
ALTER TABLE "SimulationFolder" ADD CONSTRAINT "SimulationFolder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "SimulationFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_convertedProjectId_fkey" FOREIGN KEY ("convertedProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationLot" ADD CONSTRAINT "SimulationLot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationLot" ADD CONSTRAINT "SimulationLot_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
