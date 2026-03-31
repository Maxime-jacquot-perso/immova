import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ADMIN_PERMISSIONS } from './admin-authorization';
import { AdminIdeasService } from './admin-ideas.service';
import { extractAdminRequestContext } from './admin-request-context';
import { AdminPermissions } from './decorators/admin-permissions.decorator';
import { ListAdminIdeasQueryDto } from './dto/list-admin-ideas-query.dto';
import { UpdateFeatureRequestStatusDto } from './dto/update-feature-request-status.dto';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';

@Controller('admin/ideas')
@UseGuards(JwtAuthGuard, AdminAccessGuard, AdminPermissionsGuard)
export class AdminIdeasController {
  constructor(private readonly adminIdeasService: AdminIdeasService) {}

  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.ideasRead)
  list(@Query() query: ListAdminIdeasQueryDto) {
    return this.adminIdeasService.list(query);
  }

  @Patch(':featureRequestId/status')
  @AdminPermissions(ADMIN_PERMISSIONS.ideasUpdate)
  updateStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('featureRequestId') featureRequestId: string,
    @Body() body: UpdateFeatureRequestStatusDto,
    @Req() request: Request,
  ) {
    return this.adminIdeasService.updateStatus(
      actor,
      featureRequestId,
      body,
      extractAdminRequestContext(request),
    );
  }
}
