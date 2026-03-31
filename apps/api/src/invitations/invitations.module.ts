import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [MailModule],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
