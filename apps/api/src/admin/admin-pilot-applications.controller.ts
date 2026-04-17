import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ListAdminPilotApplicationsQueryDto } from '../pilot-applications/dto/list-admin-pilot-applications-query.dto';
import {
  ApprovePilotApplicationDto,
  RejectPilotApplicationDto,
  SendPilotCheckoutLinkDto,
} from '../pilot-applications/dto/pilot-application-review.dto';
import { ADMIN_PERMISSIONS } from './admin-authorization';
import { AdminPilotApplicationsService } from './admin-pilot-applications.service';
import { extractAdminRequestContext } from './admin-request-context';
import { AdminPermissions } from './decorators/admin-permissions.decorator';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';

@Controller('admin/pilot-applications')
@UseGuards(JwtAuthGuard, AdminAccessGuard, AdminPermissionsGuard)
export class AdminPilotApplicationsController {
  constructor(
    private readonly adminPilotApplicationsService: AdminPilotApplicationsService,
  ) {}

  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.pilotApplicationsRead)
  list(@Query() query: ListAdminPilotApplicationsQueryDto) {
    return this.adminPilotApplicationsService.list(query);
  }

  @Get(':applicationId')
  @AdminPermissions(ADMIN_PERMISSIONS.pilotApplicationsRead)
  findOne(@Param('applicationId') applicationId: string) {
    return this.adminPilotApplicationsService.findOne(applicationId);
  }

  @Patch(':applicationId/approve')
  @AdminPermissions(ADMIN_PERMISSIONS.pilotApplicationsUpdate)
  approve(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('applicationId') applicationId: string,
    @Body() body: ApprovePilotApplicationDto,
    @Req() request: Request,
  ) {
    return this.adminPilotApplicationsService.approve(
      actor,
      applicationId,
      body,
      extractAdminRequestContext(request),
    );
  }

  @Patch(':applicationId/reject')
  @AdminPermissions(ADMIN_PERMISSIONS.pilotApplicationsUpdate)
  reject(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('applicationId') applicationId: string,
    @Body() body: RejectPilotApplicationDto,
    @Req() request: Request,
  ) {
    return this.adminPilotApplicationsService.reject(
      actor,
      applicationId,
      body,
      extractAdminRequestContext(request),
    );
  }

  @Post(':applicationId/send-checkout-link')
  @AdminPermissions(ADMIN_PERMISSIONS.pilotApplicationsUpdate)
  resendCheckoutLink(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('applicationId') applicationId: string,
    @Body() body: SendPilotCheckoutLinkDto,
    @Req() request: Request,
  ) {
    return this.adminPilotApplicationsService.resendCheckoutLink(
      actor,
      applicationId,
      body,
      extractAdminRequestContext(request),
    );
  }
}
