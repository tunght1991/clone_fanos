import { assertNarratorRoleIndex } from '../../../../../packages/shared/src/contracts/content.js';
import type { PublishedAudioAssetAccessContext } from './content.repository.js';
import type { AudiobookDetailDto, AudiobookListItemDto, AudiobookListResponseDto } from './content.dto.js';
import type { ContentRepositoryBundle } from './content.repository.js';

export class ContentService {
  constructor(private readonly repositories: ContentRepositoryBundle) {}

  async listPublishedAudiobooks(params: {
    page: number;
    pageSize: number;
  }): Promise<AudiobookListResponseDto> {
    const offset = (params.page - 1) * params.pageSize;
    const [items, totalItems] = await Promise.all([
      this.repositories.audiobookRepository.listPublished({
        limit: params.pageSize,
        offset,
      }),
      this.repositories.audiobookRepository.countPublished(),
    ]);

    return {
      data: items.map((item) => this.toListItemDto(item)),
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / params.pageSize),
        hasNext: offset + items.length < totalItems,
      },
    };
  }

  async getPublishedAudiobookDetail(audiobookId: string): Promise<AudiobookDetailDto | null> {
    const audiobook = await this.repositories.audiobookRepository.findPublishedById(audiobookId);
    if (!audiobook) {
      return null;
    }

    const [chapters, narrators, author] = await Promise.all([
      this.repositories.chapterRepository.findByAudiobookId(audiobookId),
      this.repositories.audiobookNarratorRepository.findDetailedByAudiobookId(audiobookId),
      this.repositories.authorRepository.findById(audiobook.authorId),
    ]);

    if (!author) {
      throw new Error(`Author ${audiobook.authorId} not found for audiobook ${audiobook.id}`);
    }

    return {
      id: audiobook.id,
      title: audiobook.title,
      description: audiobook.description,
      coverImageAssetKey: audiobook.coverImageAssetKey,
      author: {
        id: author.id,
        name: author.name,
      },
      durationSec: audiobook.durationSec,
      status: audiobook.status,
      premiumFlag: audiobook.premiumFlag,
      languageCode: audiobook.languageCode,
      publishedAt: audiobook.publishedAt ? audiobook.publishedAt.toISOString() : null,
      chapters: chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        orderIndex: chapter.orderIndex,
        durationSec: chapter.durationSec,
        audioAssetKey: chapter.audioAssetKey,
        transcript: chapter.transcript,
        status: chapter.status,
      })),
      narrators: narrators.map((narrator) => {
        assertNarratorRoleIndex(narrator.roleIndex);

        return {
          id: narrator.narratorId,
          name: narrator.narratorName,
          roleIndex: narrator.roleIndex,
          isPrimary: narrator.isPrimary,
        };
      }),
    };
  }

  async getPublishedAudioAssetAccessContext(
    audioAssetKey: string,
  ): Promise<PublishedAudioAssetAccessContext | null> {
    return this.repositories.chapterRepository.findPublishedAudioAssetAccessContext(audioAssetKey);
  }

  private toListItemDto(item: Awaited<ReturnType<ContentRepositoryBundle['audiobookRepository']['listPublished']>>[number]): AudiobookListItemDto {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      coverImageAssetKey: item.coverImageAssetKey,
      author: {
        id: item.authorId,
        name: item.authorName,
      },
      durationSec: item.durationSec,
      status: item.status,
      premiumFlag: item.premiumFlag,
      languageCode: item.languageCode,
      publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
    };
  }
}
