import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveRouteAccess } from '../src/auth/access-control.js';

test('resolveRouteAccess redirects unauthenticated users to login', () => {
  const decision = resolveRouteAccess('/dashboard', { status: 'unauthenticated' });

  assert.equal(decision.route, '/login');
  assert.equal(decision.redirectTo, '/login');
  assert.equal(decision.requiresAdmin, false);
});

test('resolveRouteAccess keeps authenticated admins on protected routes', () => {
  const decision = resolveRouteAccess('/dashboard', {
    status: 'authenticated',
    session: { user: { id: 'user-1' } },
  });

  assert.equal(decision.route, '/dashboard');
  assert.equal(decision.redirectTo, null);
  assert.equal(decision.requiresAdmin, true);
});

test('resolveRouteAccess allows public routes regardless of session state', () => {
  const decision = resolveRouteAccess('/login', {
    status: 'unauthenticated',
  });

  assert.equal(decision.route, '/login');
  assert.equal(decision.view, 'login');
  assert.equal(decision.requiresAdmin, false);
});
