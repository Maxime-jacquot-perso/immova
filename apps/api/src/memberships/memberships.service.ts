import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { hashSync } from '../common/crypto/bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipRoleDto } from './dto/update-membership-role.dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt,
      user: {
        id: membership.user.id,
        email: membership.user.email,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
      },
    }));
  }

  async create(
    currentRole: string,
    organizationId: string,
    input: CreateMembershipDto,
  ) {
    if (currentRole !== MembershipRole.ADMIN) {
      throw new ForbiddenException('Only admins can manage memberships');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash: hashSync(input.password, 10),
        },
      });
    }

    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException(
        'User already belongs to this organization',
      );
    }

    return this.prisma.membership.create({
      data: {
        organizationId,
        userId: user.id,
        role: input.role,
      },
      include: { user: true },
    });
  }

  async updateRole(
    currentRole: string,
    organizationId: string,
    membershipId: string,
    input: UpdateMembershipRoleDto,
  ) {
    if (currentRole !== MembershipRole.ADMIN) {
      throw new ForbiddenException('Only admins can manage memberships');
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        id: membershipId,
        organizationId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role: input.role },
      include: { user: true },
    });
  }
}
