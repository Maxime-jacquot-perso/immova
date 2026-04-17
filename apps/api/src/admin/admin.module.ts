import { Module } from '@nestjs/common';
import { InvitationsModule } from '../invitations/invitations.module';
import { PilotApplicationsModule } from '../pilot-applications/pilot-applications.module';
import { AdminAdminsController } from './admin-admins.controller';
import { AdminAdminsService } from './admin-admins.service';
import { AdminAuditController } from './admin-audit.controller';
import { AdminAuditService } from './admin-audit.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminIdeasController } from './admin-ideas.controller';
import { AdminIdeasService } from './admin-ideas.service';
import { AdminPilotApplicationsController } from './admin-pilot-applications.controller';
import { AdminPilotApplicationsService } from './admin-pilot-applications.service';
import { AdminPolicyService } from './admin-policy.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';

@Module({
  imports: [InvitationsModule, PilotApplicationsModule],
  controllers: [
    AdminDashboardController,
    AdminIdeasController,
    AdminUsersController,
    AdminAdminsController,
    AdminAuditController,
    AdminPilotApplicationsController,
  ],
  providers: [
    AdminDashboardService,
    AdminIdeasService,
    AdminUsersService,
    AdminAdminsService,
    AdminAuditService,
    AdminPilotApplicationsService,
    AdminPolicyService,
    AdminAccessGuard,
    AdminPermissionsGuard,
  ],
})
export class AdminModule {}
