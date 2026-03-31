import { Injectable } from '@nestjs/common';
import { AdminRole, SubscriptionStatus } from '@prisma/client';
import { addDays } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { ADMIN_PERMISSIONS, hasAdminPermission } from './admin-authorization';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  async getDashboard(actorRole: AdminRole) {
    const now = new Date();
    const soon = addDays(now, 7);

    const [
      totalUsers,
      activeUsers,
      trialUsers,
      trialsExpiringSoon,
      suspendedUsers,
      adminRoleGroups,
      recentActions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isSuspended: false } }),
      this.prisma.user.count({
        where: {
          subscriptionStatus: SubscriptionStatus.TRIAL,
          trialEndsAt: { gt: now },
        },
      }),
      this.prisma.user.count({
        where: {
          subscriptionStatus: SubscriptionStatus.TRIAL,
          trialEndsAt: {
            gte: now,
            lte: soon,
          },
        },
      }),
      this.prisma.user.count({ where: { isSuspended: true } }),
      this.prisma.user.groupBy({
        by: ['adminRole'],
        where: {
          adminRole: {
            not: AdminRole.USER,
          },
        },
        _count: {
          _all: true,
        },
      }),
      this.adminAuditService.listRecentActions(10),
    ]);

    return {
      summary: {
        totalUsers,
        activeUsers,
        trialUsers,
        trialsExpiringSoon,
        suspendedUsers,
      },
      adminRoleDistribution: adminRoleGroups.map((item) => ({
        role: item.adminRole,
        count: item._count._all,
      })),
      recentActions: hasAdminPermission(actorRole, ADMIN_PERMISSIONS.auditRead)
        ? recentActions
        : [],
    };
  }
}
