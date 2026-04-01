import { Module } from '@nestjs/common';
import { PilotApplicationsController } from './pilot-applications.controller';
import { PilotApplicationsService } from './pilot-applications.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [PilotApplicationsController],
  providers: [PilotApplicationsService],
})
export class PilotApplicationsModule {}
