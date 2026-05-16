import { ADMIN_SESSION_STORAGE_KEY } from '../config.js';

export function createSessionStore(storage, storageKey = ADMIN_SESSION_STORAGE_KEY) {
  function read() {
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) {
        return null;
      }

      return JSON.parse(raw);
    } catch {
      storage.removeItem(storageKey);
      return null;
    }
  }

  function write(session) {
    storage.setItem(storageKey, JSON.stringify(session));
  }

  function clear() {
    storage.removeItem(storageKey);
  }

  return {
    read,
    write,
    clear,
  };
}
