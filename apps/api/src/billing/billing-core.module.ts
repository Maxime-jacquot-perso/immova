import { Module } from '@nestjs/common';
import { BillingConfigService } from './billing-config.service';
import { BillingPlanMapService } from './billing-plan-map.service';
import { StripeClientService } from './stripe-client.service';

@Module({
  providers: [BillingConfigService, BillingPlanMapService, StripeClientService],
  exports: [BillingConfigService, BillingPlanMapService, StripeClientService],
})
export class BillingCoreModule {}
