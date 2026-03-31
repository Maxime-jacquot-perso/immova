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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.list(user.organizationId!);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateProjectDto,
  ) {
    return this.projectsService.create(user.organizationId!, body);
  }

  @Get(':projectId')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOne(user.organizationId!, projectId);
  }

  @Patch(':projectId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projectsService.update(user.organizationId!, projectId, body);
  }

  @Get(':projectId/overview')
  overview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.overview(user.organizationId!, projectId);
  }
}
