import { Injectable } from '@nestjs/common';
import { AdminAuditAction, AdminAuditTargetType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AuditLogRecord = Prisma.AdminAuditLogGetPayload<{
  include: {
    actorUser: true;
    targetUser: true;
  };
}>;

type ListAuditLogsInput = {
  page: number;
  pageSize: number;
  search?: string;
  action?: AdminAuditAction;
  actorUserId?: string;
  targetUserId?: string;
};

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    client?: Prisma.TransactionClient;
    actorUserId: string;
    targetUserId?: string | null;
    action: AdminAuditAction;
    targetType: AdminAuditTargetType;
    reason: string;
    oldValue?: Prisma.InputJsonValue | null;
    newValue?: Prisma.InputJsonValue | null;
    metadata?: Prisma.InputJsonValue | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const client = input.client ?? this.prisma;

    return client.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId ?? null,
        action: input.action,
        targetType: input.targetType,
        reason: input.reason,
        oldValue: input.oldValue ?? undefined,
        newValue: input.newValue ?? undefined,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress ?? undefined,
        userAgent: input.userAgent ?? undefined,
      },
    });
  }

  async list(input: ListAuditLogsInput) {
    const where = this.buildWhere(input);
    const [total, logs] = await Promise.all([
      this.prisma.adminAuditLog.count({ where }),
      this.prisma.adminAuditLog.findMany({
        where,
        include: {
          actorUser: true,
          targetUser: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
      items: logs.map((log) => this.mapLog(log)),
    };
  }

  async listRecentActions(limit = 10) {
    const logs = await this.prisma.adminAuditLog.findMany({
      include: {
        actorUser: true,
        targetUser: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log) => this.mapLog(log));
  }

  async listRecentForUser(targetUserId: string, limit = 10) {
    const logs = await this.prisma.adminAuditLog.findMany({
      where: { targetUserId },
      include: {
        actorUser: true,
        targetUser: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log) => this.mapLog(log));
  }

  private buildWhere(
    input: ListAuditLogsInput,
  ): Prisma.AdminAuditLogWhereInput {
    const search = input.search?.trim();

    return {
      action: input.action,
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
      ...(search
        ? {
            OR: [
              { reason: { contains: search, mode: 'insensitive' } },
              {
                actorUser: { email: { contains: search, mode: 'insensitive' } },
              },
              {
                actorUser: {
                  firstName: { contains: search, mode: 'insensitive' },
                },
              },
              {
                actorUser: {
                  lastName: { contains: search, mode: 'insensitive' },
                },
              },
              {
                targetUser: {
                  email: { contains: search, mode: 'insensitive' },
                },
              },
              {
                targetUser: {
                  firstName: { contains: search, mode: 'insensitive' },
                },
              },
              {
                targetUser: {
                  lastName: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
  }

  private mapLog(log: AuditLogRecord) {
    return {
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      reason: log.reason,
      oldValue: log.oldValue,
      newValue: log.newValue,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      actor: {
        id: log.actorUser.id,
        email: log.actorUser.email,
        firstName: log.actorUser.firstName,
        lastName: log.actorUser.lastName,
        adminRole: log.actorUser.adminRole,
      },
      targetUser: log.targetUser
        ? {
            id: log.targetUser.id,
            email: log.targetUser.email,
            firstName: log.targetUser.firstName,
            lastName: log.targetUser.lastName,
            adminRole: log.targetUser.adminRole,
          }
        : null,
    };
  }
}
