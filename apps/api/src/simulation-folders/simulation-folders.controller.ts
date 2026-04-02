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
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { SimulationFoldersService } from './simulation-folders.service';

@Controller('simulation-folders')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class SimulationFoldersController {
  constructor(
    private readonly simulationFoldersService: SimulationFoldersService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.simulationFoldersService.list(user.organizationId!);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateFolderDto,
  ) {
    return this.simulationFoldersService.create(user.organizationId!, body);
  }

  @Get(':folderId')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('folderId') folderId: string,
  ) {
    return this.simulationFoldersService.findOne(
      user.organizationId!,
      folderId,
    );
  }

  @Patch(':folderId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('folderId') folderId: string,
    @Body() body: UpdateFolderDto,
  ) {
    return this.simulationFoldersService.update(
      user.organizationId!,
      folderId,
      body,
    );
  }

  @Post(':folderId/archive')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('folderId') folderId: string,
  ) {
    return this.simulationFoldersService.archive(
      user.organizationId!,
      folderId,
    );
  }
}
