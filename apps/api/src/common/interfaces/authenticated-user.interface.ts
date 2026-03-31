import { AdminRole, MembershipRole } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string | null;
  membershipRole: MembershipRole | null;
  adminRole: AdminRole;
}
