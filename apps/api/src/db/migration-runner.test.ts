import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { discoverMigrationFiles } from './migration-runner.js';
import { readDatabaseRuntimeConfig } from './database.config.js';

test('discoverMigrationFiles sorts SQL files and hashes content', async () => {
  const root = mkdtempSync(join(tmpdir(), 'clone-fanos-migrations-'));
  const migrationsDir = join(root, 'infra/migrations');
  mkdirSync(migrationsDir, { recursive: true });

  writeFileSync(join(migrationsDir, '0002_second.sql'), 'select 2;');
  writeFileSync(join(migrationsDir, '0001_first.sql'), 'select 1;');
  writeFileSync(join(migrationsDir, 'README.txt'), 'ignore me');

  const migrations = await discoverMigrationFiles(migrationsDir);

  assert.equal(migrations.length, 2);
  assert.equal(migrations[0]?.filename, '0001_first.sql');
  assert.equal(migrations[1]?.filename, '0002_second.sql');
  assert.notEqual(migrations[0]?.checksum, migrations[1]?.checksum);
});

test('readDatabaseRuntimeConfig resolves migrations dir from workspace root', () => {
  const root = mkdtempSync(join(tmpdir(), 'clone-fanos-workspace-'));
  mkdirSync(join(root, 'apps/api'), { recursive: true });
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "apps/*"\n  - "packages/*"\n');

  const config = readDatabaseRuntimeConfig(
    {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/clone_fanos',
    },
    join(root, 'apps/api'),
  );

  assert.equal(config.migrationsDir, join(root, 'infra/migrations'));
  assert.equal(config.schemaMigrationsTable, 'schema_migrations');
});

