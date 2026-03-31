import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AdminRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: Record<string, string | null | undefined>) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        isSuspended: true,
        adminRole: true,
        memberships: payload.organizationId
          ? {
              where: {
                organizationId: payload.organizationId,
              },
              select: {
                organizationId: true,
                role: true,
              },
              take: 1,
            }
          : false,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }

    if (user.isSuspended) {
      throw new ForbiddenException('Account suspended');
    }

    const membership =
      payload.organizationId && Array.isArray(user.memberships)
        ? (user.memberships[0] ?? null)
        : null;

    if (payload.organizationId && !membership) {
      throw new UnauthorizedException('Organization access revoked');
    }

    return {
      userId: user.id,
      email: user.email,
      organizationId: membership?.organizationId ?? null,
      membershipRole: membership?.role ?? null,
      adminRole: user.adminRole ?? AdminRole.USER,
    };
  }
}
