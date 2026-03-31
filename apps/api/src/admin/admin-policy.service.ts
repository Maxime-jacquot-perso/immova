import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminRole, SubscriptionStatus, User } from '@prisma/client';
import {
  getAssignableAdminRoles,
  getTrialPolicy,
  getAdminRoleLevel,
} from './admin-authorization';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  assertCanCreateAdmin(actorRole: AdminRole, nextRole: AdminRole) {
    if (nextRole === AdminRole.USER) {
      throw new BadRequestException(
        'Use the standard user flow to create a non-admin account',
      );
    }

    if (!this.canAssignRole(actorRole, nextRole)) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot create an admin with role ${nextRole}`,
      );
    }
  }

  async assertCanChangeAdminRole(input: {
    actorUserId: string;
    actorRole: AdminRole;
    targetUserId: string;
    targetCurrentRole: AdminRole;
    nextRole: AdminRole;
  }) {
    if (input.actorUserId === input.targetUserId) {
      throw new ForbiddenException('You cannot change your own admin role');
    }

    if (!this.canManageTargetRole(input.actorRole, input.targetCurrentRole)) {
      throw new ForbiddenException(
        `Role ${input.actorRole} cannot manage ${input.targetCurrentRole}`,
      );
    }

    if (
      input.nextRole !== AdminRole.USER &&
      !this.canAssignRole(input.actorRole, input.nextRole)
    ) {
      throw new ForbiddenException(
        `Role ${input.actorRole} cannot assign ${input.nextRole}`,
      );
    }

    if (
      input.targetCurrentRole === AdminRole.SUPER_ADMIN &&
      input.nextRole !== AdminRole.SUPER_ADMIN
    ) {
      await this.assertNotLastActiveSuperAdmin(input.targetUserId);
    }
  }

  async assertCanSuspend(input: {
    actorUserId: string;
    actorRole: AdminRole;
    target: Pick<User, 'id' | 'adminRole' | 'isSuspended'>;
  }) {
    if (input.actorUserId === input.target.id) {
      throw new ForbiddenException('You cannot suspend your own account');
    }

    if (input.target.isSuspended) {
      throw new BadRequestException('This account is already suspended');
    }

    if (!this.canManageTargetRole(input.actorRole, input.target.adminRole)) {
      throw new ForbiddenException(
        `Role ${input.actorRole} cannot suspend ${input.target.adminRole}`,
      );
    }

    if (input.target.adminRole === AdminRole.SUPER_ADMIN) {
      await this.assertNotLastActiveSuperAdmin(input.target.id);
    }
  }

  assertCanReactivate(input: {
    actorUserId: string;
    actorRole: AdminRole;
    target: Pick<User, 'id' | 'adminRole' | 'isSuspended'>;
  }) {
    if (input.actorUserId === input.target.id) {
      throw new ForbiddenException('You cannot reactivate your own account');
    }

    if (!input.target.isSuspended) {
      throw new BadRequestException('This account is already active');
    }

    if (!this.canManageTargetRole(input.actorRole, input.target.adminRole)) {
      throw new ForbiddenException(
        `Role ${input.actorRole} cannot reactivate ${input.target.adminRole}`,
      );
    }
  }

  assertCanGrantTrial(
    actorRole: AdminRole,
    target: Pick<User, 'isSuspended' | 'subscriptionStatus' | 'trialEndsAt'>,
    durationDays: number,
  ) {
    const policy = getTrialPolicy(actorRole);
    if (!policy) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot grant a trial period`,
      );
    }

    if (target.isSuspended) {
      throw new BadRequestException(
        'Suspended accounts cannot receive a trial',
      );
    }

    if (target.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        'Active subscriptions cannot receive a new trial',
      );
    }

    if (target.trialEndsAt && target.trialEndsAt.getTime() > Date.now()) {
      throw new BadRequestException('This account already has an active trial');
    }

    if (durationDays > policy.maxGrantDays) {
      throw new ForbiddenException(
        `This role can grant at most ${policy.maxGrantDays} days`,
      );
    }
  }

  assertCanExtendTrial(
    actorRole: AdminRole,
    target: Pick<
      User,
      | 'isSuspended'
      | 'subscriptionStatus'
      | 'trialEndsAt'
      | 'trialExtensionsCount'
    >,
    durationDays: number,
  ) {
    const policy = getTrialPolicy(actorRole);
    if (!policy) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot extend a trial period`,
      );
    }

    if (target.isSuspended) {
      throw new BadRequestException('Suspended accounts cannot extend a trial');
    }

    if (
      target.subscriptionStatus !== SubscriptionStatus.TRIAL ||
      !target.trialEndsAt
    ) {
      throw new BadRequestException('No active trial is available to extend');
    }

    if (target.trialEndsAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Expired trials cannot be extended with this action',
      );
    }

    if (durationDays > policy.maxExtensionDays) {
      throw new ForbiddenException(
        `This role can extend at most ${policy.maxExtensionDays} days`,
      );
    }

    if (
      policy.maxExtensionCount !== null &&
      target.trialExtensionsCount >= policy.maxExtensionCount
    ) {
      throw new ForbiddenException(
        `This role reached the maximum of ${policy.maxExtensionCount} trial extensions`,
      );
    }
  }

  private canAssignRole(actorRole: AdminRole, nextRole: AdminRole) {
    return getAssignableAdminRoles(actorRole).includes(nextRole);
  }

  private canManageTargetRole(actorRole: AdminRole, targetRole: AdminRole) {
    if (targetRole === AdminRole.USER) {
      return getAdminRoleLevel(actorRole) >= getAdminRoleLevel(AdminRole.ADMIN);
    }

    if (actorRole === AdminRole.SUPER_ADMIN) {
      return true;
    }

    if (actorRole === AdminRole.ADMIN) {
      return (
        [
          AdminRole.READONLY_ADMIN,
          AdminRole.SALES_ADMIN,
          AdminRole.SUPPORT_ADMIN,
          AdminRole.USER,
        ] as AdminRole[]
      ).includes(targetRole);
    }

    return false;
  }

  private async assertNotLastActiveSuperAdmin(targetUserId: string) {
    const activeSuperAdminsCount = await this.prisma.user.count({
      where: {
        adminRole: AdminRole.SUPER_ADMIN,
        isSuspended: false,
      },
    });

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        adminRole: true,
        isSuspended: true,
      },
    });

    if (
      target?.adminRole === AdminRole.SUPER_ADMIN &&
      !target.isSuspended &&
      activeSuperAdminsCount <= 1
    ) {
      throw new ForbiddenException(
        'The last active SUPER_ADMIN cannot be removed or suspended',
      );
    }
  }
}
