import { Module } from '@nestjs/common';
import { LegalDocumentsModule } from '../legal/legal-documents.module';
import { MailModule } from '../mail/mail.module';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [MailModule, LegalDocumentsModule],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
