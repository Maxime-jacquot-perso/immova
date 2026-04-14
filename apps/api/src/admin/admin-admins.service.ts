import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AdminAuditAction,
  AdminAuditTargetType,
  AdminRole,
  Prisma,
} from '@prisma/client';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { hashSync } from '../common/crypto/bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminPolicyService } from './admin-policy.service';
import type { AdminRequestContext } from './admin-request-context';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ListAdminsQueryDto } from './dto/list-admins-query.dto';

@Injectable()
export class AdminAdminsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAuditService: AdminAuditService,
    private readonly adminPolicyService: AdminPolicyService,
  ) {}

  async list(query: ListAdminsQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      adminRole:
        query.adminRole && query.adminRole !== AdminRole.USER
          ? query.adminRole
          : {
              not: AdminRole.USER,
            },
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, admins] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          adminRole: true,
          isSuspended: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
    ]);

    const adminIds = admins.map((admin) => admin.id);
    const logs =
      adminIds.length > 0
        ? await this.prisma.adminAuditLog.findMany({
            where: {
              targetUserId: {
                in: adminIds,
              },
              action: {
                in: [
                  AdminAuditAction.ADMIN_CREATED,
                  AdminAuditAction.ADMIN_ROLE_CHANGED,
                ],
              },
            },
            include: {
              actorUser: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : [];

    const latestLogByTarget = new Map<string, (typeof logs)[number]>();
    const createdLogByTarget = new Map<string, (typeof logs)[number]>();

    logs.forEach((log) => {
      if (!log.targetUserId) {
        return;
      }

      if (!latestLogByTarget.has(log.targetUserId)) {
        latestLogByTarget.set(log.targetUserId, log);
      }

      if (log.action === AdminAuditAction.ADMIN_CREATED) {
        createdLogByTarget.set(log.targetUserId, log);
      }
    });

    return {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      items: admins.map((admin) => ({
        ...admin,
        fullName:
          [admin.firstName, admin.lastName].filter(Boolean).join(' ') ||
          admin.email,
        createdBy: this.mapActor(createdLogByTarget.get(admin.id)),
        updatedBy: this.mapActor(latestLogByTarget.get(admin.id)),
      })),
    };
  }

  async createAdmin(
    actor: AuthenticatedUser,
    body: CreateAdminDto,
    requestContext: AdminRequestContext,
  ) {
    this.adminPolicyService.assertCanCreateAdmin(
      actor.adminRole,
      body.adminRole,
    );

    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException(
        'A user with this email already exists. Promote it from the users screen instead.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email.toLowerCase(),
          firstName: body.firstName,
          lastName: body.lastName,
          passwordHash: hashSync(body.password, 10),
          adminRole: body.adminRole,
        },
      });

      await this.adminAuditService.record({
        client: tx,
        actorUserId: actor.userId,
        targetUserId: user.id,
        action: AdminAuditAction.ADMIN_CREATED,
        targetType: AdminAuditTargetType.ADMIN,
        reason: body.reason,
        oldValue: { adminRole: AdminRole.USER },
        newValue: { adminRole: body.adminRole },
        metadata: { actorAdminRole: actor.adminRole },
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      });

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        adminRole: user.adminRole,
        isSuspended: user.isSuspended,
        createdAt: user.createdAt,
      };
    });
  }

  private mapActor(log?: {
    actorUser: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      adminRole: AdminRole;
    };
    createdAt: Date;
  }) {
    if (!log) {
      return null;
    }

    return {
      id: log.actorUser.id,
      email: log.actorUser.email,
      firstName: log.actorUser.firstName,
      lastName: log.actorUser.lastName,
      adminRole: log.actorUser.adminRole,
      createdAt: log.createdAt,
    };
  }
}
