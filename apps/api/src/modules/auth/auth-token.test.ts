import assert from 'node:assert/strict';
import test from 'node:test';

import { AuthTokenService } from './auth-token.js';

test('AuthTokenService issues and verifies a signed bearer token', () => {
  const service = new AuthTokenService({
    issuer: 'clone-fanos-api',
    secret: 'test-secret',
    tokenTtlSeconds: 3600,
  });

  const issued = service.issueToken({
    userId: 'user-1',
    email: 'user@example.com',
    displayName: 'User One',
    role: 'user',
  });

  const claims = service.verifyToken(issued.token);

  assert.ok(claims);
  assert.equal(claims?.sub, 'user-1');
  assert.equal(claims?.email, 'user@example.com');
  assert.equal(claims?.role, 'user');
});

test('AuthTokenService rejects tampered tokens', () => {
  const service = new AuthTokenService({
    issuer: 'clone-fanos-api',
    secret: 'test-secret',
    tokenTtlSeconds: 3600,
  });

  const issued = service.issueToken({
    userId: 'user-1',
    email: 'user@example.com',
    displayName: 'User One',
    role: 'user',
  });

  const [header, payload, signature] = issued.token.split('.');
  const alteredSignaturePrefix = signature.startsWith('a') ? 'b' : 'a';
  const tampered = [header, payload, `${alteredSignaturePrefix}${signature.slice(1)}`].join('.');

  assert.equal(service.verifyToken(tampered), null);
});
