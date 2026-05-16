import type { AudiobookRepository, ChapterRepository, ContentRepositoryBundle } from '../content/content.repository.js';
import type {
  BookmarkDto,
  BookmarkListResponseDto,
  CreateBookmarkRequestDto,
  CreateNoteRequestDto,
  DeleteBookmarkResponseDto,
  DeleteFavoriteResponseDto,
  DeleteNoteResponseDto,
  FavoriteDto,
  FavoriteListResponseDto,
  FavoriteToggleResponseDto,
  NoteDetailResponseDto,
  NoteDto,
  NoteListResponseDto,
  UpdateNoteRequestDto,
  EngagementPaginationMetaDto,
} from './engagement.dto.js';
import type { EngagementListQuery } from './engagement.types.js';
import type { EngagementRepositoryBundle } from './engagement.repository.js';

export interface EngagementServiceDependencies {
  repositories: EngagementRepositoryBundle;
  contentRepositories: ContentRepositoryBundle;
}

export class EngagementService {
  constructor(private readonly dependencies: EngagementServiceDependencies) {}

  async createBookmark(userId: string, request: CreateBookmarkRequestDto): Promise<BookmarkDto> {
    const content = await this.requirePublishedAudiobookAndChapter(request.audiobookId, request.chapterId);
    const positionMs = normalizePositionMs(request.positionMs);
    this.ensurePositionWithinChapter(positionMs, content.chapter.durationSec, content.chapter.id);
    const note = normalizeOptionalText(request.note);
    const bookmark = await this.dependencies.repositories.bookmarkRepository.createBookmark({
      userId,
      audiobookId: request.audiobookId,
      chapterId: request.chapterId,
      positionMs,
      note,
    });

    return this.mapBookmark(bookmark);
  }

  async listBookmarks(userId: string, query: Partial<EngagementListQuery>): Promise<BookmarkListResponseDto> {
    const page = normalizePositiveInteger(query.page, 1);
    const pageSize = Math.min(normalizePositiveInteger(query.pageSize, 20), 100);
    const result = await this.dependencies.repositories.bookmarkRepository.listBookmarks(userId, {
      page,
      pageSize,
      audiobookId: query.audiobookId,
    });

    return {
      data: result.data.map((row) => this.mapBookmark(row)),
      meta: buildPaginationMeta(page, pageSize, result.totalItems),
    };
  }

  async deleteBookmark(userId: string, bookmarkId: string): Promise<DeleteBookmarkResponseDto> {
    const deleted = await this.dependencies.repositories.bookmarkRepository.deleteBookmark(userId, bookmarkId);
    return { deleted };
  }

  async addFavorite(userId: string, audiobookId: string): Promise<FavoriteToggleResponseDto> {
    const audiobook = await this.requirePublishedAudiobook(audiobookId);
    const favorite = await this.dependencies.repositories.favoriteRepository.upsertFavorite({
      userId,
      audiobookId: audiobook.id,
    });

    return {
      favorited: true,
      favorite: this.mapFavorite(favorite),
    };
  }

  async removeFavorite(userId: string, audiobookId: string): Promise<DeleteFavoriteResponseDto> {
    const deleted = await this.dependencies.repositories.favoriteRepository.deleteFavorite(userId, audiobookId);
    return { deleted };
  }

  async listFavorites(userId: string, query: Partial<EngagementListQuery>): Promise<FavoriteListResponseDto> {
    const page = normalizePositiveInteger(query.page, 1);
    const pageSize = Math.min(normalizePositiveInteger(query.pageSize, 20), 100);
    const result = await this.dependencies.repositories.favoriteRepository.listFavorites(userId, {
      page,
      pageSize,
      audiobookId: query.audiobookId,
    });

    return {
      data: result.data.map((row) => this.mapFavorite(row)),
      meta: buildPaginationMeta(page, pageSize, result.totalItems),
    };
  }

  async createNote(userId: string, request: CreateNoteRequestDto): Promise<NoteDto> {
    const content = normalizeRequiredText(request.content);
    const context = await this.requirePublishedAudiobookAndChapter(request.audiobookId, request.chapterId);
    const positionMs = normalizePositionMs(request.positionMs);
    this.ensurePositionWithinChapter(positionMs, context.chapter.durationSec, context.chapter.id);
    const note = await this.dependencies.repositories.noteRepository.createNote({
      userId,
      audiobookId: request.audiobookId,
      chapterId: request.chapterId,
      positionMs,
      content,
    });

    return this.mapNote(note);
  }

  async listNotes(userId: string, query: Partial<EngagementListQuery>): Promise<NoteListResponseDto> {
    const page = normalizePositiveInteger(query.page, 1);
    const pageSize = Math.min(normalizePositiveInteger(query.pageSize, 20), 100);
    const result = await this.dependencies.repositories.noteRepository.listNotes(userId, {
      page,
      pageSize,
      audiobookId: query.audiobookId,
    });

    return {
      data: result.data.map((row) => this.mapNote(row)),
      meta: buildPaginationMeta(page, pageSize, result.totalItems),
    };
  }

  async getNote(userId: string, noteId: string): Promise<NoteDetailResponseDto | null> {
    const note = await this.dependencies.repositories.noteRepository.findByUserAndId(userId, noteId);
    if (!note) {
      return null;
    }

    return { data: this.mapNote(note) };
  }

  async updateNote(
    userId: string,
    noteId: string,
    request: UpdateNoteRequestDto,
  ): Promise<NoteDetailResponseDto | null> {
    const content = normalizeRequiredText(request.content);
    const updated = await this.dependencies.repositories.noteRepository.updateNote(userId, noteId, { content });
    if (!updated) {
      return null;
    }

    return { data: this.mapNote(updated) };
  }

  async deleteNote(userId: string, noteId: string): Promise<DeleteNoteResponseDto> {
    const deleted = await this.dependencies.repositories.noteRepository.deleteNote(userId, noteId);
    return { deleted };
  }

  private async requirePublishedAudiobook(audiobookId: string) {
    const audiobook = await this.dependencies.contentRepositories.audiobookRepository.findPublishedById(audiobookId);
    if (!audiobook) {
      throw new Error(`Audiobook ${audiobookId} not found`);
    }

    return audiobook;
  }

  private async requirePublishedAudiobookAndChapter(audiobookId: string, chapterId: string) {
    const audiobook = await this.requirePublishedAudiobook(audiobookId);
    const chapter = await this.dependencies.contentRepositories.chapterRepository.findById(chapterId);
    if (!chapter || chapter.audiobookId !== audiobookId) {
      throw new Error(`Chapter ${chapterId} does not belong to audiobook ${audiobookId}`);
    }

    return { audiobook, chapter };
  }

  private ensurePositionWithinChapter(positionMs: number, durationSec: number, chapterId: string): void {
    if (positionMs > durationSec * 1000) {
      throw new Error(`positionMs exceeds chapter duration for chapter ${chapterId}`);
    }
  }

  private mapBookmark(row: {
    id: string;
    audiobookId: string;
    audiobookTitle: string;
    audiobookCoverImageAssetKey: string | null;
    authorName: string;
    chapterId: string;
    chapterTitle: string;
    positionMs: number;
    note: string | null;
    createdAt: Date;
  }): BookmarkDto {
    return {
      id: row.id,
      audiobookId: row.audiobookId,
      audiobookTitle: row.audiobookTitle,
      audiobookCoverImageAssetKey: row.audiobookCoverImageAssetKey,
      authorName: row.authorName,
      chapterId: row.chapterId,
      chapterTitle: row.chapterTitle,
      positionMs: row.positionMs,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapFavorite(row: {
    id: string;
    audiobookId: string;
    audiobookTitle: string;
    audiobookCoverImageAssetKey: string | null;
    authorName: string;
    durationSec: number;
    premiumFlag: boolean;
    createdAt: Date;
  }): FavoriteDto {
    return {
      id: row.id,
      audiobookId: row.audiobookId,
      audiobookTitle: row.audiobookTitle,
      audiobookCoverImageAssetKey: row.audiobookCoverImageAssetKey,
      authorName: row.authorName,
      durationSec: row.durationSec,
      premiumFlag: row.premiumFlag,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapNote(row: {
    id: string;
    audiobookId: string;
    audiobookTitle: string;
    audiobookCoverImageAssetKey: string | null;
    authorName: string;
    chapterId: string;
    chapterTitle: string;
    positionMs: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }): NoteDto {
    return {
      id: row.id,
      audiobookId: row.audiobookId,
      audiobookTitle: row.audiobookTitle,
      audiobookCoverImageAssetKey: row.audiobookCoverImageAssetKey,
      authorName: row.authorName,
      chapterId: row.chapterId,
      chapterTitle: row.chapterTitle,
      positionMs: row.positionMs,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (!value || !Number.isInteger(value) || value <= 0) {
    return fallback;
  }

  return value;
}

function normalizePositionMs(positionMs: number): number {
  if (!Number.isInteger(positionMs) || positionMs < 0) {
    throw new Error('positionMs must be a non-negative integer');
  }

  return positionMs;
}

function normalizeRequiredText(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('content is required');
  }

  return normalized;
}

function normalizeOptionalText(value?: string): string | null {
  if (value === undefined) {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function buildPaginationMeta(page: number, pageSize: number, totalItems: number): EngagementPaginationMetaDto {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
    hasNext: (page - 1) * pageSize + pageSize < totalItems,
  };
}

