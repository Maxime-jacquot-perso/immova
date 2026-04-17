-- CreateEnum
CREATE TYPE "PilotApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAYMENT_PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PilotApplicationProvisioningStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PilotApplicationEventType" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CHECKOUT_LINK_SENT', 'CHECKOUT_STARTED', 'CHECKOUT_COMPLETED', 'PAYMENT_CONFIRMED', 'PROVISIONING_COMPLETED', 'PROVISIONING_FAILED', 'CANCELLED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAuditAction" ADD VALUE 'PILOT_APPLICATION_APPROVED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'PILOT_APPLICATION_REJECTED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'PILOT_APPLICATION_CHECKOUT_LINK_SENT';

-- AlterEnum
ALTER TYPE "AdminAuditTargetType" ADD VALUE 'PILOT_APPLICATION';

-- CreateTable
CREATE TABLE "PilotApplication" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "projectCount" TEXT NOT NULL,
    "problemDescription" TEXT NOT NULL,
    "acknowledgementAcceptedAt" TIMESTAMP(3) NOT NULL,
    "status" "PilotApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "provisioningStatus" "PilotApplicationProvisioningStatus" NOT NULL DEFAULT 'PENDING',
    "organizationName" TEXT,
    "internalNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "paymentStartedAt" TIMESTAMP(3),
    "paymentConfirmedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "checkoutLinkSentAt" TIMESTAMP(3),
    "checkoutTokenHash" TEXT,
    "checkoutTokenExpiresAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "organizationId" TEXT,
    "userId" TEXT,
    "invitationId" TEXT,
    "provisioningErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotApplicationEvent" (
    "id" TEXT NOT NULL,
    "pilotApplicationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" "PilotApplicationEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PilotApplication_checkoutTokenHash_key" ON "PilotApplication"("checkoutTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PilotApplication_stripeCheckoutSessionId_key" ON "PilotApplication"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PilotApplication_stripeSubscriptionId_key" ON "PilotApplication"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "PilotApplication_organizationId_key" ON "PilotApplication"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PilotApplication_invitationId_key" ON "PilotApplication"("invitationId");

-- CreateIndex
CREATE INDEX "PilotApplication_normalizedEmail_createdAt_idx" ON "PilotApplication"("normalizedEmail", "createdAt");

-- CreateIndex
CREATE INDEX "PilotApplication_status_createdAt_idx" ON "PilotApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PilotApplication_provisioningStatus_createdAt_idx" ON "PilotApplication"("provisioningStatus", "createdAt");

-- CreateIndex
CREATE INDEX "PilotApplication_reviewedByUserId_reviewedAt_idx" ON "PilotApplication"("reviewedByUserId", "reviewedAt");

-- CreateIndex
CREATE INDEX "PilotApplication_organizationId_idx" ON "PilotApplication"("organizationId");

-- CreateIndex
CREATE INDEX "PilotApplication_userId_idx" ON "PilotApplication"("userId");

-- CreateIndex
CREATE INDEX "PilotApplicationEvent_pilotApplicationId_createdAt_idx" ON "PilotApplicationEvent"("pilotApplicationId", "createdAt");

-- CreateIndex
CREATE INDEX "PilotApplicationEvent_type_createdAt_idx" ON "PilotApplicationEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "PilotApplicationEvent_actorUserId_createdAt_idx" ON "PilotApplicationEvent"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "PilotApplication" ADD CONSTRAINT "PilotApplication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotApplication" ADD CONSTRAINT "PilotApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotApplication" ADD CONSTRAINT "PilotApplication_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotApplication" ADD CONSTRAINT "PilotApplication_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "UserInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotApplicationEvent" ADD CONSTRAINT "PilotApplicationEvent_pilotApplicationId_fkey" FOREIGN KEY ("pilotApplicationId") REFERENCES "PilotApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotApplicationEvent" ADD CONSTRAINT "PilotApplicationEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
