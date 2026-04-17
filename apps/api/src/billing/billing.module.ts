import { Module } from '@nestjs/common';
import { LegalDocumentsModule } from '../legal/legal-documents.module';
import { PilotApplicationsModule } from '../pilot-applications/pilot-applications.module';
import { BillingAccessService } from './billing-access.service';
import { BillingController } from './billing.controller';
import { BillingCoreModule } from './billing-core.module';
import { BillingService } from './billing.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [BillingCoreModule, LegalDocumentsModule, PilotApplicationsModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingAccessService, BillingService, StripeWebhookService],
  exports: [BillingAccessService],
})
export class BillingModule {}
