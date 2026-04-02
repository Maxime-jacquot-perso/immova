CREATE TABLE "SimulationOptionActivationLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "optionGroupId" TEXT NOT NULL,
    "previousOptionId" TEXT,
    "newOptionId" TEXT NOT NULL,
    "activatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationOptionActivationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SimulationOptionActivationLog_organizationId_simulationId_createdAt_idx"
ON "SimulationOptionActivationLog"("organizationId", "simulationId", "createdAt");

CREATE INDEX "SimulationOptionActivationLog_optionGroupId_createdAt_idx"
ON "SimulationOptionActivationLog"("optionGroupId", "createdAt");

CREATE INDEX "SimulationOptionActivationLog_activatedByUserId_createdAt_idx"
ON "SimulationOptionActivationLog"("activatedByUserId", "createdAt");

ALTER TABLE "SimulationOptionActivationLog"
ADD CONSTRAINT "SimulationOptionActivationLog_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SimulationOptionActivationLog"
ADD CONSTRAINT "SimulationOptionActivationLog_simulationId_fkey"
FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SimulationOptionActivationLog"
ADD CONSTRAINT "SimulationOptionActivationLog_optionGroupId_fkey"
FOREIGN KEY ("optionGroupId") REFERENCES "SimulationOptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
