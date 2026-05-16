import type {
  BookmarkListResponseDto,
  CreateBookmarkRequestDto,
  CreateNoteRequestDto,
  DeleteBookmarkResponseDto,
  DeleteFavoriteResponseDto,
  DeleteNoteResponseDto,
  FavoriteListResponseDto,
  FavoriteToggleResponseDto,
  NoteDetailResponseDto,
  NoteListResponseDto,
  UpdateNoteRequestDto,
} from './engagement.dto.js';
import type { EngagementService } from './engagement.service.js';
import type { EngagementListQuery } from './engagement.types.js';

export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  async createBookmark(userId: string, request: CreateBookmarkRequestDto) {
    return this.engagementService.createBookmark(userId, request);
  }

  async listBookmarks(userId: string, query: Partial<EngagementListQuery> = {}): Promise<BookmarkListResponseDto> {
    return this.engagementService.listBookmarks(userId, query);
  }

  async deleteBookmark(userId: string, bookmarkId: string): Promise<DeleteBookmarkResponseDto> {
    return this.engagementService.deleteBookmark(userId, bookmarkId);
  }

  async addFavorite(userId: string, audiobookId: string): Promise<FavoriteToggleResponseDto> {
    return this.engagementService.addFavorite(userId, audiobookId);
  }

  async removeFavorite(userId: string, audiobookId: string): Promise<DeleteFavoriteResponseDto> {
    return this.engagementService.removeFavorite(userId, audiobookId);
  }

  async listFavorites(userId: string, query: Partial<EngagementListQuery> = {}): Promise<FavoriteListResponseDto> {
    return this.engagementService.listFavorites(userId, query);
  }

  async createNote(userId: string, request: CreateNoteRequestDto) {
    return this.engagementService.createNote(userId, request);
  }

  async listNotes(userId: string, query: Partial<EngagementListQuery> = {}): Promise<NoteListResponseDto> {
    return this.engagementService.listNotes(userId, query);
  }

  async getNote(userId: string, noteId: string): Promise<NoteDetailResponseDto | null> {
    return this.engagementService.getNote(userId, noteId);
  }

  async updateNote(userId: string, noteId: string, request: UpdateNoteRequestDto) {
    return this.engagementService.updateNote(userId, noteId, request);
  }

  async deleteNote(userId: string, noteId: string): Promise<DeleteNoteResponseDto> {
    return this.engagementService.deleteNote(userId, noteId);
  }
}
