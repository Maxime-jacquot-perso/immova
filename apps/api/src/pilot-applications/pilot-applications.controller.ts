import {
  Body,
  Controller,
  Post,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PilotApplicationsService } from './pilot-applications.service';
import { CreatePilotApplicationDto } from './dto/create-pilot-application.dto';

@Controller('pilot-applications')
export class PilotApplicationsController {
  private readonly logger = new Logger(PilotApplicationsController.name);

  constructor(
    private readonly pilotApplicationsService: PilotApplicationsService,
  ) {}

  @Post()
  async create(@Body() createDto: CreatePilotApplicationDto) {
    try {
      this.logger.log(`Received pilot application from ${createDto.email}`);
      this.logger.debug(`Full payload: ${JSON.stringify(createDto)}`);

      await this.pilotApplicationsService.create(createDto);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to process pilot application: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to process application: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
