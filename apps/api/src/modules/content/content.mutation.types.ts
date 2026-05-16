import type { AudiobookRow, ChapterRow } from './content.types.js';
import type { ContentAuditLogger } from './content.audit.types.js';

export interface ContentReindexQueue {
  enqueueAudiobookReindex(input: {
    audiobookId: string;
    reason: ContentReindexReason;
  }): Promise<void>;
}

export type ContentReindexReason =
  | 'audiobook_published'
  | 'audiobook_updated'
  | 'chapter_published'
  | 'chapter_updated';

export interface ContentMutationRepositoryBundle {
  audiobookRepository: {
    findById(id: string): Promise<AudiobookRow | null>;
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
  };
  chapterRepository: {
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
  };
}

export interface ContentMutationServiceDependencies {
  repositories: ContentMutationRepositoryBundle;
  auditLogger: ContentAuditLogger;
  reindexQueue: ContentReindexQueue;
}
