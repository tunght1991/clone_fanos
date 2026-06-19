import type { DatabaseConnection, DatabaseExecutor } from '../../db/postgres.js';
import type { PlaybackProgressRow } from './playback.types.js';

export interface PlaybackProgressRepository {
  findByUserAndAudiobookId(userId: string, audiobookId: string): Promise<PlaybackProgressRow | null>;
  listRecentByUser(userId: string, limit: number): Promise<RecentPlaybackSummaryRow[]>;
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

  async listRecentByUser(userId: string, limit: number): Promise<RecentPlaybackSummaryRow[]> {
    const result = await this.database.query<RecentPlaybackSummaryRow>(
      `SELECT
        user_progress.audiobook_id AS "audiobookId",
        audiobooks.title AS "audiobookTitle",
        audiobooks.cover_image_asset_key AS "audiobookCoverImageAssetKey",
        authors.name AS "authorName",
        user_progress.chapter_id AS "chapterId",
        chapters.title AS "chapterTitle",
        user_progress.position_ms AS "positionMs",
        (chapters.duration_sec * 1000)::integer AS "totalDurationMs",
        user_progress.completed,
        user_progress.last_played_at AS "lastPlayedAt",
        audiobooks.premium_flag AS "premiumFlag"
       FROM user_progress
       INNER JOIN audiobooks ON audiobooks.id = user_progress.audiobook_id
       INNER JOIN authors ON authors.id = audiobooks.author_id
       INNER JOIN chapters ON chapters.id = user_progress.chapter_id
       WHERE user_progress.user_id = $1
       ORDER BY user_progress.last_played_at DESC NULLS LAST, user_progress.updated_at DESC
       LIMIT $2`,
      [userId, limit],
    );

    return result.rows;
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

export interface RecentPlaybackSummaryRow {
  audiobookId: string;
  audiobookTitle: string;
  audiobookCoverImageAssetKey: string | null;
  authorName: string;
  chapterId: string;
  chapterTitle: string;
  positionMs: number;
  totalDurationMs: number;
  completed: boolean;
  lastPlayedAt: Date;
  premiumFlag: boolean;
}
