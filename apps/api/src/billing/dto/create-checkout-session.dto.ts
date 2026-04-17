import { BillingPlan } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsEnum(BillingPlan)
  plan!: BillingPlan;
}
