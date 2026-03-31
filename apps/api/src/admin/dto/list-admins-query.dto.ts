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
import { AdminRole } from '@prisma/client';

export class ListAdminsQueryDto {
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
}
