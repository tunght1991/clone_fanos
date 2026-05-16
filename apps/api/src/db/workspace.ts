import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function resolveWorkspaceRoot(startDir: string = process.cwd()): string {
  let currentDir = resolve(startDir);

  while (true) {
    if (existsSync(resolve(currentDir, 'pnpm-workspace.yaml'))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return resolve(startDir);
    }

    currentDir = parentDir;
  }
}

