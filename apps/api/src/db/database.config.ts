import { resolve } from 'node:path';

import { resolveWorkspaceRoot } from './workspace.js';

export interface DatabaseRuntimeConfig {
  databaseUrl: string;
  migrationsDir: string;
  schemaMigrationsTable: string;
}

function requireValue(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function normalizeSqlIdentifier(value: string, name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(value)) {
    throw new Error(`${name} must be a valid SQL identifier`);
  }

  return value;
}

export function readDatabaseRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): DatabaseRuntimeConfig {
  const workspaceRoot = resolveWorkspaceRoot(cwd);

  return {
    databaseUrl: requireValue(env.DATABASE_URL, 'DATABASE_URL'),
    migrationsDir: resolve(workspaceRoot, 'infra/migrations'),
    schemaMigrationsTable: normalizeSqlIdentifier(
      env.SCHEMA_MIGRATIONS_TABLE ?? 'schema_migrations',
      'SCHEMA_MIGRATIONS_TABLE',
    ),
  };
}
