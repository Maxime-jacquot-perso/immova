import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SimulationOptionGroupType } from '@prisma/client';

export class CreateOptionGroupDto {
  @IsEnum(SimulationOptionGroupType)
  @IsNotEmpty()
  type: SimulationOptionGroupType;

  @IsString()
  @IsNotEmpty()
  label: string;
}
