import type { Request } from 'express';

export function extractRequestMetadata(request: Request | undefined) {
  const forwardedFor = request?.headers['x-forwarded-for'];
  const ipAddress =
    typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim() || null
      : (request?.ip ?? null);

  const userAgentHeader = request?.headers['user-agent'];
  const userAgent =
    typeof userAgentHeader === 'string' ? userAgentHeader.slice(0, 512) : null;

  return {
    ipAddress,
    userAgent,
  };
}
