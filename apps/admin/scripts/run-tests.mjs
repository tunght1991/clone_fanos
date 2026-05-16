import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

async function collectTests(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTests(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
const rootDir = resolve(scriptDir, '..');
const testDir = join(rootDir, 'test');
const files = await collectTests(testDir);

if (files.length === 0) {
  console.error('No test files found.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
