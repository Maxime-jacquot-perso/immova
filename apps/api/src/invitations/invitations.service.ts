import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
} from '@nestjs/common';
import {
  LegalAcceptanceSource,
  InvitationOrganizationMode,
  MembershipRole,
  Prisma,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { hashSync } from '../common/crypto/bcrypt';
import { LegalDocumentsService } from '../legal/legal-documents.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  serializeInvitationOrganizationMode,
  type InvitationOrganizationModeInput,
} from './invitation-organization-mode';
import {
  buildPersonalOrganizationName,
  buildPersonalOrganizationSlug,
} from './personal-organization';

type InvitationRecord = Awaited<
  ReturnType<InvitationsService['getInvitationByTokenOrThrow']>
>;

export type UserInvitationSummary = {
  id: string;
  email: string;
  organizationMode: InvitationOrganizationModeInput;
  membershipRole: MembershipRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  requiresPasswordSetup: boolean;
  organization: {
    id: string | null;
    name: string;
    slug: string;
  };
};

export type IssuedInvitationResult = {
  invitation: UserInvitationSummary;
  deliveryMode: 'console' | 'smtp' | 'resend' | 'failed';
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
    private readonly legalDocumentsService: LegalDocumentsService,
  ) {}

  async issueInvitation(input: {
    userId: string;
    email: string;
    organizationMode: InvitationOrganizationMode;
    organization: {
      id: string;
      name: string;
      slug: string;
    } | null;
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
    const organizationSummary = this.resolveOrganizationSummary({
      organizationMode: input.organizationMode,
      organization: input.organization,
      userId: input.userId,
      email: input.email,
    });

    const invitation = await this.prisma.$transaction(async (tx) => {
      await tx.userInvitation.updateMany({
        where: this.buildPendingInvitationsScope({
          userId: input.userId,
          organizationMode: input.organizationMode,
          organizationId: input.organization?.id ?? null,
        }),
        data: {
          revokedAt: now,
        },
      });

      return tx.userInvitation.create({
        data: {
          email: input.email,
          userId: input.userId,
          organizationMode: input.organizationMode,
          organizationId: input.organization?.id ?? null,
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
        organizationName: organizationSummary.name,
        organizationSlug: organizationSummary.slug,
        membershipRole: input.membershipRole,
        acceptUrl,
        expiresAt,
        requiresPasswordSetup: input.requiresPasswordSetup,
      });

      return {
        invitation: this.mapInvitationSummary({
          invitation,
          organization: organizationSummary,
          requiresPasswordSetup: input.requiresPasswordSetup,
        }),
        deliveryMode: delivery.mode,
      };
    } catch (error) {
      return {
        invitation: this.mapInvitationSummary({
          invitation,
          organization: organizationSummary,
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
        organization: this.resolveOrganizationSummary({
          organizationMode: invitation.organizationMode,
          organization: invitation.organization,
          userId: invitation.userId,
          email: invitation.email,
        }),
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

    return {
      ...invitation,
      organizationSummary: this.resolveOrganizationSummary({
        organizationMode: invitation.organizationMode,
        organization: invitation.organization,
        userId: invitation.user.id,
        email: invitation.email,
      }),
    };
  }

  async verifyToken(token: string) {
    const invitation = await this.getInvitationByTokenOrThrow(token);
    this.assertInvitationUsable(invitation);
    const organizationSummary = this.resolveOrganizationSummary({
      organizationMode: invitation.organizationMode,
      organization: invitation.organization,
      userId: invitation.user?.id ?? invitation.userId,
      email: invitation.email,
    });

    return {
      email: invitation.email,
      organizationMode: serializeInvitationOrganizationMode(
        invitation.organizationMode,
      ),
      membershipRole: invitation.membershipRole,
      expiresAt: invitation.expiresAt,
      requiresPasswordSetup: !invitation.user?.passwordHash,
      organization: organizationSummary,
    };
  }

  async acceptInvitation(input: {
    token: string;
    password?: string;
    acceptLegalDocuments: true;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
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
    let acceptedOrganization: {
      id: string;
      name: string;
      slug: string;
    } | null = invitation.organization;

    await this.prisma.$transaction(async (tx) => {
      if (!invitation.user) {
        throw new BadRequestException("Le compte invite n'est plus disponible");
      }

      const organization =
        invitation.organizationMode === InvitationOrganizationMode.EXISTING
          ? this.assertExistingOrganization(invitation.organization)
          : await this.ensurePersonalOrganization(tx, {
              userId: invitation.user.id,
              email: invitation.email,
            });
      acceptedOrganization = organization;

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
            organizationId: organization.id,
            userId: invitation.user.id,
          },
        },
        update: {
          role: invitation.membershipRole,
        },
        create: {
          organizationId: organization.id,
          userId: invitation.user.id,
          role: invitation.membershipRole,
        },
      });

      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt,
          organizationId: organization.id,
        },
      });

      await tx.userInvitation.updateMany({
        where: {
          ...this.buildPendingInvitationsScope({
            userId: invitation.user.id,
            organizationMode: invitation.organizationMode,
            organizationId: organization.id,
          }),
          id: { not: invitation.id },
        },
        data: {
          revokedAt: acceptedAt,
        },
      });

      await this.legalDocumentsService.acceptCurrentDocuments(
        {
          userId: invitation.user.id,
          organizationId: organization.id,
          scope: 'ACCOUNT',
          source: LegalAcceptanceSource.INVITATION_SETUP,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
        tx,
      );
    });

    return {
      email: invitation.email,
      organization: this.assertExistingOrganization(acceptedOrganization),
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
      organizationMode: InvitationOrganizationMode;
      membershipRole: MembershipRole;
      expiresAt: Date;
      acceptedAt: Date | null;
      revokedAt: Date | null;
      createdAt: Date;
    };
    organization: {
      id: string | null;
      name: string;
      slug: string;
    };
    requiresPasswordSetup: boolean;
  }): UserInvitationSummary {
    return {
      id: input.invitation.id,
      email: input.invitation.email,
      organizationMode: serializeInvitationOrganizationMode(
        input.invitation.organizationMode,
      ),
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

  private buildPendingInvitationsScope(input: {
    userId: string;
    organizationMode: InvitationOrganizationMode;
    organizationId: string | null;
  }): Prisma.UserInvitationWhereInput {
    return {
      userId: input.userId,
      organizationMode: input.organizationMode,
      acceptedAt: null,
      revokedAt: null,
      ...(input.organizationMode === InvitationOrganizationMode.EXISTING
        ? { organizationId: this.assertOrganizationId(input.organizationId) }
        : {}),
    };
  }

  private resolveOrganizationSummary(input: {
    organizationMode: InvitationOrganizationMode;
    organization: {
      id: string;
      name: string;
      slug: string;
    } | null;
    userId?: string | null;
    email: string;
  }) {
    if (input.organization) {
      return {
        id: input.organization.id,
        name: input.organization.name,
        slug: input.organization.slug,
      };
    }

    if (input.organizationMode === InvitationOrganizationMode.EXISTING) {
      throw new BadRequestException(
        "L'organisation cible de l'invitation est introuvable",
      );
    }

    const personalUserId = this.assertUserId(input.userId);

    return {
      id: null,
      name: buildPersonalOrganizationName({ email: input.email }),
      slug: buildPersonalOrganizationSlug(personalUserId),
    };
  }

  private async ensurePersonalOrganization(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      email: string;
    },
  ) {
    const slug = buildPersonalOrganizationSlug(input.userId);

    return tx.organization.upsert({
      where: { slug },
      update: {},
      create: {
        name: buildPersonalOrganizationName({ email: input.email }),
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  private assertExistingOrganization(
    organization: {
      id: string;
      name: string;
      slug: string;
    } | null,
  ) {
    if (!organization) {
      throw new BadRequestException(
        "L'organisation cible de l'invitation est introuvable",
      );
    }

    return organization;
  }

  private assertOrganizationId(organizationId: string | null) {
    if (!organizationId) {
      throw new BadRequestException(
        "L'organisation cible de l'invitation est introuvable",
      );
    }

    return organizationId;
  }

  private assertUserId(userId?: string | null) {
    if (!userId) {
      throw new BadRequestException("Le compte invite n'est plus disponible");
    }

    return userId;
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
