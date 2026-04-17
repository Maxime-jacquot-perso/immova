import { GoneException } from '@nestjs/common';
import { UserActionTokensService } from './user-action-tokens.service';

describe('UserActionTokensService', () => {
  const originalEnv = process.env;

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  it('issues a password reset token and revokes previous active ones', async () => {
    process.env = {
      ...originalEnv,
      PASSWORD_RESET_TOKEN_TTL_HOURS: '2',
    };

    const tx = {
      userActionToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        create: jest.fn().mockResolvedValue({ id: 'token_1' }),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new UserActionTokensService(prisma as never);

    const issuedToken = await service.issuePasswordResetToken('user_1');

    expect(tx.userActionToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user_1',
        type: 'PASSWORD_RESET',
        usedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
    expect(tx.userActionToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user_1',
        type: 'PASSWORD_RESET',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      },
    });
    expect(issuedToken).toEqual({
      token: expect.any(String),
      expiresAt: expect.any(Date),
      tokenId: 'token_1',
    });
    expect(tx.userActionToken.create.mock.calls[0][0].data.tokenHash).not.toBe(
      issuedToken.token,
    );
  });

  it('consumes a password reset token once and revokes the remaining ones', async () => {
    const tx = {
      userActionToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'token_1',
          userId: 'user_1',
          expiresAt: new Date(Date.now() + 60_000),
          usedAt: null,
          revokedAt: null,
          user: {
            id: 'user_1',
            email: 'user@example.com',
          },
        }),
        updateMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 2 }),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new UserActionTokensService(prisma as never);

    const result = await service.consumePasswordResetToken({
      token: 'valid-reset-token-12345',
      passwordHash: 'hashed-password',
    });

    expect(tx.userActionToken.findUnique).toHaveBeenCalledWith({
      where: {
        tokenHash: expect.any(String),
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
    expect(tx.user.update).toHaveBeenCalledWith({
      where: {
        id: 'user_1',
      },
      data: {
        passwordHash: 'hashed-password',
      },
    });
    expect(tx.userActionToken.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'token_1',
        type: 'PASSWORD_RESET',
        usedAt: null,
        revokedAt: null,
      },
      data: {
        usedAt: expect.any(Date),
      },
    });
    expect(tx.userActionToken.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        userId: 'user_1',
        type: 'PASSWORD_RESET',
        usedAt: null,
        revokedAt: null,
        id: {
          not: 'token_1',
        },
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      userId: 'user_1',
      email: 'user@example.com',
    });
  });

  it('rejects expired password reset tokens during verification', async () => {
    const prisma = {
      userActionToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'token_1',
          userId: 'user_1',
          expiresAt: new Date(Date.now() - 60_000),
          usedAt: null,
          revokedAt: null,
          user: {
            id: 'user_1',
            email: 'user@example.com',
          },
        }),
      },
    };
    const service = new UserActionTokensService(prisma as never);

    await expect(
      service.verifyPasswordResetToken('expired-reset-token-12345'),
    ).rejects.toBeInstanceOf(GoneException);
  });
});
