import type { DatabaseConnection, DatabaseExecutor } from '../../db/postgres.js';
import type { BookmarkSummaryRow, EngagementListQuery, FavoriteSummaryRow, NoteSummaryRow } from './engagement.types.js';

export interface BookmarkRepository {
  findByUserAndId(userId: string, bookmarkId: string): Promise<BookmarkSummaryRow | null>;
  listBookmarks(userId: string, query: EngagementListQuery): Promise<{ data: BookmarkSummaryRow[]; totalItems: number }>;
  createBookmark(input: {
    userId: string;
    audiobookId: string;
    chapterId: string;
    positionMs: number;
    note: string | null;
  }): Promise<BookmarkSummaryRow>;
  deleteBookmark(userId: string, bookmarkId: string): Promise<boolean>;
}

export interface FavoriteRepository {
  findByUserAndAudiobookId(userId: string, audiobookId: string): Promise<FavoriteSummaryRow | null>;
  listFavorites(
    userId: string,
    query: EngagementListQuery,
  ): Promise<{ data: FavoriteSummaryRow[]; totalItems: number }>;
  upsertFavorite(input: { userId: string; audiobookId: string }): Promise<FavoriteSummaryRow>;
  deleteFavorite(userId: string, audiobookId: string): Promise<boolean>;
}

export interface NoteRepository {
  findByUserAndId(userId: string, noteId: string): Promise<NoteSummaryRow | null>;
  listNotes(userId: string, query: EngagementListQuery): Promise<{ data: NoteSummaryRow[]; totalItems: number }>;
  createNote(input: {
    userId: string;
    audiobookId: string;
    chapterId: string;
    positionMs: number;
    content: string;
  }): Promise<NoteSummaryRow>;
  updateNote(
    userId: string,
    noteId: string,
    input: { content: string },
  ): Promise<NoteSummaryRow | null>;
  deleteNote(userId: string, noteId: string): Promise<boolean>;
}

export interface EngagementRepositoryBundle {
  bookmarkRepository: BookmarkRepository;
  favoriteRepository: FavoriteRepository;
  noteRepository: NoteRepository;
}

export function createEngagementRepositoryBundle(database: DatabaseConnection): EngagementRepositoryBundle {
  return {
    bookmarkRepository: new PostgresBookmarkRepository(database),
    favoriteRepository: new PostgresFavoriteRepository(database),
    noteRepository: new PostgresNoteRepository(database),
  };
}

export class PostgresBookmarkRepository implements BookmarkRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async findByUserAndId(userId: string, bookmarkId: string): Promise<BookmarkSummaryRow | null> {
    const result = await this.database.query<BookmarkSummaryRow>(
      `
      SELECT
        bookmarks.id,
        bookmarks.audiobook_id AS "audiobookId",
        audiobooks.title AS "audiobookTitle",
        audiobooks.cover_image_asset_key AS "audiobookCoverImageAssetKey",
        authors.name AS "authorName",
        bookmarks.chapter_id AS "chapterId",
        chapters.title AS "chapterTitle",
        bookmarks.position_ms AS "positionMs",
        bookmarks.note,
        bookmarks.created_at AS "createdAt"
      FROM bookmarks
      INNER JOIN audiobooks ON audiobooks.id = bookmarks.audiobook_id
      INNER JOIN authors ON authors.id = audiobooks.author_id
      INNER JOIN chapters ON chapters.id = bookmarks.chapter_id
      WHERE bookmarks.user_id = $1 AND bookmarks.id = $2
      LIMIT 1`,
      [userId, bookmarkId],
    );

    return result.rows[0] ?? null;
  }

  async listBookmarks(userId: string, query: EngagementListQuery): Promise<{ data: BookmarkSummaryRow[]; totalItems: number }> {
    const filter = buildUserFilter('bookmarks', userId, query.audiobookId);
    const limitParam = filter.nextParamIndex;
    const offsetParam = filter.nextParamIndex + 1;
    const dataResult = await this.database.query<BookmarkSummaryRow>(
      `
      SELECT
        bookmarks.id,
        bookmarks.audiobook_id AS "audiobookId",
        audiobooks.title AS "audiobookTitle",
        audiobooks.cover_image_asset_key AS "audiobookCoverImageAssetKey",
        authors.name AS "authorName",
        bookmarks.chapter_id AS "chapterId",
        chapters.title AS "chapterTitle",
        bookmarks.position_ms AS "positionMs",
        bookmarks.note,
        bookmarks.created_at AS "createdAt"
      FROM bookmarks
      INNER JOIN audiobooks ON audiobooks.id = bookmarks.audiobook_id
      INNER JOIN authors ON authors.id = audiobooks.author_id
      INNER JOIN chapters ON chapters.id = bookmarks.chapter_id
      ${filter.where}
      ORDER BY bookmarks.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...filter.params, query.pageSize, (query.page - 1) * query.pageSize],
    );

    const countResult = await this.database.query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM bookmarks
      ${filter.where}`,
      filter.params,
    );

    return {
      data: dataResult.rows,
      totalItems: Number(countResult.rows[0]?.count ?? 0),
    };
  }

  async createBookmark(input: {
    userId: string;
    audiobookId: string;
    chapterId: string;
    positionMs: number;
    note: string | null;
  }): Promise<BookmarkSummaryRow> {
    const inserted = await this.database.query<{ id: string }>(
      `
      INSERT INTO bookmarks (
        user_id,
        audiobook_id,
        chapter_id,
        position_ms,
        note
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [input.userId, input.audiobookId, input.chapterId, input.positionMs, input.note],
    );

    const bookmarkId = inserted.rows[0]?.id;
    if (!bookmarkId) {
      throw new Error('Failed to create bookmark');
    }

    const created = await this.findByUserAndId(input.userId, bookmarkId);
    if (!created) {
      throw new Error('Failed to load created bookmark');
    }

    return created;
  }

  async deleteBookmark(userId: string, bookmarkId: string): Promise<boolean> {
    const result = await this.database.query<{ id: string }>(
      `DELETE FROM bookmarks
       WHERE user_id = $1 AND id = $2
       RETURNING id`,
      [userId, bookmarkId],
    );

    return result.rows.length > 0;
  }
}

export class PostgresFavoriteRepository implements FavoriteRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async findByUserAndAudiobookId(userId: string, audiobookId: string): Promise<FavoriteSummaryRow | null> {
    const result = await this.database.query<FavoriteSummaryRow>(
      `
      SELECT
        favorites.id,
        favorites.audiobook_id AS "audiobookId",
        audiobooks.title AS "audiobookTitle",
        audiobooks.cover_image_asset_key AS "audiobookCoverImageAssetKey",
        authors.name AS "authorName",
        audiobooks.duration_sec AS "durationSec",
        audiobooks.premium_flag AS "premiumFlag",
        favorites.created_at AS "createdAt"
      FROM favorites
      INNER JOIN audiobooks ON audiobooks.id = favorites.audiobook_id
      INNER JOIN authors ON authors.id = audiobooks.author_id
      WHERE favorites.user_id = $1 AND favorites.audiobook_id = $2
      LIMIT 1`,
      [userId, audiobookId],
    );

    return result.rows[0] ?? null;
  }

  async listFavorites(
    userId: string,
    query: EngagementListQuery,
  ): Promise<{ data: FavoriteSummaryRow[]; totalItems: number }> {
    const filter = buildUserFilter('favorites', userId, query.audiobookId);
    const limitParam = filter.nextParamIndex;
    const offsetParam = filter.nextParamIndex + 1;
    const dataResult = await this.database.query<FavoriteSummaryRow>(
      `
      SELECT
        favorites.id,
        favorites.audiobook_id AS "audiobookId",
        audiobooks.title AS "audiobookTitle",
        audiobooks.cover_image_asset_key AS "audiobookCoverImageAssetKey",
        authors.name AS "authorName",
        audiobooks.duration_sec AS "durationSec",
        audiobooks.premium_flag AS "premiumFlag",
        favorites.created_at AS "createdAt"
      FROM favorites
      INNER JOIN audiobooks ON audiobooks.id = favorites.audiobook_id
      INNER JOIN authors ON authors.id = audiobooks.author_id
      ${filter.where}
      ORDER BY favorites.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...filter.params, query.pageSize, (query.page - 1) * query.pageSize],
    );

    const countResult = await this.database.query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM favorites
      ${filter.where}`,
      filter.params,
    );

    return {
      data: dataResult.rows,
      totalItems: Number(countResult.rows[0]?.count ?? 0),
    };
  }

  async upsertFavorite(input: { userId: string; audiobookId: string }): Promise<FavoriteSummaryRow> {
    const inserted = await this.database.query<{ id: string }>(
      `
      INSERT INTO favorites (
        user_id,
        audiobook_id
      ) VALUES ($1, $2)
      ON CONFLICT (user_id, audiobook_id) DO NOTHING
      RETURNING id`,
      [input.userId, input.audiobookId],
    );

    if (inserted.rows[0]?.id) {
      const created = await this.findByUserAndAudiobookId(input.userId, input.audiobookId);
      if (!created) {
        throw new Error('Failed to load created favorite');
      }

      return created;
    }

    const existing = await this.findByUserAndAudiobookId(input.userId, input.audiobookId);
    if (!existing) {
      throw new Error('Failed to load favorite');
    }

    return existing;
  }

  async deleteFavorite(userId: string, audiobookId: string): Promise<boolean> {
    const result = await this.database.query<{ id: string }>(
      `DELETE FROM favorites
       WHERE user_id = $1 AND audiobook_id = $2
       RETURNING id`,
      [userId, audiobookId],
    );

    return result.rows.length > 0;
  }
}

export class PostgresNoteRepository implements NoteRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async findByUserAndId(userId: string, noteId: string): Promise<NoteSummaryRow | null> {
    const result = await this.database.query<NoteSummaryRow>(
      `
      SELECT
        notes.id,
        notes.audiobook_id AS "audiobookId",
        audiobooks.title AS "audiobookTitle",
        audiobooks.cover_image_asset_key AS "audiobookCoverImageAssetKey",
        authors.name AS "authorName",
        notes.chapter_id AS "chapterId",
        chapters.title AS "chapterTitle",
        notes.position_ms AS "positionMs",
        notes.content,
        notes.created_at AS "createdAt",
        notes.updated_at AS "updatedAt"
      FROM notes
      INNER JOIN audiobooks ON audiobooks.id = notes.audiobook_id
      INNER JOIN authors ON authors.id = audiobooks.author_id
      INNER JOIN chapters ON chapters.id = notes.chapter_id
      WHERE notes.user_id = $1 AND notes.id = $2
      LIMIT 1`,
      [userId, noteId],
    );

    return result.rows[0] ?? null;
  }

  async listNotes(userId: string, query: EngagementListQuery): Promise<{ data: NoteSummaryRow[]; totalItems: number }> {
    const filter = buildUserFilter('notes', userId, query.audiobookId);
    const limitParam = filter.nextParamIndex;
    const offsetParam = filter.nextParamIndex + 1;
    const dataResult = await this.database.query<NoteSummaryRow>(
      `
      SELECT
        notes.id,
        notes.audiobook_id AS "audiobookId",
        audiobooks.title AS "audiobookTitle",
        audiobooks.cover_image_asset_key AS "audiobookCoverImageAssetKey",
        authors.name AS "authorName",
        notes.chapter_id AS "chapterId",
        chapters.title AS "chapterTitle",
        notes.position_ms AS "positionMs",
        notes.content,
        notes.created_at AS "createdAt",
        notes.updated_at AS "updatedAt"
      FROM notes
      INNER JOIN audiobooks ON audiobooks.id = notes.audiobook_id
      INNER JOIN authors ON authors.id = audiobooks.author_id
      INNER JOIN chapters ON chapters.id = notes.chapter_id
      ${filter.where}
      ORDER BY notes.updated_at DESC, notes.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...filter.params, query.pageSize, (query.page - 1) * query.pageSize],
    );

    const countResult = await this.database.query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM notes
      ${filter.where}`,
      filter.params,
    );

    return {
      data: dataResult.rows,
      totalItems: Number(countResult.rows[0]?.count ?? 0),
    };
  }

  async createNote(input: {
    userId: string;
    audiobookId: string;
    chapterId: string;
    positionMs: number;
    content: string;
  }): Promise<NoteSummaryRow> {
    const inserted = await this.database.query<{ id: string }>(
      `
      INSERT INTO notes (
        user_id,
        audiobook_id,
        chapter_id,
        position_ms,
        content
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [input.userId, input.audiobookId, input.chapterId, input.positionMs, input.content],
    );

    const noteId = inserted.rows[0]?.id;
    if (!noteId) {
      throw new Error('Failed to create note');
    }

    const created = await this.findByUserAndId(input.userId, noteId);
    if (!created) {
      throw new Error('Failed to load created note');
    }

    return created;
  }

  async updateNote(
    userId: string,
    noteId: string,
    input: { content: string },
  ): Promise<NoteSummaryRow | null> {
    const updated = await this.database.query<{ id: string }>(
      `
      UPDATE notes
      SET
        content = $3,
        updated_at = now()
      WHERE user_id = $1 AND id = $2
      RETURNING id`,
      [userId, noteId, input.content],
    );

    if (!updated.rows[0]?.id) {
      return null;
    }

    return this.findByUserAndId(userId, noteId);
  }

  async deleteNote(userId: string, noteId: string): Promise<boolean> {
    const result = await this.database.query<{ id: string }>(
      `DELETE FROM notes
       WHERE user_id = $1 AND id = $2
       RETURNING id`,
      [userId, noteId],
    );

    return result.rows.length > 0;
  }
}

function buildUserFilter(
  tableName: 'bookmarks' | 'favorites' | 'notes',
  userId: string,
  audiobookId?: string,
): { where: string; params: readonly unknown[]; nextParamIndex: number } {
  const clauses = [`${tableName}.user_id = $1`];
  const params: unknown[] = [userId];
  let nextParamIndex = 2;

  if (audiobookId) {
    clauses.push(`${tableName}.audiobook_id = $${nextParamIndex}`);
    params.push(audiobookId);
    nextParamIndex += 1;
  }

  return {
    where: `WHERE ${clauses.join(' AND ')}`,
    params,
    nextParamIndex,
  };
}

