import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeatureRequestStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeatureRequestDto } from './dto/create-feature-request.dto';

type FeatureRequestRecord = Prisma.FeatureRequestGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
      };
    };
    votes: {
      where: {
        userId: string;
      };
      select: {
        id: true;
      };
    };
  };
}>;

@Injectable()
export class IdeasService {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: {
    organizationId: string;
    userId: string;
    status?: FeatureRequestStatus;
    sort?: 'top' | 'recent';
  }) {
    const ideas = await this.prisma.featureRequest.findMany({
      where: {
        organizationId: input.organizationId,
        status: input.status,
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
        votes: {
          where: {
            userId: input.userId,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy:
        input.sort === 'recent'
          ? [{ createdAt: 'desc' }]
          : [{ votesCount: 'desc' }, { createdAt: 'desc' }],
    });

    return ideas.map((idea) => this.mapIdea(idea));
  }

  async create(
    organizationId: string,
    authorId: string,
    input: CreateFeatureRequestDto,
  ) {
    const idea = await this.prisma.featureRequest.create({
      data: {
        organizationId,
        authorId,
        title: input.title.trim(),
        description: input.description.trim(),
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
        votes: {
          where: {
            userId: authorId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    return this.mapIdea(idea);
  }

  async addVote(
    organizationId: string,
    userId: string,
    featureRequestId: string,
  ) {
    await this.assertIdeaExists(organizationId, featureRequestId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.featureRequestVote.create({
          data: {
            organizationId,
            userId,
            featureRequestId,
          },
        });

        const idea = await tx.featureRequest.update({
          where: { id: featureRequestId },
          data: {
            votesCount: {
              increment: 1,
            },
          },
          select: {
            id: true,
            votesCount: true,
          },
        });

        return {
          id: idea.id,
          votesCount: idea.votesCount,
          hasVoted: true,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('You already voted for this idea');
      }

      throw error;
    }
  }

  async removeVote(
    organizationId: string,
    userId: string,
    featureRequestId: string,
  ) {
    await this.assertIdeaExists(organizationId, featureRequestId);

    return this.prisma.$transaction(async (tx) => {
      const vote = await tx.featureRequestVote.findUnique({
        where: {
          featureRequestId_userId: {
            featureRequestId,
            userId,
          },
        },
        select: {
          id: true,
        },
      });

      if (vote) {
        await tx.featureRequestVote.delete({
          where: {
            id: vote.id,
          },
        });

        await tx.featureRequest.update({
          where: { id: featureRequestId },
          data: {
            votesCount: {
              decrement: 1,
            },
          },
        });
      }

      const idea = await tx.featureRequest.findUniqueOrThrow({
        where: { id: featureRequestId },
        select: {
          id: true,
          votesCount: true,
        },
      });

      return {
        id: idea.id,
        votesCount: Math.max(0, idea.votesCount),
        hasVoted: false,
      };
    });
  }

  private async assertIdeaExists(
    organizationId: string,
    featureRequestId: string,
  ) {
    const idea = await this.prisma.featureRequest.findFirst({
      where: {
        id: featureRequestId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }
  }

  private mapIdea(idea: FeatureRequestRecord) {
    return {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      votesCount: idea.votesCount,
      status: idea.status,
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
      hasVoted: idea.votes.length > 0,
      isBeta: idea.status === FeatureRequestStatus.IN_PROGRESS,
      author: {
        id: idea.author.id,
        email: idea.author.email,
        name:
          [idea.author.firstName, idea.author.lastName]
            .filter(Boolean)
            .join(' ') || idea.author.email,
      },
    };
  }
}
