import type { DatabaseConnection, DatabaseExecutor } from '../../db/postgres.js';
import type { AnalyticsEventRow } from './analytics.types.js';

export interface AnalyticsRepository {
  recordEvent(input: {
    userId: string;
    eventName: string;
    payloadJson: Record<string, unknown>;
    sourcePlatform: 'ios' | 'android' | 'web';
    occurredAt: Date;
  }): Promise<AnalyticsEventRow>;
}

export interface AnalyticsRepositoryBundle {
  analyticsRepository: AnalyticsRepository;
}

export function createAnalyticsRepositoryBundle(database: DatabaseConnection): AnalyticsRepositoryBundle {
  return {
    analyticsRepository: new PostgresAnalyticsRepository(database),
  };
}

export class PostgresAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async recordEvent(input: {
    userId: string;
    eventName: string;
    payloadJson: Record<string, unknown>;
    sourcePlatform: 'ios' | 'android' | 'web';
    occurredAt: Date;
  }): Promise<AnalyticsEventRow> {
    const result = await this.database.query<AnalyticsEventRow>(
      `INSERT INTO analytics_events (
        user_id,
        event_name,
        payload_json,
        source_platform,
        created_at
      ) VALUES ($1, $2, $3::jsonb, $4, $5)
      RETURNING
        id,
        user_id AS "userId",
        event_name AS "eventName",
        payload_json AS "payloadJson",
        source_platform AS "sourcePlatform",
        created_at AS "createdAt"`,
      [input.userId, input.eventName, JSON.stringify(input.payloadJson ?? {}), input.sourcePlatform, input.occurredAt],
    );

    return result.rows[0] as AnalyticsEventRow;
  }
}

