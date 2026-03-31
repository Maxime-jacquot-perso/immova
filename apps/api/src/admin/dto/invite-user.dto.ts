import { MembershipRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { AdminReasonDto } from './admin-reason.dto';

export class InviteUserDto extends AdminReasonDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  organizationId!: string;

  @IsEnum(MembershipRole)
  membershipRole!: MembershipRole;
}
