import { InvitationOrganizationMode as PrismaInvitationOrganizationMode } from '@prisma/client';

export const invitationOrganizationModeInputs = [
  'existing',
  'personal',
] as const;

export type InvitationOrganizationModeInput =
  (typeof invitationOrganizationModeInputs)[number];

export function mapInvitationOrganizationModeInput(
  mode: InvitationOrganizationModeInput,
): PrismaInvitationOrganizationMode {
  switch (mode) {
    case 'existing':
      return PrismaInvitationOrganizationMode.EXISTING;
    case 'personal':
      return PrismaInvitationOrganizationMode.PERSONAL;
  }
}

export function serializeInvitationOrganizationMode(
  mode: PrismaInvitationOrganizationMode,
): InvitationOrganizationModeInput {
  switch (mode) {
    case PrismaInvitationOrganizationMode.EXISTING:
      return 'existing';
    case PrismaInvitationOrganizationMode.PERSONAL:
      return 'personal';
  }
}
