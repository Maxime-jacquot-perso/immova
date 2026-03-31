import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import {
  AdminRole,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';

export class ListAdminUsersQueryDto {
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => Number(value ?? 10))
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 10;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  adminRole?: AdminRole;

  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED'])
  accessStatus?: 'ACTIVE' | 'SUSPENDED';
}
