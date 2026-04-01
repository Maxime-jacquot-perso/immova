import { Body, Controller, Post } from '@nestjs/common';
import { PilotApplicationsService } from './pilot-applications.service';
import { CreatePilotApplicationDto } from './dto/create-pilot-application.dto';

@Controller('pilot-applications')
export class PilotApplicationsController {
  constructor(
    private readonly pilotApplicationsService: PilotApplicationsService,
  ) {}

  @Post()
  async create(@Body() createDto: CreatePilotApplicationDto) {
    await this.pilotApplicationsService.create(createDto);
    return { success: true };
  }
}
