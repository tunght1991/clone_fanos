import type { SearchAudiobookHitDto, SearchSortBy, SearchSortOrder } from './search.dto.js';

export interface SearchRepositoryQuery {
  query: string;
  limit: number;
  offset: number;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  narratorId?: string;
  premiumFlag?: boolean;
  sortBy: SearchSortBy;
  sortOrder: SearchSortOrder;
}

export interface SearchRepositoryResult {
  data: SearchAudiobookHitDto[];
  totalItems: number;
}
