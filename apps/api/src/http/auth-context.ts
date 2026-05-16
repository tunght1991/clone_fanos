import type { AuthController } from '../modules/auth/index.js';
import type { AuthPrincipal } from '../modules/auth/index.js';

export class AuthContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthContextError';
  }
}

export function extractBearerToken(authorization?: string): string | null {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.trim().split(/\s+/u);
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export async function resolveRequestPrincipal(
  authController: AuthController,
  authorization?: string,
  fallbackUserId?: string,
): Promise<AuthPrincipal> {
  const token = extractBearerToken(authorization);
  if (token) {
    const principal = await authController.resolvePrincipalFromToken(token);
    if (principal) {
      return principal;
    }

    throw new AuthContextError('Invalid authorization token');
  }

  if (fallbackUserId && fallbackUserId.trim()) {
    return {
      userId: fallbackUserId.trim(),
      email: `${fallbackUserId.trim()}@local`,
      displayName: fallbackUserId.trim(),
      role: 'user',
    };
  }

  throw new AuthContextError('Missing authorization');
}

export function requireRole(principal: AuthPrincipal, requiredRole: AuthPrincipal['role']): void {
  if (requiredRole === 'user') {
    return;
  }

  if (principal.role !== 'admin') {
    throw new AuthContextError('Admin role required');
  }
}
