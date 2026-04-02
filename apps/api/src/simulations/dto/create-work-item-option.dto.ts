import { IsString, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkItemOptionDto {
  @IsString()
  providerName!: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  cost!: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  durationDays?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
