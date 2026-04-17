import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from '../common/crypto/bcrypt';
import {
  getAdminPermissions,
  getAssignableAdminRoles,
  getTrialPolicy,
  isAdminRole,
} from '../admin/admin-authorization';
import { InvitationsService } from '../invitations/invitations.service';
import { LegalDocumentsService } from '../legal/legal-documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyInvitationQueryDto } from './dto/verify-invitation-query.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly invitationsService: InvitationsService,
    private readonly legalDocumentsService: LegalDocumentsService,
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

  acceptInvitation(
    input: AcceptInvitationDto & {
      ipAddress?: string | null;
      userAgent?: string | null;
    },
  ) {
    return this.invitationsService.acceptInvitation(input);
  }
}
