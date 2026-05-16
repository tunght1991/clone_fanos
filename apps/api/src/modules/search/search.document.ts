export type SearchDocumentStatus = 'PUBLISHED';

export interface SearchDocument {
  audiobookId: string;
  title: string;
  description: string | null;
  authorId: string;
  authorName: string;
  narratorIds: string[];
  narratorNames: string[];
  categoryIds: string[];
  categoryNames: string[];
  tagIds: string[];
  tagNames: string[];
  coverImageAssetKey: string | null;
  premiumFlag: boolean;
  status: SearchDocumentStatus;
  publishedAt: string | null;
  popularityScore: number;
  languageCode: string;
  searchableText: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchDocumentSourceRow {
  audiobookId: string;
  title: string;
  description: string | null;
  coverImageAssetKey: string | null;
  authorId: string;
  authorName: string;
  narratorIds: string[] | null;
  narratorNames: string[] | null;
  categoryIds: string[] | null;
  categoryNames: string[] | null;
  tagIds: string[] | null;
  tagNames: string[] | null;
  premiumFlag: boolean;
  status: SearchDocumentStatus;
  publishedAt: Date | null;
  popularityScore: number;
  languageCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export function buildSearchDocument(row: SearchDocumentSourceRow): SearchDocument {
  return {
    audiobookId: row.audiobookId,
    title: row.title,
    description: row.description,
    authorId: row.authorId,
    authorName: row.authorName,
    narratorIds: row.narratorIds ?? [],
    narratorNames: row.narratorNames ?? [],
    categoryIds: row.categoryIds ?? [],
    categoryNames: row.categoryNames ?? [],
    tagIds: row.tagIds ?? [],
    tagNames: row.tagNames ?? [],
    coverImageAssetKey: row.coverImageAssetKey,
    premiumFlag: row.premiumFlag,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    popularityScore: row.popularityScore,
    languageCode: row.languageCode,
    searchableText: buildSearchableText(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildSearchableText(row: SearchDocumentSourceRow): string {
  const parts = [
    row.title,
    row.description ?? '',
    row.authorName,
    ...(row.narratorNames ?? []),
    ...(row.categoryNames ?? []),
    ...(row.tagNames ?? []),
  ];

  return parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(' ')
    .replace(/\s+/gu, ' ')
    .toLowerCase();
}
