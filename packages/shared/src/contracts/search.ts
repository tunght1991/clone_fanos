export const SEARCH_SORT_BYS = ['RELEVANCE', 'CREATED_AT', 'POPULARITY'] as const;

export type SearchSortBy = (typeof SEARCH_SORT_BYS)[number];

export const SEARCH_SORT_ORDERS = ['ASC', 'DESC'] as const;

export type SearchSortOrder = (typeof SEARCH_SORT_ORDERS)[number];

export interface SearchQueryDto {
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

export interface SearchAudiobookHitDto {
  audiobookId: string;
  title: string;
  coverImageAssetKey?: string;
  authorName: string;
  narratorNames: string[];
  categoryNames: string[];
  tagNames: string[];
  premiumFlag: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  score?: number;
  highlight?: {
    title?: string;
    authorName?: string;
    narratorNames?: string[];
    tagNames?: string[];
  };
}

export interface SearchResponseDto {
  data: SearchAudiobookHitDto[];
  meta: {
    query: string;
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    sortBy: SearchSortBy;
    sortOrder: SearchSortOrder;
  };
}
