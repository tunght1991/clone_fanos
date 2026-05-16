import assert from 'node:assert/strict';
import test from 'node:test';

import { AuthService } from './auth.service.js';
import { AuthTokenService } from './auth-token.js';
import type { AuthRepositoryBundle } from './auth.repository.js';

function createRepositoryBundle(): AuthRepositoryBundle {
  const users = new Map<string, {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    avatarAssetKey: string | null;
    role: 'user' | 'admin';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>();
  const sessions = new Map<string, { hash: string; userId: string; expiresAt: Date; revoked: boolean }>();

  return {
    userRepository: {
      async findById(id: string) {
        return users.get(id) ?? null;
      },
      async findByEmail(email: string) {
        return Array.from(users.values()).find((user) => user.email === email) ?? null;
      },
      async createUser(input) {
        const user = {
          id: `user-${users.size + 1}`,
          email: input.email,
          passwordHash: input.passwordHash,
          displayName: input.displayName,
          avatarAssetKey: input.avatarAssetKey ?? null,
          role: input.role ?? 'user',
          isActive: input.isActive ?? true,
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
        users.set(user.id, user);
        return user;
      },
    },
    sessionRepository: {
      async createSession(input) {
        const session = {
          id: `session-${sessions.size + 1}`,
          userId: input.userId,
          hash: input.refreshTokenHash,
          expiresAt: input.expiresAt,
          revoked: false,
        };
        sessions.set(session.hash, session);
        return {
          id: session.id,
          userId: session.userId,
          refreshTokenHash: session.hash,
          expiresAt: session.expiresAt,
          revokedAt: null,
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async findActiveByRefreshTokenHash(refreshTokenHash: string) {
        const session = sessions.get(refreshTokenHash);
        if (!session || session.revoked || session.expiresAt <= new Date()) {
          return null;
        }

        return {
          id: session.id,
          userId: session.userId,
          refreshTokenHash: session.hash,
          expiresAt: session.expiresAt,
          revokedAt: null,
          createdAt: new Date('2026-05-11T00:00:00.000Z'),
          updatedAt: new Date('2026-05-11T00:00:00.000Z'),
        };
      },
      async revokeByRefreshTokenHash(refreshTokenHash: string) {
        const session = sessions.get(refreshTokenHash);
        if (!session || session.revoked) {
          return false;
        }

        session.revoked = true;
        return true;
      },
    },
  };
}

test('AuthService register creates a user and returns access + refresh session', async () => {
  const service = new AuthService({
    repositories: createRepositoryBundle(),
    tokenService: new AuthTokenService({
      issuer: 'clone-fanos-api',
      secret: 'test-secret',
      tokenTtlSeconds: 3600,
    }),
    refreshTokenTtlSeconds: 86400,
  });

  const session = await service.register({
    email: 'User@Example.com',
    password: 'secret123',
    displayName: 'User One',
  });

  assert.equal(session.tokenType, 'Bearer');
  assert.equal(session.user.email, 'user@example.com');
  assert.equal(session.user.role, 'user');
  assert.equal(session.accessToken.length > 0, true);
  assert.equal(session.refreshToken.startsWith('rft_'), true);
});

test('AuthService refresh rotates the refresh token and returns a new session', async () => {
  const repositories = createRepositoryBundle();
  const service = new AuthService({
    repositories,
    tokenService: new AuthTokenService({
      issuer: 'clone-fanos-api',
      secret: 'test-secret',
      tokenTtlSeconds: 3600,
    }),
    refreshTokenTtlSeconds: 86400,
  });

  const initial = await service.register({
    email: 'User@Example.com',
    password: 'secret123',
    displayName: 'User One',
  });

  const refreshed = await service.refresh({
    refreshToken: initial.refreshToken,
  });

  assert.notEqual(refreshed.accessToken, initial.accessToken);
  assert.notEqual(refreshed.refreshToken, initial.refreshToken);
});

test('AuthService logout revokes the refresh token session', async () => {
  const repositories = createRepositoryBundle();
  const service = new AuthService({
    repositories,
    tokenService: new AuthTokenService({
      issuer: 'clone-fanos-api',
      secret: 'test-secret',
      tokenTtlSeconds: 3600,
    }),
    refreshTokenTtlSeconds: 86400,
  });

  const initial = await service.register({
    email: 'User@Example.com',
    password: 'secret123',
    displayName: 'User One',
  });

  const result = await service.logout({
    refreshToken: initial.refreshToken,
  });

  assert.equal(result.revoked, true);
});

