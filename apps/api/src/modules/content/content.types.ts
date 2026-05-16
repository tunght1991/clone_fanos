import type {
  ChapterStatus,
  ContentStatus,
} from '../../../../../packages/shared/src/contracts/content.js';

export type { ChapterStatus, ContentStatus };

export interface AudiobookRow {
  id: string;
  title: string;
  description: string | null;
  coverImageAssetKey: string | null;
  authorId: string;
  durationSec: number;
  status: ContentStatus;
  premiumFlag: boolean;
  languageCode: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterRow {
  id: string;
  audiobookId: string;
  title: string;
  orderIndex: number;
  durationSec: number;
  audioAssetKey: string;
  transcript: string | null;
  status: ChapterStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudiobookNarratorRow {
  id: string;
  audiobookId: string;
  narratorId: string;
  roleIndex: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}
