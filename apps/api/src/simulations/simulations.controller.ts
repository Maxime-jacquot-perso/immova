import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from '../common/guards/organization-access.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateOpportunityEventDto } from './dto/create-opportunity-event.dto';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { CreateSimulationLotDto } from './dto/create-simulation-lot.dto';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { CreateWorkItemOptionDto } from './dto/create-work-item-option.dto';
import { UpdateOpportunityEventDto } from './dto/update-opportunity-event.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';
import { UpdateSimulationLotDto } from './dto/update-simulation-lot.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { UpdateWorkItemOptionDto } from './dto/update-work-item-option.dto';
import { SimulationsService } from './simulations.service';

@Controller('simulations')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Get('folders/:folderId/simulations')
  listByFolder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('folderId') folderId: string,
  ) {
    return this.simulationsService.listByFolder(user.organizationId!, folderId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateSimulationDto,
  ) {
    return this.simulationsService.create(user.organizationId!, body);
  }

  @Get(':simulationId')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
  ) {
    return this.simulationsService.findOne(user.organizationId!, simulationId);
  }

  @Get(':simulationId/conversion-preview')
  getConversionPreview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
  ) {
    return this.simulationsService.getConversionPreview(
      user.organizationId!,
      simulationId,
    );
  }

  @Patch(':simulationId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Body() body: UpdateSimulationDto,
  ) {
    return this.simulationsService.update(
      user.organizationId!,
      simulationId,
      body,
    );
  }

  @Post(':simulationId/archive')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
  ) {
    return this.simulationsService.archive(user.organizationId!, simulationId);
  }

  @Get('folders/:folderId/comparison')
  compareByFolder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('folderId') folderId: string,
  ) {
    return this.simulationsService.compareByFolder(
      user.organizationId!,
      folderId,
    );
  }

  @Post(':simulationId/convert-to-project')
  convertToProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
  ) {
    return this.simulationsService.convertToProject(
      user.organizationId!,
      user.userId,
      simulationId,
    );
  }

  @Get(':simulationId/lots')
  listLots(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
  ) {
    return this.simulationsService.listLots(user.organizationId!, simulationId);
  }

  @Post(':simulationId/lots')
  createLot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Body() body: CreateSimulationLotDto,
  ) {
    return this.simulationsService.createLot(
      user.organizationId!,
      simulationId,
      body,
    );
  }

  @Patch(':simulationId/lots/:lotId')
  updateLot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('lotId') lotId: string,
    @Body() body: UpdateSimulationLotDto,
  ) {
    return this.simulationsService.updateLot(
      user.organizationId!,
      simulationId,
      lotId,
      body,
    );
  }

  @Delete(':simulationId/lots/:lotId')
  deleteLot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('lotId') lotId: string,
  ) {
    return this.simulationsService.deleteLot(
      user.organizationId!,
      simulationId,
      lotId,
    );
  }

  @Get(':simulationId/events')
  listEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
  ) {
    return this.simulationsService.listEvents(
      user.organizationId!,
      simulationId,
    );
  }

  @Post(':simulationId/events')
  createEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Body() body: CreateOpportunityEventDto,
  ) {
    return this.simulationsService.createEvent(
      user.organizationId!,
      simulationId,
      body,
    );
  }

  @Patch(':simulationId/events/:eventId')
  updateEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('eventId') eventId: string,
    @Body() body: UpdateOpportunityEventDto,
  ) {
    return this.simulationsService.updateEvent(
      user.organizationId!,
      simulationId,
      eventId,
      body,
    );
  }

  @Delete(':simulationId/events/:eventId')
  deleteEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.simulationsService.deleteEvent(
      user.organizationId!,
      simulationId,
      eventId,
    );
  }

  @Get(':simulationId/work-items')
  listWorkItems(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
  ) {
    return this.simulationsService.listWorkItems(
      user.organizationId!,
      simulationId,
    );
  }

  @Post(':simulationId/work-items')
  createWorkItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Body() body: CreateWorkItemDto,
  ) {
    return this.simulationsService.createWorkItem(
      user.organizationId!,
      simulationId,
      body,
    );
  }

  @Patch(':simulationId/work-items/:itemId')
  updateWorkItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateWorkItemDto,
  ) {
    return this.simulationsService.updateWorkItem(
      user.organizationId!,
      simulationId,
      itemId,
      body,
    );
  }

  @Delete(':simulationId/work-items/:itemId')
  deleteWorkItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.simulationsService.deleteWorkItem(
      user.organizationId!,
      simulationId,
      itemId,
    );
  }

  @Post(':simulationId/work-items/:itemId/options')
  createWorkItemOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('itemId') itemId: string,
    @Body() body: CreateWorkItemOptionDto,
  ) {
    return this.simulationsService.createWorkItemOption(
      user.organizationId!,
      simulationId,
      itemId,
      body,
    );
  }

  @Patch(':simulationId/work-items/:itemId/options/:optionId')
  updateWorkItemOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('itemId') itemId: string,
    @Param('optionId') optionId: string,
    @Body() body: UpdateWorkItemOptionDto,
  ) {
    return this.simulationsService.updateWorkItemOption(
      user.organizationId!,
      simulationId,
      itemId,
      optionId,
      body,
    );
  }

  @Delete(':simulationId/work-items/:itemId/options/:optionId')
  deleteWorkItemOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('itemId') itemId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.simulationsService.deleteWorkItemOption(
      user.organizationId!,
      simulationId,
      itemId,
      optionId,
    );
  }

  @Post(':simulationId/work-items/:itemId/options/:optionId/activate')
  activateWorkItemOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('itemId') itemId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.simulationsService.activateWorkItemOption(
      user.organizationId!,
      simulationId,
      itemId,
      optionId,
    );
  }
}
