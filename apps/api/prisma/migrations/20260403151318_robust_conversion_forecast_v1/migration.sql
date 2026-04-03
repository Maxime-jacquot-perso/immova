-- CreateEnum
CREATE TYPE "SimulationConversionStatus" AS ENUM ('COMPLETED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "strategy" "SimulationStrategy";

-- CreateTable
CREATE TABLE "SimulationConversion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" "SimulationConversionStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectForecastSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "referenceDate" TIMESTAMP(3) NOT NULL,
    "strategy" "SimulationStrategy" NOT NULL,
    "purchasePrice" DECIMAL(12,2),
    "acquisitionCost" DECIMAL(12,2),
    "notaryFees" DECIMAL(12,2),
    "worksBudget" DECIMAL(12,2),
    "bufferAmount" DECIMAL(12,2),
    "downPayment" DECIMAL(12,2),
    "loanAmount" DECIMAL(12,2),
    "interestRate" DECIMAL(5,2),
    "loanDurationMonths" INTEGER,
    "estimatedMonthlyPayment" DECIMAL(10,2),
    "estimatedProjectDurationMonths" INTEGER,
    "targetMonthlyRent" DECIMAL(10,2),
    "targetResalePrice" DECIMAL(12,2),
    "totalProjectCost" DECIMAL(12,2),
    "equityRequired" DECIMAL(12,2),
    "grossMargin" DECIMAL(12,2),
    "grossYield" DECIMAL(8,2),
    "monthlyCashDelta" DECIMAL(12,2),
    "decisionScore" INTEGER,
    "decisionStatus" "DecisionStatus",
    "recommendation" TEXT,
    "lotsCount" INTEGER NOT NULL DEFAULT 0,
    "lotsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectForecastSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SimulationConversion_simulationId_key" ON "SimulationConversion"("simulationId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationConversion_projectId_key" ON "SimulationConversion"("projectId");

-- CreateIndex
CREATE INDEX "SimulationConversion_organizationId_createdAt_idx" ON "SimulationConversion"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "SimulationConversion_createdByUserId_createdAt_idx" ON "SimulationConversion"("createdByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectForecastSnapshot_projectId_key" ON "ProjectForecastSnapshot"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectForecastSnapshot_simulationId_key" ON "ProjectForecastSnapshot"("simulationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectForecastSnapshot_conversionId_key" ON "ProjectForecastSnapshot"("conversionId");

-- CreateIndex
CREATE INDEX "ProjectForecastSnapshot_organizationId_referenceDate_idx" ON "ProjectForecastSnapshot"("organizationId", "referenceDate");

-- AddForeignKey
ALTER TABLE "SimulationConversion" ADD CONSTRAINT "SimulationConversion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationConversion" ADD CONSTRAINT "SimulationConversion_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationConversion" ADD CONSTRAINT "SimulationConversion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationConversion" ADD CONSTRAINT "SimulationConversion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectForecastSnapshot" ADD CONSTRAINT "ProjectForecastSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectForecastSnapshot" ADD CONSTRAINT "ProjectForecastSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectForecastSnapshot" ADD CONSTRAINT "ProjectForecastSnapshot_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectForecastSnapshot" ADD CONSTRAINT "ProjectForecastSnapshot_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "SimulationConversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
