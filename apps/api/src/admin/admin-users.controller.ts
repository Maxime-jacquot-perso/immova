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
import { extractAdminRequestContext } from './admin-request-context';
import { AdminUsersService } from './admin-users.service';
import { AdminPermissions } from './decorators/admin-permissions.decorator';
import { ChangeAdminRoleDto } from './dto/change-admin-role.dto';
import { ExtendTrialDto } from './dto/extend-trial.dto';
import { GrantTrialDto } from './dto/grant-trial.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { ReactivateUserDto } from './dto/reactivate-user.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminAccessGuard, AdminPermissionsGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.usersRead)
  list(@Query() query: ListAdminUsersQueryDto) {
    return this.adminUsersService.list(query);
  }

  @Get(':userId')
  @AdminPermissions(ADMIN_PERMISSIONS.usersRead)
  findOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    return this.adminUsersService.findOne(actor, userId);
  }

  @Patch(':userId/suspend')
  @AdminPermissions(ADMIN_PERMISSIONS.usersSuspend)
  suspend(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: SuspendUserDto,
    @Req() request: Request,
  ) {
    return this.adminUsersService.suspendUser(
      actor,
      userId,
      body,
      extractAdminRequestContext(request),
    );
  }

  @Patch(':userId/reactivate')
  @AdminPermissions(ADMIN_PERMISSIONS.usersReactivate)
  reactivate(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: ReactivateUserDto,
    @Req() request: Request,
  ) {
    return this.adminUsersService.reactivateUser(
      actor,
      userId,
      body,
      extractAdminRequestContext(request),
    );
  }

  @Patch(':userId/grant-trial')
  @AdminPermissions(ADMIN_PERMISSIONS.trialGrant)
  grantTrial(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: GrantTrialDto,
    @Req() request: Request,
  ) {
    return this.adminUsersService.grantTrial(
      actor,
      userId,
      body,
      extractAdminRequestContext(request),
    );
  }

  @Patch(':userId/extend-trial')
  @AdminPermissions(ADMIN_PERMISSIONS.trialExtend)
  extendTrial(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: ExtendTrialDto,
    @Req() request: Request,
  ) {
    return this.adminUsersService.extendTrial(
      actor,
      userId,
      body,
      extractAdminRequestContext(request),
    );
  }

  @Patch(':userId/subscription')
  @AdminPermissions(ADMIN_PERMISSIONS.subscriptionOverride)
  updateSubscription(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: UpdateSubscriptionDto,
    @Req() request: Request,
  ) {
    return this.adminUsersService.updateSubscription(
      actor,
      userId,
      body,
      extractAdminRequestContext(request),
    );
  }

  @Patch(':userId/change-role')
  @AdminPermissions(
    ADMIN_PERMISSIONS.adminsUpdate,
    ADMIN_PERMISSIONS.adminRolesManage,
  )
  changeAdminRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: ChangeAdminRoleDto,
    @Req() request: Request,
  ) {
    return this.adminUsersService.changeAdminRole(
      actor,
      userId,
      body,
      extractAdminRequestContext(request),
    );
  }
}
