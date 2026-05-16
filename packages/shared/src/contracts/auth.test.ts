import assert from 'node:assert/strict';
import test from 'node:test';

import { AUTH_USER_ROLES } from './auth.js';

test('auth contract exposes the shared user role surface', () => {
  assert.deepEqual(AUTH_USER_ROLES, ['user', 'admin']);
});
