import {
  Body,
  Controller,
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
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { LotsService } from './lots.service';

@Controller('projects/:projectId/lots')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.lotsService.list(user.organizationId!, projectId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() body: CreateLotDto,
  ) {
    return this.lotsService.create(user.organizationId!, projectId, body);
  }

  @Patch(':lotId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('lotId') lotId: string,
    @Body() body: UpdateLotDto,
  ) {
    return this.lotsService.update(
      user.organizationId!,
      projectId,
      lotId,
      body,
    );
  }
}
