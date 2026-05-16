import { UnauthorizedException } from '@nestjs/common';

export function requireUserId(userId: string | undefined, source = 'x-user-id'): string {
  if (!userId || !userId.trim()) {
    throw new UnauthorizedException(`Missing ${source} header`);
  }

  return userId.trim();
}

