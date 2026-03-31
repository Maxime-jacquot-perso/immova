import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ADMIN_PERMISSIONS } from './admin-authorization';
import { AdminAuditService } from './admin-audit.service';
import { AdminPermissions } from './decorators/admin-permissions.decorator';
import { ListAdminAuditLogsQueryDto } from './dto/list-admin-audit-logs-query.dto';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, AdminAccessGuard, AdminPermissionsGuard)
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.auditRead)
  list(@Query() query: ListAdminAuditLogsQueryDto) {
    return this.adminAuditService.list(query);
  }
}
