import assert from 'node:assert/strict';
import test from 'node:test';

import { hashPassword, verifyPassword } from './password-hash.js';

test('hashPassword and verifyPassword round-trip correctly', () => {
  const hash = hashPassword('super-secret');

  assert.equal(verifyPassword('super-secret', hash), true);
  assert.equal(verifyPassword('wrong-password', hash), false);
});

test('verifyPassword rejects malformed hashes', () => {
  assert.equal(verifyPassword('secret', 'not-a-valid-hash'), false);
});

