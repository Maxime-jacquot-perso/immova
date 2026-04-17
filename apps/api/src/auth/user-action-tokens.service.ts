import { BadRequestException, GoneException, Injectable } from '@nestjs/common';
import { UserActionTokenType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateSecureToken,
  hashSecureToken,
} from '../common/utils/secure-token.util';

type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  user: {
    id: string;
    email: string;
  };
};

@Injectable()
export class UserActionTokensService {
  private readonly passwordResetTokenTtlHours = Math.max(
    1,
    Number(process.env.PASSWORD_RESET_TOKEN_TTL_HOURS || 2),
  );

  constructor(private readonly prisma: PrismaService) {}

  async issuePasswordResetToken(userId: string) {
    const token = generateSecureToken();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.passwordResetTokenTtlHours * 60 * 60 * 1000,
    );

    const actionToken = await this.prisma.$transaction(async (tx) => {
      await tx.userActionToken.updateMany({
        where: {
          userId,
          type: UserActionTokenType.PASSWORD_RESET,
          usedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      return tx.userActionToken.create({
        data: {
          userId,
          type: UserActionTokenType.PASSWORD_RESET,
          tokenHash: hashSecureToken(token),
          expiresAt,
        },
      });
    });

    return {
      token,
      expiresAt,
      tokenId: actionToken.id,
    };
  }

  async revokePasswordResetToken(tokenId: string) {
    await this.prisma.userActionToken.updateMany({
      where: {
        id: tokenId,
        type: UserActionTokenType.PASSWORD_RESET,
        usedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async verifyPasswordResetToken(token: string) {
    const actionToken = await this.getPasswordResetTokenByTokenOrThrow(token);
    this.assertPasswordResetTokenUsable(actionToken);

    return {
      expiresAt: actionToken.expiresAt,
    };
  }

  async consumePasswordResetToken(input: {
    token: string;
    passwordHash: string;
  }) {
    const normalizedToken = input.token.trim();

    if (!normalizedToken) {
      throw new BadRequestException(
        'Le lien de réinitialisation est incomplet',
      );
    }

    const tokenHash = hashSecureToken(normalizedToken);
    const consumedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const actionToken = await tx.userActionToken.findUnique({
        where: {
          tokenHash,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (!actionToken) {
        throw new BadRequestException(
          'Ce lien de réinitialisation est invalide',
        );
      }

      this.assertPasswordResetTokenUsable(actionToken);

      const markAsUsed = await tx.userActionToken.updateMany({
        where: {
          id: actionToken.id,
          type: UserActionTokenType.PASSWORD_RESET,
          usedAt: null,
          revokedAt: null,
        },
        data: {
          usedAt: consumedAt,
        },
      });

      if (markAsUsed.count !== 1) {
        throw new GoneException("Ce lien de réinitialisation n'est plus actif");
      }

      await tx.user.update({
        where: {
          id: actionToken.userId,
        },
        data: {
          passwordHash: input.passwordHash,
        },
      });

      await tx.userActionToken.updateMany({
        where: {
          userId: actionToken.userId,
          type: UserActionTokenType.PASSWORD_RESET,
          usedAt: null,
          revokedAt: null,
          id: {
            not: actionToken.id,
          },
        },
        data: {
          revokedAt: consumedAt,
        },
      });

      return {
        userId: actionToken.user.id,
        email: actionToken.user.email,
      };
    });
  }

  private async getPasswordResetTokenByTokenOrThrow(token: string) {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      throw new BadRequestException(
        'Le lien de réinitialisation est incomplet',
      );
    }

    const actionToken = await this.prisma.userActionToken.findUnique({
      where: {
        tokenHash: hashSecureToken(normalizedToken),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!actionToken) {
      throw new BadRequestException('Ce lien de réinitialisation est invalide');
    }

    return actionToken;
  }

  private assertPasswordResetTokenUsable(
    actionToken: PasswordResetTokenRecord,
  ) {
    if (actionToken.usedAt) {
      throw new GoneException('Ce lien de réinitialisation a déjà été utilisé');
    }

    if (actionToken.revokedAt) {
      throw new GoneException("Ce lien de réinitialisation n'est plus actif");
    }

    if (actionToken.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('Ce lien de réinitialisation a expiré');
    }
  }
}
