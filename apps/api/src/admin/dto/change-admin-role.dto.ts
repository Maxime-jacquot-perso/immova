import { AdminRole } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { AdminReasonDto } from './admin-reason.dto';

export class ChangeAdminRoleDto extends AdminReasonDto {
  @IsEnum(AdminRole)
  adminRole!: AdminRole;
}
