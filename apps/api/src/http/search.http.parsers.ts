import type { SearchSortBy, SearchSortOrder } from '../modules/search/search.dto.js';
import { SEARCH_SORT_BYS, SEARCH_SORT_ORDERS } from '../../../../packages/shared/src/contracts/search.js';

export class SearchQueryParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchQueryParseError';
  }
}

export interface SearchHttpQuery {
  query: string;
  page?: string;
  pageSize?: string;
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  narratorId?: string;
  premiumFlag?: string;
  sortBy?: string;
  sortOrder?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new SearchQueryParseError(`Invalid integer value: ${value}`);
  }

  return parsed;
}

export function parseOptionalBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new SearchQueryParseError(`Invalid boolean value: ${value}`);
}

export function parseOptionalSortBy(value: string | undefined): SearchSortBy | undefined {
  if (!value) {
    return undefined;
  }

  if (SEARCH_SORT_BYS.includes(value as SearchSortBy)) {
    return value as SearchSortBy;
  }

  throw new SearchQueryParseError(`Invalid sortBy value: ${value}`);
}

export function parseOptionalSortOrder(value: string | undefined): SearchSortOrder | undefined {
  if (!value) {
    return undefined;
  }

  if (SEARCH_SORT_ORDERS.includes(value as SearchSortOrder)) {
    return value as SearchSortOrder;
  }

  throw new SearchQueryParseError(`Invalid sortOrder value: ${value}`);
}

export function parseSearchRequestQuery(query: unknown): {
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
} {
  const payload = assertPlainRecord(query, 'Search');
  assertAllowedKeys(
    payload,
    ['query', 'page', 'pageSize', 'categoryId', 'tagId', 'authorId', 'narratorId', 'premiumFlag', 'sortBy', 'sortOrder'],
    'Search',
  );

  const normalizedQuery = readRequiredText(payload.query, 'query');
  const result: {
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
  } = {
    query: normalizedQuery,
  };

  const page = parseOptionalPositiveInteger(readOptionalText(payload.page));
  if (page !== undefined) {
    result.page = page;
  }

  const pageSize = parseOptionalPositiveInteger(readOptionalText(payload.pageSize));
  if (pageSize !== undefined) {
    result.pageSize = pageSize;
  }

  const categoryId = readOptionalText(payload.categoryId);
  if (categoryId !== undefined) {
    result.categoryId = readUuid(categoryId, 'categoryId');
  }

  const tagId = readOptionalText(payload.tagId);
  if (tagId !== undefined) {
    result.tagId = readUuid(tagId, 'tagId');
  }

  const authorId = readOptionalText(payload.authorId);
  if (authorId !== undefined) {
    result.authorId = readUuid(authorId, 'authorId');
  }

  const narratorId = readOptionalText(payload.narratorId);
  if (narratorId !== undefined) {
    result.narratorId = readUuid(narratorId, 'narratorId');
  }

  const premiumFlag = parseOptionalBoolean(readOptionalText(payload.premiumFlag));
  if (premiumFlag !== undefined) {
    result.premiumFlag = premiumFlag;
  }

  const sortBy = parseOptionalSortBy(readOptionalText(payload.sortBy));
  if (sortBy !== undefined) {
    result.sortBy = sortBy;
  }

  const sortOrder = parseOptionalSortOrder(readOptionalText(payload.sortOrder));
  if (sortOrder !== undefined) {
    result.sortOrder = sortOrder;
  }

  return result;
}

function assertPlainRecord(value: unknown, scope: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SearchQueryParseError(`${scope} query must be an object`);
  }

  return value as Record<string, unknown>;
}

function assertAllowedKeys(payload: Record<string, unknown>, allowedKeys: readonly string[], scope: string): void {
  const unknownKeys = Object.keys(payload).filter((key) => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) {
    throw new SearchQueryParseError(`${scope} query contains unknown fields: ${unknownKeys.join(', ')}`);
  }
}

function readRequiredText(value: unknown, fieldName: string): string {
  const text = readOptionalText(value);
  if (!text) {
    throw new SearchQueryParseError(`${fieldName} is required`);
  }

  return text;
}

function readOptionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new SearchQueryParseError(`Invalid string value: ${String(value)}`);
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function readUuid(value: string, fieldName: string): string {
  if (!UUID_PATTERN.test(value)) {
    throw new SearchQueryParseError(`Invalid UUID value for ${fieldName}: ${value}`);
  }

  return value;
}
