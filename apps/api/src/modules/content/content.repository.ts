import type { DatabaseConnection, DatabaseExecutor } from '../../db/postgres.js';
import type { AudiobookNarratorRow, AudiobookRow, ChapterRow, ContentStatus } from './content.types.js';

export interface PageOptions {
  limit: number;
  offset: number;
}

export interface AudiobookListItem {
  id: string;
  title: string;
  description: string | null;
  coverImageAssetKey: string | null;
  authorId: string;
  authorName: string;
  durationSec: number;
  status: ContentStatus;
  premiumFlag: boolean;
  languageCode: string;
  publishedAt: Date | null;
}

export interface AudiobookDetail extends AudiobookListItem {
  chapters: ChapterRow[];
  narrators: AudiobookNarratorRow[];
}

export interface AuthorRow {
  id: string;
  name: string;
}

export interface AudiobookRepository {
  findById(id: string): Promise<AudiobookRow | null>;
  findPublishedById(id: string): Promise<AudiobookRow | null>;
  listPublished(page: PageOptions): Promise<AudiobookListItem[]>;
  countPublished(): Promise<number>;
  createAudiobook(input: {
    title: string;
    description: string | null;
    coverImageAssetKey: string | null;
    authorId: string;
    durationSec: number;
    premiumFlag: boolean;
    languageCode: string;
  }): Promise<AudiobookRow>;
  updateAudiobook(input: {
    id: string;
    title: string;
    description: string | null;
    coverImageAssetKey: string | null;
    authorId: string;
    durationSec: number;
    premiumFlag: boolean;
    languageCode: string;
  }): Promise<AudiobookRow>;
  publishAudiobook(id: string): Promise<AudiobookRow>;
  unpublishAudiobook(id: string): Promise<AudiobookRow>;
}

export interface ChapterRepository {
  findByAudiobookId(audiobookId: string): Promise<ChapterRow[]>;
  findById(id: string): Promise<ChapterRow | null>;
  createChapter(input: {
    audiobookId: string;
    title: string;
    orderIndex: number;
    durationSec: number;
    audioAssetKey: string;
    transcript: string | null;
  }): Promise<ChapterRow>;
  updateChapter(input: {
    id: string;
    title: string;
    orderIndex: number;
    durationSec: number;
    audioAssetKey: string;
    transcript: string | null;
  }): Promise<ChapterRow>;
  publishChapter(id: string): Promise<ChapterRow>;
  unpublishChapter(id: string): Promise<ChapterRow>;
}

export interface AudiobookNarratorRepository {
  findByAudiobookId(audiobookId: string): Promise<AudiobookNarratorRow[]>;
  findDetailedByAudiobookId(audiobookId: string): Promise<Array<AudiobookNarratorRow & { narratorName: string }>>;
}

export interface AuthorRepository {
  findById(id: string): Promise<AuthorRow | null>;
}

export interface ContentRepositoryBundle {
  audiobookRepository: AudiobookRepository;
  chapterRepository: ChapterRepository;
  audiobookNarratorRepository: AudiobookNarratorRepository;
  authorRepository: AuthorRepository;
}

export function createContentRepositoryBundle(
  database: DatabaseConnection,
): ContentRepositoryBundle {
  return {
    audiobookRepository: new PostgresAudiobookRepository(database),
    chapterRepository: new PostgresChapterRepository(database),
    audiobookNarratorRepository: new PostgresAudiobookNarratorRepository(database),
    authorRepository: new PostgresAuthorRepository(database),
  };
}

export class PostgresAudiobookRepository implements AudiobookRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async findById(id: string): Promise<AudiobookRow | null> {
    const result = await this.database.query<AudiobookRow>(
      `SELECT
        id,
        title,
        description,
        cover_image_asset_key AS "coverImageAssetKey",
        author_id AS "authorId",
        duration_sec AS "durationSec",
        status,
        premium_flag AS "premiumFlag",
        language_code AS "languageCode",
        published_at AS "publishedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM audiobooks
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async findPublishedById(id: string): Promise<AudiobookRow | null> {
    const result = await this.database.query<AudiobookRow>(
      `SELECT
        id,
        title,
        description,
        cover_image_asset_key AS "coverImageAssetKey",
        author_id AS "authorId",
        duration_sec AS "durationSec",
        status,
        premium_flag AS "premiumFlag",
        language_code AS "languageCode",
        published_at AS "publishedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM audiobooks
       WHERE id = $1 AND status = 'published'`,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async listPublished(page: PageOptions): Promise<AudiobookListItem[]> {
    const result = await this.database.query<AudiobookListItem>(
      `SELECT
        id,
        title,
        description,
        cover_image_asset_key AS "coverImageAssetKey",
        author_id AS "authorId",
        authors.name AS "authorName",
        duration_sec AS "durationSec",
        status,
        premium_flag AS "premiumFlag",
        language_code AS "languageCode",
        published_at AS "publishedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM audiobooks
       INNER JOIN authors ON authors.id = audiobooks.author_id
       WHERE status = 'published'
       ORDER BY published_at DESC NULLS LAST, created_at DESC
       LIMIT $1 OFFSET $2`,
      [page.limit, page.offset],
    );

    return result.rows;
  }

  async countPublished(): Promise<number> {
    const result = await this.database.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM audiobooks
       WHERE status = 'published'`,
    );

    return Number(result.rows[0]?.count ?? 0);
  }

  async createAudiobook(input: {
    title: string;
    description: string | null;
    coverImageAssetKey: string | null;
    authorId: string;
    durationSec: number;
    premiumFlag: boolean;
    languageCode: string;
  }): Promise<AudiobookRow> {
    const result = await this.database.query<AudiobookRow>(
      `INSERT INTO audiobooks (
        title,
        description,
        cover_image_asset_key,
        author_id,
        duration_sec,
        premium_flag,
        language_code,
        status,
        published_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', NULL, now())
      RETURNING
        id,
        title,
        description,
        cover_image_asset_key AS "coverImageAssetKey",
        author_id AS "authorId",
        duration_sec AS "durationSec",
        status,
        premium_flag AS "premiumFlag",
        language_code AS "languageCode",
        published_at AS "publishedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        input.title,
        input.description,
        input.coverImageAssetKey,
        input.authorId,
        input.durationSec,
        input.premiumFlag,
        input.languageCode,
      ],
    );

    return result.rows[0] as AudiobookRow;
  }

  async updateAudiobook(input: {
    id: string;
    title: string;
    description: string | null;
    coverImageAssetKey: string | null;
    authorId: string;
    durationSec: number;
    premiumFlag: boolean;
    languageCode: string;
  }): Promise<AudiobookRow> {
    const result = await this.database.query<AudiobookRow>(
      `UPDATE audiobooks
       SET
        title = $2,
        description = $3,
        cover_image_asset_key = $4,
        author_id = $5,
        duration_sec = $6,
        premium_flag = $7,
        language_code = $8,
        updated_at = now()
       WHERE id = $1
       RETURNING
        id,
        title,
        description,
        cover_image_asset_key AS "coverImageAssetKey",
        author_id AS "authorId",
        duration_sec AS "durationSec",
        status,
        premium_flag AS "premiumFlag",
        language_code AS "languageCode",
        published_at AS "publishedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        input.id,
        input.title,
        input.description,
        input.coverImageAssetKey,
        input.authorId,
        input.durationSec,
        input.premiumFlag,
        input.languageCode,
      ],
    );

    return result.rows[0] as AudiobookRow;
  }

  async publishAudiobook(id: string): Promise<AudiobookRow> {
    const result = await this.database.query<AudiobookRow>(
      `UPDATE audiobooks
       SET
        status = 'published',
        published_at = COALESCE(published_at, now()),
        updated_at = now()
       WHERE id = $1
       RETURNING
        id,
        title,
        description,
        cover_image_asset_key AS "coverImageAssetKey",
        author_id AS "authorId",
        duration_sec AS "durationSec",
        status,
        premium_flag AS "premiumFlag",
        language_code AS "languageCode",
        published_at AS "publishedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [id],
    );

    return result.rows[0] as AudiobookRow;
  }

  async unpublishAudiobook(id: string): Promise<AudiobookRow> {
    const result = await this.database.query<AudiobookRow>(
      `UPDATE audiobooks
       SET
        status = 'unpublished',
        updated_at = now()
       WHERE id = $1
       RETURNING
        id,
        title,
        description,
        cover_image_asset_key AS "coverImageAssetKey",
        author_id AS "authorId",
        duration_sec AS "durationSec",
        status,
        premium_flag AS "premiumFlag",
        language_code AS "languageCode",
        published_at AS "publishedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [id],
    );

    return result.rows[0] as AudiobookRow;
  }
}

export class PostgresChapterRepository implements ChapterRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async findByAudiobookId(audiobookId: string): Promise<ChapterRow[]> {
    const result = await this.database.query<ChapterRow>(
      `SELECT
        id,
        audiobook_id AS "audiobookId",
        title,
        order_index AS "orderIndex",
        duration_sec AS "durationSec",
        audio_asset_key AS "audioAssetKey",
        transcript,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM chapters
       WHERE audiobook_id = $1
       ORDER BY order_index ASC`,
      [audiobookId],
    );

    return result.rows;
  }

  async findById(id: string): Promise<ChapterRow | null> {
    const result = await this.database.query<ChapterRow>(
      `SELECT
        id,
        audiobook_id AS "audiobookId",
        title,
        order_index AS "orderIndex",
        duration_sec AS "durationSec",
        audio_asset_key AS "audioAssetKey",
        transcript,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM chapters
       WHERE id = $1
       LIMIT 1`,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async createChapter(input: {
    audiobookId: string;
    title: string;
    orderIndex: number;
    durationSec: number;
    audioAssetKey: string;
    transcript: string | null;
  }): Promise<ChapterRow> {
    const result = await this.database.query<ChapterRow>(
      `INSERT INTO chapters (
        audiobook_id,
        title,
        order_index,
        duration_sec,
        audio_asset_key,
        transcript,
        status,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', now())
      RETURNING
        id,
        audiobook_id AS "audiobookId",
        title,
        order_index AS "orderIndex",
        duration_sec AS "durationSec",
        audio_asset_key AS "audioAssetKey",
        transcript,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        input.audiobookId,
        input.title,
        input.orderIndex,
        input.durationSec,
        input.audioAssetKey,
        input.transcript,
      ],
    );

    return result.rows[0] as ChapterRow;
  }

  async updateChapter(input: {
    id: string;
    title: string;
    orderIndex: number;
    durationSec: number;
    audioAssetKey: string;
    transcript: string | null;
  }): Promise<ChapterRow> {
    const result = await this.database.query<ChapterRow>(
      `UPDATE chapters
       SET
        title = $2,
        order_index = $3,
        duration_sec = $4,
        audio_asset_key = $5,
        transcript = $6,
        updated_at = now()
       WHERE id = $1
       RETURNING
        id,
        audiobook_id AS "audiobookId",
        title,
        order_index AS "orderIndex",
        duration_sec AS "durationSec",
        audio_asset_key AS "audioAssetKey",
        transcript,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        input.id,
        input.title,
        input.orderIndex,
        input.durationSec,
        input.audioAssetKey,
        input.transcript,
      ],
    );

    return result.rows[0] as ChapterRow;
  }

  async publishChapter(id: string): Promise<ChapterRow> {
    const result = await this.database.query<ChapterRow>(
      `UPDATE chapters
       SET
        status = 'published',
        updated_at = now()
       WHERE id = $1
       RETURNING
        id,
        audiobook_id AS "audiobookId",
        title,
        order_index AS "orderIndex",
        duration_sec AS "durationSec",
        audio_asset_key AS "audioAssetKey",
        transcript,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [id],
    );

    return result.rows[0] as ChapterRow;
  }

  async unpublishChapter(id: string): Promise<ChapterRow> {
    const result = await this.database.query<ChapterRow>(
      `UPDATE chapters
       SET
        status = 'draft',
        updated_at = now()
       WHERE id = $1
       RETURNING
        id,
        audiobook_id AS "audiobookId",
        title,
        order_index AS "orderIndex",
        duration_sec AS "durationSec",
        audio_asset_key AS "audioAssetKey",
        transcript,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [id],
    );

    return result.rows[0] as ChapterRow;
  }
}

export class PostgresAudiobookNarratorRepository implements AudiobookNarratorRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async findByAudiobookId(audiobookId: string): Promise<AudiobookNarratorRow[]> {
    const result = await this.database.query<AudiobookNarratorRow>(
      `SELECT
        id,
        audiobook_id AS "audiobookId",
        narrator_id AS "narratorId",
        role_index AS "roleIndex",
        is_primary AS "isPrimary",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM audiobook_narrators
       WHERE audiobook_id = $1
       ORDER BY role_index ASC`,
      [audiobookId],
    );

    return result.rows;
  }

  async findDetailedByAudiobookId(
    audiobookId: string,
  ): Promise<Array<AudiobookNarratorRow & { narratorName: string }>> {
    const result = await this.database.query<AudiobookNarratorRow & { narratorName: string }>(
      `SELECT
        audiobook_narrators.id,
        audiobook_narrators.audiobook_id AS "audiobookId",
        audiobook_narrators.narrator_id AS "narratorId",
        narrators.name AS "narratorName",
        audiobook_narrators.role_index AS "roleIndex",
        audiobook_narrators.is_primary AS "isPrimary",
        audiobook_narrators.created_at AS "createdAt",
        audiobook_narrators.updated_at AS "updatedAt"
       FROM audiobook_narrators
       INNER JOIN narrators ON narrators.id = audiobook_narrators.narrator_id
       WHERE audiobook_narrators.audiobook_id = $1
       ORDER BY audiobook_narrators.role_index ASC`,
      [audiobookId],
    );

    return result.rows;
  }
}

export class PostgresAuthorRepository implements AuthorRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async findById(id: string): Promise<AuthorRow | null> {
    const result = await this.database.query<AuthorRow>(
      `SELECT
        id,
        name
       FROM authors
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] ?? null;
  }
}
