import { LotStatus, LotType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLotDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsEnum(LotType)
  type!: LotType;

  @IsEnum(LotStatus)
  status!: LotStatus;

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
