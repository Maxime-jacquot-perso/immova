import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ADMIN_PERMISSIONS } from './admin-authorization';
import { AdminPermissions } from './decorators/admin-permissions.decorator';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, AdminAccessGuard, AdminPermissionsGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.dashboardRead)
  getDashboard(@CurrentUser() actor: AuthenticatedUser) {
    return this.adminDashboardService.getDashboard(actor.adminRole);
  }
}
