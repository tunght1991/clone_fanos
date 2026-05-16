import type { SearchQueryDto, SearchResponseDto } from './search.dto.js';
import type { SearchRepositoryBundle } from './search.repository.js';

export interface SearchServiceDependencies {
  repositories: SearchRepositoryBundle;
}

export interface SearchExecutionInput {
  query: string;
  page: number;
  pageSize: number;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  narratorId?: string;
  premiumFlag?: boolean;
  sortBy: NonNullable<SearchQueryDto['sortBy']>;
  sortOrder: NonNullable<SearchQueryDto['sortOrder']>;
}

export class SearchService {
  constructor(private readonly dependencies: SearchServiceDependencies) {}

  async search(input: SearchExecutionInput): Promise<SearchResponseDto> {
    const query = normalizeQuery(input.query);
    const page = normalizePositiveInteger(input.page, 1);
    const pageSize = Math.min(normalizePositiveInteger(input.pageSize, 20), 100);
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    const sortBy = input.sortBy ?? 'RELEVANCE';
    const sortOrder = input.sortOrder ?? 'DESC';
    const result = await this.dependencies.repositories.searchRepository.searchPublishedAudiobooks({
      query,
      limit,
      offset,
      categoryId: input.categoryId,
      tagId: input.tagId,
      authorId: input.authorId,
      narratorId: input.narratorId,
      premiumFlag: input.premiumFlag,
      sortBy,
      sortOrder,
    });

    return {
      data: result.data,
      meta: {
        query,
        page,
        pageSize,
        totalItems: result.totalItems,
        totalPages: result.totalItems === 0 ? 0 : Math.ceil(result.totalItems / pageSize),
        hasNext: offset + result.data.length < result.totalItems,
        sortBy,
        sortOrder,
      },
    };
  }
}

function normalizeQuery(query: string): string {
  const normalized = query.trim();
  if (!normalized) {
    throw new Error('query must not be empty');
  }

  return normalized;
}

function normalizePositiveInteger(value: number, fallback: number): number {
  if (!value || !Number.isInteger(value) || value <= 0) {
    return fallback;
  }

  return value;
}
