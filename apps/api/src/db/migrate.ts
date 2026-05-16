import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

import { loadAndValidateApiEnvironment } from '../config/index.js';
import { readDatabaseRuntimeConfig } from './database.config.js';
import { MigrationRunner } from './migration-runner.js';
import { PostgresDatabase } from './postgres.js';

export async function runDatabaseMigrations(): Promise<void> {
  const env = loadAndValidateApiEnvironment();
  const databaseConfig = readDatabaseRuntimeConfig(env);
  const database = new PostgresDatabase(databaseConfig);
  const runner = new MigrationRunner(database, databaseConfig);

  try {
    const result = await runner.migrate();
    console.log(
      JSON.stringify(
        {
          applied: result.applied,
          skipped: result.skipped,
        },
        null,
        2,
      ),
    );
  } finally {
    await database.close();
  }
}

const cliEntryUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;

if (cliEntryUrl && import.meta.url === cliEntryUrl) {
  runDatabaseMigrations().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
