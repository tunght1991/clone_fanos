import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionStore } from '../src/auth/session-store.js';

function createMemoryStorage(initial = {}) {
  const state = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return state.has(key) ? state.get(key) : null;
    },
    setItem(key, value) {
      state.set(key, String(value));
    },
    removeItem(key) {
      state.delete(key);
    },
    dump() {
      return Object.fromEntries(state.entries());
    },
  };
}

test('createSessionStore reads and writes the admin session payload', () => {
  const storage = createMemoryStorage();
  const store = createSessionStore(storage, 'session-key');
  const session = {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    user: { id: 'user-1' },
  };

  store.write(session);

  assert.deepEqual(store.read(), session);
});

test('createSessionStore clears corrupted JSON and returns null', () => {
  const storage = createMemoryStorage({
    'session-key': '{invalid-json',
  });
  const store = createSessionStore(storage, 'session-key');

  assert.equal(store.read(), null);
  assert.deepEqual(storage.dump(), {});
});
