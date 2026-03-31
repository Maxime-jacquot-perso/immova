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
import { ADMIN_PERMISSIONS } from './admin-authorization';
import { AdminAdminsService } from './admin-admins.service';
import { extractAdminRequestContext } from './admin-request-context';
import { AdminUsersService } from './admin-users.service';
import { AdminPermissions } from './decorators/admin-permissions.decorator';
import { ChangeAdminRoleDto } from './dto/change-admin-role.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ListAdminsQueryDto } from './dto/list-admins-query.dto';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';

@Controller('admin/admins')
@UseGuards(JwtAuthGuard, AdminAccessGuard, AdminPermissionsGuard)
export class AdminAdminsController {
  constructor(
    private readonly adminAdminsService: AdminAdminsService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.adminsRead)
  list(@Query() query: ListAdminsQueryDto) {
    return this.adminAdminsService.list(query);
  }

  @Post()
  @AdminPermissions(
    ADMIN_PERMISSIONS.adminsCreate,
    ADMIN_PERMISSIONS.adminRolesManage,
  )
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: CreateAdminDto,
    @Req() request: Request,
  ) {
    return this.adminAdminsService.createAdmin(
      actor,
      body,
      extractAdminRequestContext(request),
    );
  }

  @Patch(':userId/change-role')
  @AdminPermissions(
    ADMIN_PERMISSIONS.adminsUpdate,
    ADMIN_PERMISSIONS.adminRolesManage,
  )
  changeRole(
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
