import { FeatureRequestStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

export class ListIdeasQueryDto {
  @IsOptional()
  @IsEnum(FeatureRequestStatus)
  status?: FeatureRequestStatus;

  @IsOptional()
  @IsIn(['top', 'recent'])
  sort?: 'top' | 'recent';
}
