import { Module } from '@nestjs/common';
import { LegalDocumentsModule } from '../legal/legal-documents.module';
import { BillingAccessService } from './billing-access.service';
import { BillingConfigService } from './billing-config.service';
import { BillingController } from './billing.controller';
import { BillingPlanMapService } from './billing-plan-map.service';
import { BillingService } from './billing.service';
import { StripeClientService } from './stripe-client.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [LegalDocumentsModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [
    BillingAccessService,
    BillingConfigService,
    BillingPlanMapService,
    BillingService,
    StripeClientService,
    StripeWebhookService,
  ],
  exports: [BillingAccessService],
})
export class BillingModule {}
