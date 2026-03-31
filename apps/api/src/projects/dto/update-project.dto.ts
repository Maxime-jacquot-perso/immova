import { ProjectStatus, ProjectType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  notaryFees?: number;

  @IsOptional()
  @IsNumber()
  acquisitionFees?: number;

  @IsOptional()
  @IsNumber()
  worksBudget?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
