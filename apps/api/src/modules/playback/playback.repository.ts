import type { DatabaseConnection, DatabaseExecutor } from '../../db/postgres.js';
import type { PlaybackProgressRow } from './playback.types.js';

export interface PlaybackProgressRepository {
  findByUserAndAudiobookId(userId: string, audiobookId: string): Promise<PlaybackProgressRow | null>;
  upsertProgress(input: {
    userId: string;
    audiobookId: string;
    chapterId: string;
    positionMs: number;
    completed: boolean;
    lastPlayedAt: Date;
  }): Promise<PlaybackProgressRow>;
}

export interface PlaybackRepositoryBundle {
  progressRepository: PlaybackProgressRepository;
}

export function createPlaybackRepositoryBundle(database: DatabaseConnection): PlaybackRepositoryBundle {
  return {
    progressRepository: new PostgresPlaybackProgressRepository(database),
  };
}

export class PostgresPlaybackProgressRepository implements PlaybackProgressRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async findByUserAndAudiobookId(userId: string, audiobookId: string): Promise<PlaybackProgressRow | null> {
    const result = await this.database.query<PlaybackProgressRow>(
      `SELECT
        id,
        user_id AS "userId",
        audiobook_id AS "audiobookId",
        chapter_id AS "chapterId",
        position_ms AS "positionMs",
        completed,
        last_played_at AS "lastPlayedAt",
        updated_at AS "updatedAt"
       FROM user_progress
       WHERE user_id = $1 AND audiobook_id = $2
       LIMIT 1`,
      [userId, audiobookId],
    );

    return result.rows[0] ?? null;
  }

  async upsertProgress(input: {
    userId: string;
    audiobookId: string;
    chapterId: string;
    positionMs: number;
    completed: boolean;
    lastPlayedAt: Date;
  }): Promise<PlaybackProgressRow> {
    const result = await this.database.query<PlaybackProgressRow>(
      `INSERT INTO user_progress (
        user_id,
        audiobook_id,
        chapter_id,
        position_ms,
        completed,
        last_played_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, now())
      ON CONFLICT (user_id, audiobook_id)
      DO UPDATE SET
        chapter_id = EXCLUDED.chapter_id,
        position_ms = EXCLUDED.position_ms,
        completed = EXCLUDED.completed,
        last_played_at = EXCLUDED.last_played_at,
        updated_at = now()
      RETURNING
        id,
        user_id AS "userId",
        audiobook_id AS "audiobookId",
        chapter_id AS "chapterId",
        position_ms AS "positionMs",
        completed,
        last_played_at AS "lastPlayedAt",
        updated_at AS "updatedAt"`,
      [
        input.userId,
        input.audiobookId,
        input.chapterId,
        input.positionMs,
        input.completed,
        input.lastPlayedAt,
      ],
    );

    return result.rows[0] as PlaybackProgressRow;
  }
}

