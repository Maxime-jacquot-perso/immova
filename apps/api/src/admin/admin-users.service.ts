import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminAuditAction,
  AdminAuditTargetType,
  AdminRole,
  Prisma,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import { addDays } from '../common/utils/date.util';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { InvitationsService } from '../invitations/invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { ADMIN_PERMISSIONS, hasAdminPermission } from './admin-authorization';
import { AdminPolicyService } from './admin-policy.service';
import type { AdminRequestContext } from './admin-request-context';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { ReactivateUserDto } from './dto/reactivate-user.dto';
import { GrantTrialDto } from './dto/grant-trial.dto';
import { ExtendTrialDto } from './dto/extend-trial.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ChangeAdminRoleDto } from './dto/change-admin-role.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { ResendInvitationDto } from './dto/resend-invitation.dto';

type UserListRecord = Prisma.UserGetPayload<{
  include: {
    memberships: {
      include: {
        organization: {
          select: {
            id: true;
            name: true;
            slug: true;
            _count: {
              select: {
                projects: true;
              };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAuditService: AdminAuditService,
    private readonly adminPolicyService: AdminPolicyService,
    private readonly invitationsService: InvitationsService,
  ) {}

  async list(query: ListAdminUsersQueryDto) {
    const where = this.buildWhere(query);
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          memberships: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  _count: {
                    select: {
                      projects: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      items: users.map((user) => this.mapUserSummary(user)),
    };
  }

  async listOrganizationOptions() {
    const organizations = await this.prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            memberships: true,
            projects: true,
          },
        },
      },
    });

    return organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      membersCount: organization._count.memberships,
      projectsCount: organization._count.projects,
    }));
  }

  async inviteUser(
    actor: AuthenticatedUser,
    body: InviteUserDto,
    requestContext: AdminRequestContext,
  ) {
    const email = body.email.toLowerCase();
    const organization = await this.getOrganization(body.organizationId);
    let user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isSuspended: true,
      },
    });

    if (user?.isSuspended) {
      throw new BadRequestException('Suspended accounts cannot be invited');
    }

    if (user) {
      const existingMembership = await this.prisma.membership.findUnique({
        where: {
          organizationId_userId: {
            organizationId: organization.id,
            userId: user.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingMembership) {
        throw new BadRequestException(
          'This user already belongs to the selected organization',
        );
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          adminRole: AdminRole.USER,
        },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          isSuspended: true,
        },
      });
    }

    const invitationResult = await this.invitationsService.issueInvitation({
      userId: user.id,
      email,
      organization,
      membershipRole: body.membershipRole,
      createdByAdminUserId: actor.userId,
      requiresPasswordSetup: !user.passwordHash,
    });

    await this.adminAuditService.record({
      actorUserId: actor.userId,
      targetUserId: user.id,
      action: AdminAuditAction.USER_INVITED,
      targetType: AdminAuditTargetType.USER,
      reason: body.reason,
      newValue: {
        organizationId: organization.id,
        organizationSlug: organization.slug,
        membershipRole: body.membershipRole,
        invitationId: invitationResult.invitation.id,
        deliveryMode: invitationResult.deliveryMode,
      },
      metadata: { actorAdminRole: actor.adminRole },
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });

    if (invitationResult.deliveryMode === 'failed') {
      throw new InternalServerErrorException(
        "Invitation creee mais l'email n'a pas pu etre envoye. Utilisez le detail utilisateur pour renvoyer le lien.",
      );
    }

    return {
      userId: user.id,
      email,
      invitation: invitationResult.invitation,
      deliveryMode: invitationResult.deliveryMode,
    };
  }

  async resendInvitation(
    actor: AuthenticatedUser,
    invitationId: string,
    body: ResendInvitationDto,
    requestContext: AdminRequestContext,
  ) {
    const currentInvitation =
      await this.invitationsService.getInvitationTarget(invitationId);
    const invitedUser = currentInvitation.user;

    if (!invitedUser) {
      throw new BadRequestException('Invitation introuvable');
    }

    if (invitedUser.isSuspended) {
      throw new BadRequestException('Suspended accounts cannot be invited');
    }

    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: currentInvitation.organization.id,
          userId: invitedUser.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingMembership) {
      throw new BadRequestException(
        'This user already belongs to the selected organization',
      );
    }

    const invitationResult = await this.invitationsService.issueInvitation({
      userId: invitedUser.id,
      email: currentInvitation.email,
      organization: currentInvitation.organization,
      membershipRole: currentInvitation.membershipRole,
      createdByAdminUserId: actor.userId,
      requiresPasswordSetup: !invitedUser.passwordHash,
    });

    await this.adminAuditService.record({
      actorUserId: actor.userId,
      targetUserId: invitedUser.id,
      action: AdminAuditAction.USER_INVITE_RESENT,
      targetType: AdminAuditTargetType.USER,
      reason: body.reason,
      oldValue: {
        invitationId,
        invitationStatus: this.getInvitationStatus(currentInvitation),
      },
      newValue: {
        invitationId: invitationResult.invitation.id,
        organizationId: currentInvitation.organization.id,
        organizationSlug: currentInvitation.organization.slug,
        membershipRole: currentInvitation.membershipRole,
        deliveryMode: invitationResult.deliveryMode,
      },
      metadata: { actorAdminRole: actor.adminRole },
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });

    if (invitationResult.deliveryMode === 'failed') {
      throw new InternalServerErrorException(
        "L'invitation a ete regeneree mais l'email n'a pas pu etre envoye.",
      );
    }

    return {
      userId: invitedUser.id,
      email: currentInvitation.email,
      invitation: invitationResult.invitation,
      deliveryMode: invitationResult.deliveryMode,
    };
  }

  async findOne(actor: AuthenticatedUser, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                  select: {
                    projects: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const recentAuditLogs = hasAdminPermission(
      actor.adminRole,
      ADMIN_PERMISSIONS.auditRead,
    )
      ? await this.adminAuditService.listRecentForUser(user.id)
      : [];
    const invitations = await this.invitationsService.listForUser(user.id);
    const totalProjectsCount = user.memberships.reduce(
      (total, membership) => total + membership.organization._count.projects,
      0,
    );

    return {
      ...this.mapUserSummary(user),
      memberships: user.memberships.map((membership) => ({
        id: membership.id,
        role: membership.role,
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
          projectsCount: membership.organization._count.projects,
        },
      })),
      totalProjectsCount,
      invitations,
      recentAuditLogs,
    };
  }

  async suspendUser(
    actor: AuthenticatedUser,
    userId: string,
    body: SuspendUserDto,
    requestContext: AdminRequestContext,
  ) {
    const target = await this.getManagedUser(userId);
    await this.adminPolicyService.assertCanSuspend({
      actorUserId: actor.userId,
      actorRole: actor.adminRole,
      target,
    });

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isSuspended: true },
      });

      await this.adminAuditService.record({
        client: tx,
        actorUserId: actor.userId,
        targetUserId: userId,
        action: AdminAuditAction.USER_SUSPENDED,
        targetType: AdminAuditTargetType.USER,
        reason: body.reason,
        oldValue: { isSuspended: target.isSuspended },
        newValue: { isSuspended: true },
        metadata: { actorAdminRole: actor.adminRole },
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      });

      return this.mapSimpleMutationResult(updatedUser);
    });
  }

  async reactivateUser(
    actor: AuthenticatedUser,
    userId: string,
    body: ReactivateUserDto,
    requestContext: AdminRequestContext,
  ) {
    const target = await this.getManagedUser(userId);
    this.adminPolicyService.assertCanReactivate({
      actorUserId: actor.userId,
      actorRole: actor.adminRole,
      target,
    });

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isSuspended: false },
      });

      await this.adminAuditService.record({
        client: tx,
        actorUserId: actor.userId,
        targetUserId: userId,
        action: AdminAuditAction.USER_REACTIVATED,
        targetType: AdminAuditTargetType.USER,
        reason: body.reason,
        oldValue: { isSuspended: target.isSuspended },
        newValue: { isSuspended: false },
        metadata: { actorAdminRole: actor.adminRole },
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      });

      return this.mapSimpleMutationResult(updatedUser);
    });
  }

  async grantTrial(
    actor: AuthenticatedUser,
    userId: string,
    body: GrantTrialDto,
    requestContext: AdminRequestContext,
  ) {
    const target = await this.getManagedUser(userId);
    this.adminPolicyService.assertCanGrantTrial(
      actor.adminRole,
      target,
      body.durationDays,
    );

    const nextTrialEndsAt = addDays(new Date(), body.durationDays);

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: SubscriptionStatus.TRIAL,
          trialEndsAt: nextTrialEndsAt,
          trialExtensionsCount: 0,
        },
      });

      await this.adminAuditService.record({
        client: tx,
        actorUserId: actor.userId,
        targetUserId: userId,
        action: AdminAuditAction.TRIAL_GRANTED,
        targetType: AdminAuditTargetType.SUBSCRIPTION,
        reason: body.reason,
        oldValue: {
          subscriptionStatus: target.subscriptionStatus,
          trialEndsAt: target.trialEndsAt,
          trialExtensionsCount: target.trialExtensionsCount,
        },
        newValue: {
          subscriptionStatus: SubscriptionStatus.TRIAL,
          trialEndsAt: nextTrialEndsAt,
          trialExtensionsCount: 0,
          durationDays: body.durationDays,
        },
        metadata: { actorAdminRole: actor.adminRole },
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      });

      return this.mapSimpleMutationResult(updatedUser);
    });
  }

  async extendTrial(
    actor: AuthenticatedUser,
    userId: string,
    body: ExtendTrialDto,
    requestContext: AdminRequestContext,
  ) {
    const target = await this.getManagedUser(userId);
    this.adminPolicyService.assertCanExtendTrial(
      actor.adminRole,
      target,
      body.durationDays,
    );

    const currentTrialEndsAt = target.trialEndsAt ?? new Date();
    const nextTrialEndsAt = addDays(currentTrialEndsAt, body.durationDays);

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          trialEndsAt: nextTrialEndsAt,
          trialExtensionsCount: {
            increment: 1,
          },
        },
      });

      await this.adminAuditService.record({
        client: tx,
        actorUserId: actor.userId,
        targetUserId: userId,
        action: AdminAuditAction.TRIAL_EXTENDED,
        targetType: AdminAuditTargetType.SUBSCRIPTION,
        reason: body.reason,
        oldValue: {
          subscriptionStatus: target.subscriptionStatus,
          trialEndsAt: target.trialEndsAt,
          trialExtensionsCount: target.trialExtensionsCount,
        },
        newValue: {
          subscriptionStatus: SubscriptionStatus.TRIAL,
          trialEndsAt: nextTrialEndsAt,
          trialExtensionsCount: target.trialExtensionsCount + 1,
          durationDays: body.durationDays,
        },
        metadata: { actorAdminRole: actor.adminRole },
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      });

      return this.mapSimpleMutationResult(updatedUser);
    });
  }

  async updateSubscription(
    actor: AuthenticatedUser,
    userId: string,
    body: UpdateSubscriptionDto,
    requestContext: AdminRequestContext,
  ) {
    const target = await this.getManagedUser(userId);

    if (body.subscriptionStatus === SubscriptionStatus.TRIAL) {
      throw new BadRequestException(
        'Use trial grant or trial extension actions to manage a trial status',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionPlan: body.subscriptionPlan,
          subscriptionStatus: body.subscriptionStatus,
          trialEndsAt: null,
          trialExtensionsCount: 0,
        },
      });

      await this.adminAuditService.record({
        client: tx,
        actorUserId: actor.userId,
        targetUserId: userId,
        action: AdminAuditAction.SUBSCRIPTION_UPDATED,
        targetType: AdminAuditTargetType.SUBSCRIPTION,
        reason: body.reason,
        oldValue: {
          subscriptionPlan: target.subscriptionPlan,
          subscriptionStatus: target.subscriptionStatus,
          trialEndsAt: target.trialEndsAt,
          trialExtensionsCount: target.trialExtensionsCount,
        },
        newValue: {
          subscriptionPlan: body.subscriptionPlan,
          subscriptionStatus: body.subscriptionStatus,
          trialEndsAt: null,
          trialExtensionsCount: 0,
        },
        metadata: { actorAdminRole: actor.adminRole },
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      });

      return this.mapSimpleMutationResult(updatedUser);
    });
  }

  async changeAdminRole(
    actor: AuthenticatedUser,
    userId: string,
    body: ChangeAdminRoleDto,
    requestContext: AdminRequestContext,
  ) {
    const target = await this.getManagedUser(userId);

    await this.adminPolicyService.assertCanChangeAdminRole({
      actorUserId: actor.userId,
      actorRole: actor.adminRole,
      targetUserId: userId,
      targetCurrentRole: target.adminRole,
      nextRole: body.adminRole,
    });

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          adminRole: body.adminRole,
        },
      });

      await this.adminAuditService.record({
        client: tx,
        actorUserId: actor.userId,
        targetUserId: userId,
        action: AdminAuditAction.ADMIN_ROLE_CHANGED,
        targetType: AdminAuditTargetType.ADMIN,
        reason: body.reason,
        oldValue: { adminRole: target.adminRole },
        newValue: { adminRole: body.adminRole },
        metadata: { actorAdminRole: actor.adminRole },
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      });

      return this.mapSimpleMutationResult(updatedUser);
    });
  }

  private async getOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  private buildWhere(query: ListAdminUsersQueryDto): Prisma.UserWhereInput {
    const search = query.search?.trim();

    return {
      adminRole: query.adminRole,
      subscriptionPlan: query.subscriptionPlan,
      subscriptionStatus: query.subscriptionStatus,
      ...(query.accessStatus === 'ACTIVE'
        ? { isSuspended: false }
        : query.accessStatus === 'SUSPENDED'
          ? { isSuspended: true }
          : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              {
                memberships: {
                  some: {
                    organization: {
                      name: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
              {
                memberships: {
                  some: {
                    organization: {
                      slug: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  private async getManagedUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        adminRole: true,
        isSuspended: true,
        trialEndsAt: true,
        trialExtensionsCount: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private mapUserSummary(user: UserListRecord) {
    const totalProjectsCount = user.memberships.reduce(
      (total, membership) => total + membership.organization._count.projects,
      0,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      adminRole: user.adminRole,
      isSuspended: user.isSuspended,
      accessStatus: user.isSuspended ? 'SUSPENDED' : 'ACTIVE',
      trialEndsAt: user.trialEndsAt,
      trialExtensionsCount: user.trialExtensionsCount,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      organizationsCount: user.memberships.length,
      totalProjectsCount,
      organizations: user.memberships.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
        projectsCount: membership.organization._count.projects,
      })),
    };
  }

  private mapSimpleMutationResult(user: {
    id: string;
    adminRole: AdminRole;
    isSuspended: boolean;
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt: Date | null;
    trialExtensionsCount: number;
  }) {
    return {
      id: user.id,
      adminRole: user.adminRole,
      isSuspended: user.isSuspended,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      trialExtensionsCount: user.trialExtensionsCount,
    };
  }

  private getInvitationStatus(invitation: {
    acceptedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
  }) {
    if (invitation.acceptedAt) {
      return 'ACCEPTED';
    }

    if (invitation.revokedAt) {
      return 'REVOKED';
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      return 'EXPIRED';
    }

    return 'PENDING';
  }
}
