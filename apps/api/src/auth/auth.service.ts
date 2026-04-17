import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync, hashSync } from '../common/crypto/bcrypt';
import {
  getAdminPermissions,
  getAssignableAdminRoles,
  getTrialPolicy,
  isAdminRole,
} from '../admin/admin-authorization';
import { buildAppWebUrl } from '../common/utils/app-url.util';
import { InvitationsService } from '../invitations/invitations.service';
import { LegalDocumentsService } from '../legal/legal-documents.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyInvitationQueryDto } from './dto/verify-invitation-query.dto';
import { VerifyResetPasswordQueryDto } from './dto/verify-reset-password-query.dto';
import { UserActionTokensService } from './user-action-tokens.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly invitationsService: InvitationsService,
    private readonly legalDocumentsService: LegalDocumentsService,
    private readonly mailService: MailService,
    private readonly userActionTokensService: UserActionTokensService,
  ) {}

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (
      !user?.passwordHash ||
      !compareSync(input.password, user.passwordHash)
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isSuspended) {
      throw new ForbiddenException('Account suspended');
    }

    const membership = input.organizationSlug
      ? user.memberships.find(
          (candidate) => candidate.organization.slug === input.organizationSlug,
        )
      : (user.memberships[0] ?? null);

    if (!membership && !isAdminRole(user.adminRole)) {
      throw new UnauthorizedException(
        'No organization available for this user',
      );
    }

    const lastLoginAt = new Date();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt },
    });

    const legalStatus = await this.legalDocumentsService.getAcceptanceStatus({
      userId: user.id,
      organizationId: membership?.organizationId ?? null,
      scope: 'ACCOUNT',
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      organizationId: membership?.organizationId ?? null,
      role: membership?.role ?? null,
      adminRole: user.adminRole,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        adminRole: user.adminRole,
        isSuspended: user.isSuspended,
        isPilotUser: user.isPilotUser,
        betaAccessEnabled: user.betaAccessEnabled,
        lastLoginAt,
      },
      organization: membership
        ? {
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug,
          }
        : null,
      role: membership?.role ?? null,
      admin: isAdminRole(user.adminRole)
        ? {
            role: user.adminRole,
            permissions: getAdminPermissions(user.adminRole),
            assignableRoles: getAssignableAdminRoles(user.adminRole),
            trialPolicy: getTrialPolicy(user.adminRole),
          }
        : null,
      legal: {
        accountAcceptanceRequired: !legalStatus.isSatisfied,
        missingDocumentTypes: legalStatus.missingDocumentTypes,
      },
    };
  }

  verifyInvitation(input: VerifyInvitationQueryDto) {
    return this.invitationsService.verifyToken(input.token);
  }

  async forgotPassword(input: ForgotPasswordDto) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return this.getNeutralForgotPasswordResponse();
    }

    const issuedToken =
      await this.userActionTokensService.issuePasswordResetToken(user.id);

    try {
      await this.mailService.sendPasswordReset({
        to: user.email,
        resetUrl: buildAppWebUrl(
          '/reset-password',
          new URLSearchParams({ token: issuedToken.token }),
        ),
        expiresAt: issuedToken.expiresAt,
      });
    } catch (error) {
      await this.userActionTokensService.revokePasswordResetToken(
        issuedToken.tokenId,
      );
      this.logger.error(
        `Password reset email delivery failed for user ${user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return this.getNeutralForgotPasswordResponse();
  }

  verifyPasswordResetToken(input: VerifyResetPasswordQueryDto) {
    return this.userActionTokensService.verifyPasswordResetToken(input.token);
  }

  async resetPassword(input: ResetPasswordDto) {
    const result = await this.userActionTokensService.consumePasswordResetToken(
      {
        token: input.token,
        passwordHash: hashSync(input.password, 10),
      },
    );

    this.logger.log(`Password reset completed for user ${result.userId}`);

    return {
      success: true as const,
    };
  }

  acceptInvitation(
    input: AcceptInvitationDto & {
      ipAddress?: string | null;
      userAgent?: string | null;
    },
  ) {
    return this.invitationsService.acceptInvitation(input);
  }

  private getNeutralForgotPasswordResponse() {
    return {
      success: true as const,
      message:
        'Si un compte existe pour cet email, vous allez recevoir un lien de réinitialisation.',
    };
  }
}
