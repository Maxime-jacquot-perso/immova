import { FeatureRequestStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { AdminReasonDto } from './admin-reason.dto';

export class UpdateFeatureRequestStatusDto extends AdminReasonDto {
  @IsEnum(FeatureRequestStatus)
  status!: FeatureRequestStatus;
}
