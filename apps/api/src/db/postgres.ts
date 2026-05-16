import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

import type { DatabaseRuntimeConfig } from './database.config.js';

export interface DatabaseExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

export interface DatabaseConnection extends DatabaseExecutor {
  withTransaction<T>(work: (client: DatabaseExecutor) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export class PostgresDatabase implements DatabaseConnection {
  private readonly pool: Pool;

  constructor(private readonly config: DatabaseRuntimeConfig) {
    this.pool = new Pool({
      connectionString: config.databaseUrl,
    });
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: readonly unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params as unknown[]);
  }

  async withTransaction<T>(work: (client: DatabaseExecutor) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await work(createClientAdapter(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

function createClientAdapter(client: PoolClient): DatabaseExecutor {
  return {
    query<T extends QueryResultRow = QueryResultRow>(
      text: string,
      params: readonly unknown[] = [],
    ): Promise<QueryResult<T>> {
      return client.query<T>(text, params as unknown[]);
    },
  };
}
