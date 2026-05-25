import assert from 'node:assert/strict';
import test from 'node:test';

import { extractBearerToken, requireRole, resolveRequestPrincipal } from './auth-context.js';

test('extractBearerToken parses bearer authorization header', () => {
  assert.equal(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(extractBearerToken('  bearer   token-value  '), 'token-value');
  assert.equal(extractBearerToken('Basic abc'), null);
});

test('resolveRequestPrincipal falls back to x-user-id when no bearer token is present', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  try {
    const principal = await resolveRequestPrincipal(
      {
        async resolvePrincipalFromToken() {
          return null;
        },
      } as never,
      undefined,
      'user-123',
    );

    assert.equal(principal.userId, 'user-123');
    assert.equal(principal.role, 'user');
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
});

test('resolveRequestPrincipal rejects x-user-id fallback in production', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    await assert.rejects(
      () =>
        resolveRequestPrincipal(
          {
            async resolvePrincipalFromToken() {
              return null;
            },
          } as never,
          undefined,
          'user-123',
        ),
      /Missing authorization/,
    );
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
});

test('requireRole rejects non-admin principals for admin routes', () => {
  assert.throws(() =>
    requireRole(
      {
        userId: 'user-1',
        email: 'user@example.com',
        displayName: 'User One',
        role: 'user',
      },
      'admin',
    ),
  );
});
