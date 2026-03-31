import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { AdminReasonDto } from './admin-reason.dto';

export class UpdateSubscriptionDto extends AdminReasonDto {
  @IsEnum(SubscriptionPlan)
  subscriptionPlan!: SubscriptionPlan;

  @IsEnum(SubscriptionStatus)
  subscriptionStatus!: SubscriptionStatus;
}
