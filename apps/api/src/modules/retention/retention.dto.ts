import type { ContentStatus } from '../content/content.types.js';

export type RetentionRecommendationReasonType =
  | 'MORE_FROM_AUTHOR'
  | 'FRESH_PICK'
  | 'HABIT_BUILDER';

export interface RetentionRecommendationDto {
  audiobookId: string;
  title: string;
  description: string | null;
  coverImageAssetKey: string | null;
  authorId: string;
  authorName: string;
  durationSec: number;
  premiumFlag: boolean;
  status: ContentStatus;
  publishedAt: string | null;
  reasonType: RetentionRecommendationReasonType;
  reason: string;
}

export interface RetentionWeeklySummaryDto {
  periodStart: string;
  periodEnd: string;
  headline: string;
  description: string;
  activeDays: number;
  listeningSessions: number;
  bookmarksCreated: number;
  notesCreated: number;
  favoritesAdded: number;
  topAudiobookTitle: string | null;
  topAuthorName: string | null;
  lastActivityAt: string | null;
}

export interface RetentionHomeDataDto {
  weeklySummary: RetentionWeeklySummaryDto;
  recommendations: RetentionRecommendationDto[];
}

export interface RetentionHomeResponseDto {
  data: RetentionHomeDataDto;
  meta: {
    generatedAt: string;
    windowDays: number;
  };
}
