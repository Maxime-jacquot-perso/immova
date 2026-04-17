-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('MENTIONS_LEGALES', 'CGU', 'CGV', 'PRIVACY_POLICY');

-- CreateEnum
CREATE TYPE "LegalAcceptanceSource" AS ENUM ('INVITATION_SETUP', 'IN_APP', 'CHECKOUT');

-- CreateTable
CREATE TABLE "LegalDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentType" "LegalDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "documentUpdatedAt" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLegalAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "legalDocumentVersionId" TEXT NOT NULL,
    "source" "LegalAcceptanceSource" NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "UserLegalAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocumentVersion_documentType_version_key" ON "LegalDocumentVersion"("documentType", "version");

-- CreateIndex
CREATE INDEX "LegalDocumentVersion_documentType_isCurrent_idx" ON "LegalDocumentVersion"("documentType", "isCurrent");

-- CreateIndex
CREATE INDEX "UserLegalAcceptance_userId_acceptedAt_idx" ON "UserLegalAcceptance"("userId", "acceptedAt");

-- CreateIndex
CREATE INDEX "UserLegalAcceptance_organizationId_acceptedAt_idx" ON "UserLegalAcceptance"("organizationId", "acceptedAt");

-- CreateIndex
CREATE INDEX "UserLegalAcceptance_legalDocumentVersionId_acceptedAt_idx" ON "UserLegalAcceptance"("legalDocumentVersionId", "acceptedAt");

-- CreateIndex
CREATE INDEX "UserLegalAcceptance_userId_legalDocumentVersionId_idx" ON "UserLegalAcceptance"("userId", "legalDocumentVersionId");

-- AddForeignKey
ALTER TABLE "UserLegalAcceptance" ADD CONSTRAINT "UserLegalAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLegalAcceptance" ADD CONSTRAINT "UserLegalAcceptance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLegalAcceptance" ADD CONSTRAINT "UserLegalAcceptance_legalDocumentVersionId_fkey" FOREIGN KEY ("legalDocumentVersionId") REFERENCES "LegalDocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
