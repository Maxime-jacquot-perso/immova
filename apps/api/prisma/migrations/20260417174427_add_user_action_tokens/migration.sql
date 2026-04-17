-- CreateEnum
CREATE TYPE "UserActionTokenType" AS ENUM ('PASSWORD_RESET');

-- CreateTable
CREATE TABLE "UserActionToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "UserActionTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserActionToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserActionToken_tokenHash_key" ON "UserActionToken"("tokenHash");

-- CreateIndex
CREATE INDEX "UserActionToken_userId_type_createdAt_idx" ON "UserActionToken"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "UserActionToken_userId_type_expiresAt_idx" ON "UserActionToken"("userId", "type", "expiresAt");

-- AddForeignKey
ALTER TABLE "UserActionToken" ADD CONSTRAINT "UserActionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
