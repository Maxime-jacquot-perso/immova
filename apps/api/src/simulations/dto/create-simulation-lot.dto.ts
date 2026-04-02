import { SimulationLotType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSimulationLotDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsEnum(SimulationLotType)
  type?: SimulationLotType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  surface?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedRent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetResaleValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
