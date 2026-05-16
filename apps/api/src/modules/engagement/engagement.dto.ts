export interface EngagementPaginationMetaDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export interface CreateBookmarkRequestDto {
  audiobookId: string;
  chapterId: string;
  positionMs: number;
  note?: string;
}

export interface BookmarkDto {
  id: string;
  audiobookId: string;
  audiobookTitle: string;
  audiobookCoverImageAssetKey: string | null;
  authorName: string;
  chapterId: string;
  chapterTitle: string;
  positionMs: number;
  note: string | null;
  createdAt: string;
}

export interface BookmarkListResponseDto {
  data: BookmarkDto[];
  meta: EngagementPaginationMetaDto;
}

export interface DeleteBookmarkResponseDto {
  deleted: boolean;
}

export interface FavoriteDto {
  id: string;
  audiobookId: string;
  audiobookTitle: string;
  audiobookCoverImageAssetKey: string | null;
  authorName: string;
  durationSec: number;
  premiumFlag: boolean;
  createdAt: string;
}

export interface FavoriteListResponseDto {
  data: FavoriteDto[];
  meta: EngagementPaginationMetaDto;
}

export interface FavoriteToggleResponseDto {
  favorited: boolean;
  favorite: FavoriteDto;
}

export interface DeleteFavoriteResponseDto {
  deleted: boolean;
}

export interface CreateNoteRequestDto {
  audiobookId: string;
  chapterId: string;
  positionMs: number;
  content: string;
}

export interface UpdateNoteRequestDto {
  content: string;
}

export interface NoteDto {
  id: string;
  audiobookId: string;
  audiobookTitle: string;
  audiobookCoverImageAssetKey: string | null;
  authorName: string;
  chapterId: string;
  chapterTitle: string;
  positionMs: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteListResponseDto {
  data: NoteDto[];
  meta: EngagementPaginationMetaDto;
}

export interface NoteDetailResponseDto {
  data: NoteDto;
}

export interface DeleteNoteResponseDto {
  deleted: boolean;
}

