import type { AudiobookDetailResponseDto, AudiobookListResponseDto } from './content.dto.js';
import type { PublishedAudioAssetAccessContext } from './content.repository.js';
import type { ContentService } from './content.service.js';

export interface AudiobookListQuery {
  page?: number;
  pageSize?: number;
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (!value || !Number.isInteger(value) || value <= 0) {
    return fallback;
  }

  return value;
}

export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  async listAudiobooks(query: AudiobookListQuery = {}): Promise<AudiobookListResponseDto> {
    const page = normalizePositiveInteger(query.page, 1);
    const pageSize = Math.min(normalizePositiveInteger(query.pageSize, 20), 100);
    const result = await this.contentService.listPublishedAudiobooks({ page, pageSize });

    return {
      data: result.data,
      meta: result.meta,
    };
  }

  async getAudiobookById(audiobookId: string): Promise<AudiobookDetailResponseDto | null> {
    const detail = await this.contentService.getPublishedAudiobookDetail(audiobookId);

    if (!detail) {
      return null;
    }

    return {
      data: detail,
    };
  }

  async getPublishedAudioAssetAccessContext(
    audioAssetKey: string,
  ): Promise<PublishedAudioAssetAccessContext | null> {
    return this.contentService.getPublishedAudioAssetAccessContext(audioAssetKey);
  }
}
