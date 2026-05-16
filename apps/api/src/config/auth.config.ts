import type { RuntimeEnvironment } from './runtime-env.js';

function requireString(value: string | undefined, name: string): string {
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`);
  }

  return value.trim();
}

function parsePositiveInteger(value: string | undefined, name: string, fallback: number): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

export interface AuthRuntimeConfig {
  environment: RuntimeEnvironment;
  tokenSecret: string;
  tokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}

export function readAuthRuntimeConfig(env: NodeJS.ProcessEnv): AuthRuntimeConfig {
  return {
    environment: env.NODE_ENV as RuntimeEnvironment,
    tokenSecret: requireString(env.AUTH_TOKEN_SECRET, 'AUTH_TOKEN_SECRET'),
    tokenTtlSeconds: parsePositiveInteger(env.AUTH_TOKEN_TTL_SECONDS, 'AUTH_TOKEN_TTL_SECONDS', 60 * 60 * 24 * 7),
    refreshTokenTtlSeconds: parsePositiveInteger(
      env.AUTH_REFRESH_TOKEN_TTL_SECONDS,
      'AUTH_REFRESH_TOKEN_TTL_SECONDS',
      60 * 60 * 24 * 30,
    ),
  };
}
