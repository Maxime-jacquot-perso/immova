import { FeatureRequestStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

export class ListAdminIdeasQueryDto {
  @IsOptional()
  @IsEnum(FeatureRequestStatus)
  status?: FeatureRequestStatus;

  @IsOptional()
  @IsIn(['top', 'recent'])
  sort?: 'top' | 'recent';
}
