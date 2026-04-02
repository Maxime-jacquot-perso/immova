import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { SimulationOptionSource } from '@prisma/client';

export class CreateOptionDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsObject()
  @IsNotEmpty()
  valueJson: Record<string, any>;

  @IsEnum(SimulationOptionSource)
  @IsOptional()
  source?: SimulationOptionSource;

  @IsString()
  @IsOptional()
  sourceEventId?: string;
}
