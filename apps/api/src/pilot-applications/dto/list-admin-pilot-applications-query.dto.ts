import { Transform } from 'class-transformer';
import { PilotApplicationStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListAdminPilotApplicationsQueryDto {
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
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(PilotApplicationStatus)
  status?: PilotApplicationStatus;
}
