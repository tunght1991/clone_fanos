export interface EngagementListQuery {
  page: number;
  pageSize: number;
  audiobookId?: string;
}

export interface BookmarkSummaryRow {
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
}

export interface FavoriteSummaryRow {
  id: string;
  audiobookId: string;
  audiobookTitle: string;
  audiobookCoverImageAssetKey: string | null;
  authorName: string;
  durationSec: number;
  premiumFlag: boolean;
  createdAt: Date;
}

export interface NoteSummaryRow {
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
}

