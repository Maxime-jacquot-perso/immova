import { LotStatus, LotType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLotDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsEnum(LotType)
  type?: LotType;

  @IsOptional()
  @IsEnum(LotStatus)
  status?: LotStatus;

  @IsOptional()
  @IsNumber()
  surface?: number;

  @IsOptional()
  @IsNumber()
  estimatedRent?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
