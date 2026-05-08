import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AdminAuditAction } from '@prisma/client';

export class ListAdminAuditLogsQueryDto {
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 1;
    return Number(value);
  })
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 20;
    return Number(value);
  })
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 20;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(AdminAuditAction)
  action?: AdminAuditAction;

  @IsOptional()
  @IsString()
  actorUserId?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;
}
