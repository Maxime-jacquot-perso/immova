import { OpportunityEventType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsJSON,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOpportunityEventDto {
  @IsEnum(OpportunityEventType)
  type!: OpportunityEventType;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  eventDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  impact?: string;

  @IsOptional()
  @IsJSON()
  metadata?: string;
}
