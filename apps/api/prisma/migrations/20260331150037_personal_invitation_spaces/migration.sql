-- CreateEnum
CREATE TYPE "InvitationOrganizationMode" AS ENUM ('EXISTING', 'PERSONAL');

-- AlterTable
ALTER TABLE "UserInvitation" ADD COLUMN     "organizationMode" "InvitationOrganizationMode" NOT NULL DEFAULT 'EXISTING',
ALTER COLUMN "organizationId" DROP NOT NULL;
