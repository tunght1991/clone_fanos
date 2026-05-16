import assert from 'node:assert/strict';
import test from 'node:test';

import { hasRequiredRole } from './auth.policy.js';

test('hasRequiredRole allows user access for user routes', () => {
  assert.equal(hasRequiredRole('user', 'user'), true);
  assert.equal(hasRequiredRole('admin', 'user'), true);
});

test('hasRequiredRole requires admin role for admin routes', () => {
  assert.equal(hasRequiredRole('user', 'admin'), false);
  assert.equal(hasRequiredRole('admin', 'admin'), true);
});

