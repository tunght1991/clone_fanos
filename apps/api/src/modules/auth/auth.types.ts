import type { AuthUserRole } from '../../../../../packages/shared/src/contracts/auth.js';
import type { RuntimeEnvironment } from '../../config/runtime-env.js';

export type { AuthUserRole };

export interface AuthUserRow {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarAssetKey: string | null;
  role: AuthUserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSessionClaims {
  sub: string;
  email: string;
  displayName: string;
  role: AuthUserRole;
  iss: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface AuthSessionRow {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSessionRecord {
  session: AuthSessionRow;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface AuthPrincipal {
  userId: string;
  email: string;
  displayName: string;
  role: AuthUserRole;
}

export interface AuthRuntimeConfig {
  environment: RuntimeEnvironment;
  tokenSecret: string;
  tokenTtlSeconds: number;
}

export interface AuthPolicy {
  environment: RuntimeEnvironment;
  tokenTtlSeconds: number;
}
