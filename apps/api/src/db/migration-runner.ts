import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import type { DatabaseConnection } from './postgres.js';
import type { DatabaseRuntimeConfig } from './database.config.js';

export interface MigrationFile {
  filename: string;
  checksum: string;
  sql: string;
}

export interface MigrationRunResult {
  applied: string[];
  skipped: string[];
}

export async function discoverMigrationFiles(migrationsDir: string): Promise<MigrationFile[]> {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === '.sql')
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const migrations: MigrationFile[] = [];
  for (const filename of files) {
    const sql = await readFile(join(migrationsDir, filename), 'utf8');
    migrations.push({
      filename,
      checksum: createHash('sha256').update(sql).digest('hex'),
      sql,
    });
  }

  return migrations;
}

export class MigrationRunner {
  constructor(
    private readonly database: DatabaseConnection,
    private readonly config: DatabaseRuntimeConfig,
  ) {}

  async migrate(): Promise<MigrationRunResult> {
    await this.ensureSchemaMigrationsTable();
    const appliedMigrations = await this.readAppliedMigrations();
    const availableMigrations = await discoverMigrationFiles(this.config.migrationsDir);

    const applied: string[] = [];
    const skipped: string[] = [];

    for (const migration of availableMigrations) {
      const appliedChecksum = appliedMigrations.get(migration.filename);

      if (appliedChecksum) {
        if (appliedChecksum !== migration.checksum) {
          throw new Error(`Migration checksum mismatch for ${migration.filename}`);
        }

        skipped.push(migration.filename);
        continue;
      }

      await this.database.withTransaction(async (client) => {
        await client.query(migration.sql);
        await client.query(
          `INSERT INTO ${this.config.schemaMigrationsTable} (filename, checksum, applied_at)
           VALUES ($1, $2, now())`,
          [migration.filename, migration.checksum],
        );
      });

      applied.push(migration.filename);
    }

    return { applied, skipped };
  }

  private async ensureSchemaMigrationsTable(): Promise<void> {
    await this.database.query(
      `CREATE TABLE IF NOT EXISTS ${this.config.schemaMigrationsTable} (
        filename text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`,
    );
  }

  private async readAppliedMigrations(): Promise<Map<string, string>> {
    const result = await this.database.query<{ filename: string; checksum: string }>(
      `SELECT filename, checksum FROM ${this.config.schemaMigrationsTable} ORDER BY filename ASC`,
    );

    return new Map(result.rows.map((row) => [row.filename, row.checksum]));
  }
}

