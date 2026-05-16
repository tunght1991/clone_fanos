import { createHash, randomBytes } from 'node:crypto';

export function generateRefreshToken(): string {
  return `rft_${randomBytes(32).toString('base64url')}`;
}

export function hashRefreshToken(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('base64url');
}

