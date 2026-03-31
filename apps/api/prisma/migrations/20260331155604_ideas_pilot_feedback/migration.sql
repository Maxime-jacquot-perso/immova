-- CreateEnum
CREATE TYPE "FeatureRequestStatus" AS ENUM ('OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAuditAction" ADD VALUE 'USER_PILOT_ACCESS_UPDATED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'FEATURE_REQUEST_STATUS_UPDATED';

-- AlterEnum
ALTER TYPE "AdminAuditTargetType" ADD VALUE 'FEATURE_REQUEST';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "betaAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPilotUser" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FeatureRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "votesCount" INTEGER NOT NULL DEFAULT 0,
    "status" "FeatureRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureRequestVote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureRequestVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeatureRequest_organizationId_status_createdAt_idx" ON "FeatureRequest"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "FeatureRequest_organizationId_votesCount_createdAt_idx" ON "FeatureRequest"("organizationId", "votesCount", "createdAt");

-- CreateIndex
CREATE INDEX "FeatureRequest_authorId_createdAt_idx" ON "FeatureRequest"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "FeatureRequestVote_organizationId_featureRequestId_idx" ON "FeatureRequestVote"("organizationId", "featureRequestId");

-- CreateIndex
CREATE INDEX "FeatureRequestVote_organizationId_userId_idx" ON "FeatureRequestVote"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureRequestVote_featureRequestId_userId_key" ON "FeatureRequestVote"("featureRequestId", "userId");

-- CreateIndex
CREATE INDEX "User_isPilotUser_betaAccessEnabled_idx" ON "User"("isPilotUser", "betaAccessEnabled");

-- AddForeignKey
ALTER TABLE "FeatureRequest" ADD CONSTRAINT "FeatureRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureRequest" ADD CONSTRAINT "FeatureRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureRequestVote" ADD CONSTRAINT "FeatureRequestVote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureRequestVote" ADD CONSTRAINT "FeatureRequestVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureRequestVote" ADD CONSTRAINT "FeatureRequestVote_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "FeatureRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
