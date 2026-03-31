import type { Request } from 'express';

export type AdminRequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export function extractAdminRequestContext(
  request: Request,
): AdminRequestContext {
  const userAgent = request.get('user-agent') ?? null;

  return {
    ipAddress: request.ip ?? null,
    userAgent,
  };
}
