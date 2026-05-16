import type { ContentMutationServiceDependencies } from './content.mutation.types.js';
import type { ContentReindexReason } from './content.mutation.types.js';
import type { AudiobookRow, ChapterRow } from './content.types.js';

export class ContentMutationService {
  constructor(private readonly dependencies: ContentMutationServiceDependencies) {}

  async createAudiobook(input: {
    title: string;
    description: string | null;
    coverImageAssetKey: string | null;
    authorId: string;
    durationSec: number;
    premiumFlag: boolean;
    languageCode: string;
  }): Promise<AudiobookRow> {
    return this.dependencies.repositories.audiobookRepository.createAudiobook(input);
  }

  async createChapter(input: {
    audiobookId: string;
    title: string;
    orderIndex: number;
    durationSec: number;
    audioAssetKey: string;
    transcript: string | null;
  }): Promise<ChapterRow> {
    const audiobook = await this.dependencies.repositories.audiobookRepository.findById(input.audiobookId);
    if (!audiobook) {
      throw new Error(`Audiobook ${input.audiobookId} not found`);
    }

    return this.dependencies.repositories.chapterRepository.createChapter(input);
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
    const audiobook = await this.dependencies.repositories.audiobookRepository.updateAudiobook(input);
    await this.enqueueAudiobookReindex(audiobook.id, 'audiobook_updated');
    return audiobook;
  }

  async publishAudiobook(id: string, traceId?: string | null): Promise<AudiobookRow> {
    const audiobook = await this.dependencies.repositories.audiobookRepository.publishAudiobook(id);
    await this.recordAudit('audiobook', audiobook.id, audiobook.title, 'publish', {
      status: audiobook.status,
    }, traceId);
    await this.enqueueAudiobookReindex(audiobook.id, 'audiobook_published');
    return audiobook;
  }

  async unpublishAudiobook(id: string, traceId?: string | null): Promise<AudiobookRow> {
    const audiobook = await this.dependencies.repositories.audiobookRepository.unpublishAudiobook(id);
    await this.recordAudit('audiobook', audiobook.id, audiobook.title, 'unpublish', {
      status: audiobook.status,
    }, traceId);
    await this.enqueueAudiobookReindex(audiobook.id, 'audiobook_published');
    return audiobook;
  }

  async updateChapter(input: {
    id: string;
    title: string;
    orderIndex: number;
    durationSec: number;
    audioAssetKey: string;
    transcript: string | null;
  }): Promise<ChapterRow> {
    const chapter = await this.dependencies.repositories.chapterRepository.updateChapter(input);
    await this.enqueueAudiobookReindex(chapter.audiobookId, 'chapter_updated');
    return chapter;
  }

  async publishChapter(id: string, traceId?: string | null): Promise<ChapterRow> {
    const chapter = await this.dependencies.repositories.chapterRepository.publishChapter(id);
    await this.recordAudit('chapter', chapter.id, chapter.title, 'publish', {
      audiobookId: chapter.audiobookId,
      status: chapter.status,
    }, traceId);
    await this.enqueueAudiobookReindex(chapter.audiobookId, 'chapter_published');
    return chapter;
  }

  async unpublishChapter(id: string, traceId?: string | null): Promise<ChapterRow> {
    const chapter = await this.dependencies.repositories.chapterRepository.unpublishChapter(id);
    await this.recordAudit('chapter', chapter.id, chapter.title, 'unpublish', {
      audiobookId: chapter.audiobookId,
      status: chapter.status,
    }, traceId);
    await this.enqueueAudiobookReindex(chapter.audiobookId, 'chapter_updated');
    return chapter;
  }

  private async enqueueAudiobookReindex(audiobookId: string, reason: ContentReindexReason): Promise<void> {
    await this.dependencies.reindexQueue.enqueueAudiobookReindex({
      audiobookId,
      reason,
    });
  }

  private async recordAudit(
    entityType: 'audiobook' | 'chapter',
    entityId: string,
    entityTitle: string,
    action: 'publish' | 'unpublish',
    payloadJson: Record<string, unknown>,
    traceId?: string | null,
  ): Promise<void> {
    await this.dependencies.auditLogger.record({
      entityType,
      entityId,
      entityTitle,
      action,
      payloadJson,
      traceId: traceId ?? null,
    });
  }
}
