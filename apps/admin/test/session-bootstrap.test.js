import assert from 'node:assert/strict';
import test from 'node:test';
import { bootstrapAdminSession } from '../src/auth/session-bootstrap.js';

function createMemoryStore(initialSession = null) {
  let session = initialSession;
  return {
    read() {
      return session;
    },
    write(nextSession) {
      session = nextSession;
    },
    clear() {
      session = null;
    },
    snapshot() {
      return session;
    },
  };
}

test('bootstrapAdminSession authenticates and persists a valid admin session', async () => {
  const store = createMemoryStore({
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
  });
  const authApi = {
    async getMe() {
      return { id: 'user-1', email: 'admin@clone-fanos.com' };
    },
    async getAdminMe() {
      return { id: 'admin-1', role: 'ADMIN' };
    },
    async refresh() {
      throw new Error('refresh should not be used');
    },
  };

  const result = await bootstrapAdminSession({ store, authApi });

  assert.equal(result.status, 'authenticated');
  assert.equal(store.snapshot().admin.role, 'ADMIN');
  assert.equal(store.snapshot().user.email, 'admin@clone-fanos.com');
});

test('bootstrapAdminSession refreshes an expired session and revalidates it', async () => {
  const store = createMemoryStore({
    accessToken: 'expired-access',
    refreshToken: 'refresh-1',
  });
  const authApi = {
    async getMe(accessToken) {
      if (accessToken === 'expired-access') {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
      }

      return { id: 'user-1', email: 'admin@clone-fanos.com' };
    },
    async getAdminMe(accessToken) {
      if (accessToken === 'expired-access') {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
      }

      return { id: 'admin-1', role: 'ADMIN' };
    },
    async refresh(refreshToken) {
      assert.equal(refreshToken, 'refresh-1');
      return {
        accessToken: 'fresh-access',
        refreshToken: 'fresh-refresh',
      };
    },
  };

  const result = await bootstrapAdminSession({ store, authApi });

  assert.equal(result.status, 'authenticated');
  assert.equal(store.snapshot().accessToken, 'fresh-access');
  assert.equal(store.snapshot().refreshToken, 'fresh-refresh');
});

test('bootstrapAdminSession clears the session when the user is forbidden', async () => {
  const store = createMemoryStore({
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
  });
  const authApi = {
    async getMe() {
      return { id: 'user-1', email: 'user@clone-fanos.com' };
    },
    async getAdminMe() {
      const error = new Error('Forbidden');
      error.status = 403;
      throw error;
    },
    async refresh() {
      throw new Error('refresh should not be used');
    },
  };

  const result = await bootstrapAdminSession({ store, authApi });

  assert.equal(result.status, 'forbidden');
  assert.equal(store.snapshot(), null);
});
