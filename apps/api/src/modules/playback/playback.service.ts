import type { PlaybackProgressDto, PlaybackProgressRequestDto } from './playback.dto.js';
import type { PlaybackRepositoryBundle } from './playback.repository.js';
import type { ContentRepositoryBundle } from '../content/content.repository.js';
import type { PlaybackProgressRow } from './playback.types.js';

export interface PlaybackServiceDependencies {
  repositories: PlaybackRepositoryBundle;
  contentRepositories: ContentRepositoryBundle;
}

export class PlaybackService {
  constructor(private readonly dependencies: PlaybackServiceDependencies) {}

  async saveProgress(userId: string, request: PlaybackProgressRequestDto): Promise<PlaybackProgressDto> {
    const normalizedPositionMs = normalizePositionMs(request.positionMs);
    const audiobook = await this.dependencies.contentRepositories.audiobookRepository.findPublishedById(
      request.audiobookId,
    );
    if (!audiobook) {
      throw new Error(`Audiobook ${request.audiobookId} not found`);
    }

    const chapter = await this.dependencies.contentRepositories.chapterRepository.findById(request.chapterId);
    if (!chapter || chapter.audiobookId !== request.audiobookId) {
      throw new Error(`Chapter ${request.chapterId} does not belong to audiobook ${request.audiobookId}`);
    }

    if (normalizedPositionMs > chapter.durationSec * 1000) {
      throw new Error(`positionMs exceeds chapter duration for chapter ${chapter.id}`);
    }

    const progress = await this.dependencies.repositories.progressRepository.upsertProgress({
      userId,
      audiobookId: request.audiobookId,
      chapterId: request.chapterId,
      positionMs: normalizedPositionMs,
      completed: request.completed ?? normalizedPositionMs >= chapter.durationSec * 1000,
      lastPlayedAt: new Date(),
    });

    return this.mapProgress(progress);
  }

  async getProgress(userId: string, audiobookId: string): Promise<PlaybackProgressDto | null> {
    const progress = await this.dependencies.repositories.progressRepository.findByUserAndAudiobookId(
      userId,
      audiobookId,
    );

    return progress ? this.mapProgress(progress) : null;
  }

  private mapProgress(progress: PlaybackProgressRow): PlaybackProgressDto {
    return {
      id: progress.id,
      userId: progress.userId,
      audiobookId: progress.audiobookId,
      chapterId: progress.chapterId,
      positionMs: progress.positionMs,
      completed: progress.completed,
      lastPlayedAt: progress.lastPlayedAt ? progress.lastPlayedAt.toISOString() : null,
      updatedAt: progress.updatedAt.toISOString(),
    };
  }
}

function normalizePositionMs(positionMs: number): number {
  if (!Number.isFinite(positionMs) || !Number.isInteger(positionMs) || positionMs < 0) {
    throw new Error('positionMs must be a non-negative integer');
  }

  return positionMs;
}

