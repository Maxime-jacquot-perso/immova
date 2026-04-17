import { createHash, randomBytes } from 'node:crypto';

export function generateSecureToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSecureToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
