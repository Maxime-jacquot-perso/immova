import { OpportunityEventType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsJSON,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateOpportunityEventDto {
  @IsOptional()
  @IsEnum(OpportunityEventType)
  type?: OpportunityEventType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  impact?: string;

  @IsOptional()
  @IsJSON()
  metadata?: string;
}
