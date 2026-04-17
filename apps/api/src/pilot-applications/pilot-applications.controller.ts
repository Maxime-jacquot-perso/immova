import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { CreatePilotApplicationDto } from './dto/create-pilot-application.dto';
import {
  CreatePilotCheckoutSessionDto,
  PilotCheckoutTokenQueryDto,
} from './dto/pilot-checkout-token.dto';
import { PilotApplicationsService } from './pilot-applications.service';

@Controller('pilot-applications')
export class PilotApplicationsController {
  private readonly logger = new Logger(PilotApplicationsController.name);

  constructor(
    private readonly pilotApplicationsService: PilotApplicationsService,
  ) {}

  @Post()
  async create(@Body() createDto: CreatePilotApplicationDto) {
    this.logger.log(
      `Received pilot application from ${createDto.email.trim().toLowerCase()}`,
    );

    return this.pilotApplicationsService.create(createDto);
  }

  @Get('checkout')
  getCheckoutContext(@Query() query: PilotCheckoutTokenQueryDto) {
    return this.pilotApplicationsService.getCheckoutContext(query.token);
  }

  @Post('checkout-session')
  createCheckoutSession(@Body() body: CreatePilotCheckoutSessionDto) {
    return this.pilotApplicationsService.createCheckoutSession(body);
  }
}
