import assert from 'node:assert/strict';
import test from 'node:test';

import { extractBearerToken, requireRole, resolveRequestPrincipal } from './auth-context.js';

test('extractBearerToken parses bearer authorization header', () => {
  assert.equal(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(extractBearerToken('  bearer   token-value  '), 'token-value');
  assert.equal(extractBearerToken('Basic abc'), null);
});

test('resolveRequestPrincipal falls back to x-user-id when no bearer token is present', async () => {
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
