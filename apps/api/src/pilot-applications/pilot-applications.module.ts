import { Module } from '@nestjs/common';
import { BillingCoreModule } from '../billing/billing-core.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { MailModule } from '../mail/mail.module';
import { PilotApplicationsController } from './pilot-applications.controller';
import { PilotApplicationsService } from './pilot-applications.service';

@Module({
  imports: [MailModule, InvitationsModule, BillingCoreModule],
  controllers: [PilotApplicationsController],
  providers: [PilotApplicationsService],
  exports: [PilotApplicationsService],
})
export class PilotApplicationsModule {}
