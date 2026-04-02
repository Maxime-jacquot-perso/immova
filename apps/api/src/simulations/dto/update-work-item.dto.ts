import { IsString, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWorkItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  initialCost?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  estimatedDurationDays?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  position?: number;
}
