import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

type InvitationRecord = Awaited<
  ReturnType<InvitationsService['getInvitationByTokenOrThrow']>
>;

export type UserInvitationSummary = {
  id: string;
  email: string;
  membershipRole: MembershipRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  requiresPasswordSetup: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

export type IssuedInvitationResult = {
  invitation: UserInvitationSummary;
  deliveryMode: 'console' | 'resend' | 'failed';
  deliveryError?: string;
};

@Injectable()
export class InvitationsService {
  private readonly invitationTtlHours = Math.max(
    1,
    Number(process.env.USER_INVITATION_TTL_HOURS || 72),
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async issueInvitation(input: {
    userId: string;
    email: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    membershipRole: MembershipRole;
    createdByAdminUserId: string;
    requiresPasswordSetup: boolean;
  }): Promise<IssuedInvitationResult> {
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(
      Date.now() + this.invitationTtlHours * 60 * 60 * 1000,
    );
    const now = new Date();

    const invitation = await this.prisma.$transaction(async (tx) => {
      await tx.userInvitation.updateMany({
        where: {
          userId: input.userId,
          organizationId: input.organization.id,
          acceptedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      return tx.userInvitation.create({
        data: {
          email: input.email,
          userId: input.userId,
          organizationId: input.organization.id,
          membershipRole: input.membershipRole,
          tokenHash,
          expiresAt,
          createdByAdminUserId: input.createdByAdminUserId,
        },
      });
    });

    const acceptUrl = this.buildAcceptUrl(token);

    try {
      const delivery = await this.mailService.sendUserInvitation({
        to: input.email,
        organizationName: input.organization.name,
        organizationSlug: input.organization.slug,
        membershipRole: input.membershipRole,
        acceptUrl,
        expiresAt,
        requiresPasswordSetup: input.requiresPasswordSetup,
      });

      return {
        invitation: this.mapInvitationSummary({
          invitation,
          organization: input.organization,
          requiresPasswordSetup: input.requiresPasswordSetup,
        }),
        deliveryMode: delivery.mode,
      };
    } catch (error) {
      return {
        invitation: this.mapInvitationSummary({
          invitation,
          organization: input.organization,
          requiresPasswordSetup: input.requiresPasswordSetup,
        }),
        deliveryMode: 'failed',
        deliveryError:
          error instanceof Error ? error.message : 'Invitation email failed',
      };
    }
  }

  async listForUser(userId: string): Promise<UserInvitationSummary[]> {
    const invitations = await this.prisma.userInvitation.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            passwordHash: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((invitation) =>
      this.mapInvitationSummary({
        invitation,
        organization: invitation.organization,
        requiresPasswordSetup: !invitation.user?.passwordHash,
      }),
    );
  }

  async getInvitationTarget(invitationId: string) {
    const invitation = await this.prisma.userInvitation.findUnique({
      where: { id: invitationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            passwordHash: true,
            isSuspended: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invitation || !invitation.user) {
      throw new BadRequestException('Invitation introuvable');
    }

    return invitation;
  }

  async verifyToken(token: string) {
    const invitation = await this.getInvitationByTokenOrThrow(token);
    this.assertInvitationUsable(invitation);

    return {
      email: invitation.email,
      membershipRole: invitation.membershipRole,
      expiresAt: invitation.expiresAt,
      requiresPasswordSetup: !invitation.user?.passwordHash,
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
        slug: invitation.organization.slug,
      },
    };
  }

  async acceptInvitation(input: { token: string; password?: string }) {
    const invitation = await this.getInvitationByTokenOrThrow(input.token);
    this.assertInvitationUsable(invitation);

    if (!invitation.user) {
      throw new BadRequestException("Le compte invite n'est plus disponible");
    }

    if (!invitation.user.passwordHash && !input.password) {
      throw new BadRequestException(
        'Un mot de passe est requis pour finaliser ce compte',
      );
    }

    const acceptedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (!invitation.user) {
        throw new BadRequestException("Le compte invite n'est plus disponible");
      }

      if (!invitation.user.passwordHash && input.password) {
        await tx.user.update({
          where: { id: invitation.user.id },
          data: {
            passwordHash: hashSync(input.password, 10),
            isSuspended: false,
          },
        });
      }

      await tx.membership.upsert({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: invitation.user.id,
          },
        },
        update: {
          role: invitation.membershipRole,
        },
        create: {
          organizationId: invitation.organizationId,
          userId: invitation.user.id,
          role: invitation.membershipRole,
        },
      });

      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt,
        },
      });

      await tx.userInvitation.updateMany({
        where: {
          userId: invitation.user.id,
          organizationId: invitation.organizationId,
          id: { not: invitation.id },
          acceptedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: acceptedAt,
        },
      });
    });

    return {
      email: invitation.email,
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
        slug: invitation.organization.slug,
      },
      requiresPasswordSetup: !invitation.user.passwordHash,
    };
  }

  private async getInvitationByTokenOrThrow(token: string) {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      throw new BadRequestException("Le lien d'invitation est incomplet");
    }

    const invitation = await this.prisma.userInvitation.findUnique({
      where: {
        tokenHash: this.hashToken(normalizedToken),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            passwordHash: true,
            isSuspended: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new BadRequestException("Ce lien d'invitation est invalide");
    }

    return invitation;
  }

  private assertInvitationUsable(invitation: InvitationRecord) {
    if (invitation.acceptedAt) {
      throw new GoneException('Cette invitation a deja ete utilisee');
    }

    if (invitation.revokedAt) {
      throw new GoneException("Cette invitation n'est plus active");
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('Cette invitation a expire');
    }

    if (!invitation.user) {
      throw new BadRequestException("Le compte invite n'est plus disponible");
    }

    if (invitation.user.isSuspended) {
      throw new ForbiddenException('Ce compte est suspendu');
    }
  }

  private mapInvitationSummary(input: {
    invitation: {
      id: string;
      email: string;
      membershipRole: MembershipRole;
      expiresAt: Date;
      acceptedAt: Date | null;
      revokedAt: Date | null;
      createdAt: Date;
    };
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    requiresPasswordSetup: boolean;
  }): UserInvitationSummary {
    return {
      id: input.invitation.id,
      email: input.invitation.email,
      membershipRole: input.invitation.membershipRole,
      status: this.getInvitationStatus(input.invitation),
      expiresAt: input.invitation.expiresAt,
      acceptedAt: input.invitation.acceptedAt,
      revokedAt: input.invitation.revokedAt,
      createdAt: input.invitation.createdAt,
      requiresPasswordSetup: input.requiresPasswordSetup,
      organization: input.organization,
    };
  }

  private getInvitationStatus(invitation: {
    acceptedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
  }) {
    if (invitation.acceptedAt) {
      return 'ACCEPTED' as const;
    }

    if (invitation.revokedAt) {
      return 'REVOKED' as const;
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      return 'EXPIRED' as const;
    }

    return 'PENDING' as const;
  }

  private generateToken() {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildAcceptUrl(token: string) {
    const appWebUrl = (
      process.env.APP_WEB_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');

    return `${appWebUrl}/setup-password?token=${encodeURIComponent(token)}`;
  }
}
