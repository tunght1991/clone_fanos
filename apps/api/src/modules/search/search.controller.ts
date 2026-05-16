import type { SearchQueryDto, SearchResponseDto, SearchSortBy, SearchSortOrder } from './search.dto.js';
import type { SearchService } from './search.service.js';

export interface SearchRequestQuery {
  query: string;
  page?: number;
  pageSize?: number;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  narratorId?: string;
  premiumFlag?: boolean;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (!value || !Number.isInteger(value) || value <= 0) {
    return fallback;
  }

  return value;
}

function normalizeQuery(query: string): string {
  const normalized = query.trim();
  if (!normalized) {
    throw new Error('query must not be empty');
  }

  return normalized;
}

export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  async search(query: SearchRequestQuery): Promise<SearchResponseDto> {
    const normalizedQuery = normalizeQuery(query.query);
    const page = normalizePositiveInteger(query.page, 1);
    const pageSize = Math.min(normalizePositiveInteger(query.pageSize, 20), 100);
    const sortBy = query.sortBy ?? 'RELEVANCE';
    const sortOrder = query.sortOrder ?? 'DESC';

    return this.searchService.search({
      query: normalizedQuery,
      page,
      pageSize,
      categoryId: query.categoryId,
      tagId: query.tagId,
      authorId: query.authorId,
      narratorId: query.narratorId,
      premiumFlag: query.premiumFlag,
      sortBy,
      sortOrder,
    });
  }
}
