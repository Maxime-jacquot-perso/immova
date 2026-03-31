-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('USER', 'SUPER_ADMIN', 'ADMIN', 'SALES_ADMIN', 'SUPPORT_ADMIN', 'READONLY_ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "AdminAuditAction" AS ENUM ('TRIAL_GRANTED', 'TRIAL_EXTENDED', 'USER_SUSPENDED', 'USER_REACTIVATED', 'SUBSCRIPTION_UPDATED', 'ADMIN_CREATED', 'ADMIN_ROLE_CHANGED');

-- CreateEnum
CREATE TYPE "AdminAuditTargetType" AS ENUM ('USER', 'ADMIN', 'SUBSCRIPTION');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "adminRole" "AdminRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialExtensionsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "action" "AdminAuditAction" NOT NULL,
    "targetType" "AdminAuditTargetType" NOT NULL,
    "reason" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_adminRole_idx" ON "User"("adminRole");

-- CreateIndex
CREATE INDEX "User_isSuspended_subscriptionStatus_idx" ON "User"("isSuspended", "subscriptionStatus");

-- CreateIndex
CREATE INDEX "User_subscriptionPlan_idx" ON "User"("subscriptionPlan");

-- CreateIndex
CREATE INDEX "User_trialEndsAt_idx" ON "User"("trialEndsAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorUserId_createdAt_idx" ON "AdminAuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetUserId_createdAt_idx" ON "AdminAuditLog"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
