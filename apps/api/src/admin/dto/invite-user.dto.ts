import { MembershipRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  invitationOrganizationModeInputs,
  type InvitationOrganizationModeInput,
} from '../../invitations/invitation-organization-mode';
import { AdminReasonDto } from './admin-reason.dto';

export class InviteUserDto extends AdminReasonDto {
  @IsEmail()
  email!: string;

  @IsIn(invitationOrganizationModeInputs)
  organizationMode!: InvitationOrganizationModeInput;

  @ValidateIf((input: InviteUserDto) => input.organizationMode === 'existing')
  @IsString()
  @MinLength(1)
  organizationId?: string;

  @IsEnum(MembershipRole)
  membershipRole!: MembershipRole;
}
