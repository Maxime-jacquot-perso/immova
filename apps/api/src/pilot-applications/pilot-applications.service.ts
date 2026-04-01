import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { CreatePilotApplicationDto } from './dto/create-pilot-application.dto';

@Injectable()
export class PilotApplicationsService {
  private readonly logger = new Logger(PilotApplicationsService.name);
  private readonly notificationEmail =
    process.env.PILOT_NOTIFICATION_EMAIL || 'contact@axelys.fr';

  constructor(private readonly mailService: MailService) {}

  async create(dto: CreatePilotApplicationDto) {
    this.logger.log(`New pilot application from ${dto.email}`);

    // Send notification email
    await this.mailService.sendPilotApplicationNotification({
      to: this.notificationEmail,
      application: dto,
    });

    return { success: true };
  }
}
