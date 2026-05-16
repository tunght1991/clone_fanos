import type { ApiRuntime } from '../main.js';

export interface ClosableApp {
  close(): Promise<void>;
}

export function createGracefulShutdownHandler(
  app: ClosableApp,
  runtime: ApiRuntime,
): () => Promise<void> {
  let shuttingDown = false;

  return async () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    try {
      await app.close();
    } finally {
      await runtime.database.close();
    }
  };
}
