import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AdminAuditAction,
  AdminAuditTargetType,
  FeatureRequestStatus,
  Prisma,
} from '@prisma/client';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminRequestContext } from './admin-request-context';
import { AdminAuditService } from './admin-audit.service';
import { ListAdminIdeasQueryDto } from './dto/list-admin-ideas-query.dto';
import { UpdateFeatureRequestStatusDto } from './dto/update-feature-request-status.dto';

type AdminFeatureRequestRecord = Prisma.FeatureRequestGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
      };
    };
    organization: {
      select: {
        id: true;
        name: true;
        slug: true;
      };
    };
  };
}>;

@Injectable()
export class AdminIdeasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  async list(query: ListAdminIdeasQueryDto) {
    const ideas = await this.prisma.featureRequest.findMany({
      where: {
        status: query.status,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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
      orderBy:
        query.sort === 'top'
          ? [{ votesCount: 'desc' }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }],
    });

    return ideas.map((idea) => this.mapIdea(idea));
  }

  async updateStatus(
    actor: AuthenticatedUser,
    featureRequestId: string,
    body: UpdateFeatureRequestStatusDto,
    requestContext: AdminRequestContext,
  ) {
    const idea = await this.prisma.featureRequest.findUnique({
      where: { id: featureRequestId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    if (idea.status === body.status) {
      return this.mapIdea(idea);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedIdea = await tx.featureRequest.update({
        where: { id: featureRequestId },
        data: { status: body.status },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
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

      await this.adminAuditService.record({
        client: tx,
        actorUserId: actor.userId,
        action: AdminAuditAction.FEATURE_REQUEST_STATUS_UPDATED,
        targetType: AdminAuditTargetType.FEATURE_REQUEST,
        reason: body.reason,
        oldValue: {
          featureRequestId: idea.id,
          status: idea.status,
        },
        newValue: {
          featureRequestId: updatedIdea.id,
          status: updatedIdea.status,
        },
        metadata: {
          actorAdminRole: actor.adminRole,
          organizationId: updatedIdea.organizationId,
        },
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
      });

      return this.mapIdea(updatedIdea);
    });
  }

  private mapIdea(idea: AdminFeatureRequestRecord) {
    return {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      votesCount: idea.votesCount,
      status: idea.status,
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
      isBeta: idea.status === FeatureRequestStatus.IN_PROGRESS,
      author: {
        id: idea.author.id,
        email: idea.author.email,
        name:
          [idea.author.firstName, idea.author.lastName]
            .filter(Boolean)
            .join(' ') || idea.author.email,
      },
      organization: idea.organization,
    };
  }
}
