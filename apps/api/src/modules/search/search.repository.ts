import type { DatabaseConnection, DatabaseExecutor } from '../../db/postgres.js';
import type { SearchAudiobookHitDto } from './search.dto.js';
import type { SearchRepositoryQuery, SearchRepositoryResult } from './search.types.js';

export interface SearchRepository {
  searchPublishedAudiobooks(query: SearchRepositoryQuery): Promise<SearchRepositoryResult>;
}

export interface SearchRepositoryBundle {
  searchRepository: SearchRepository;
}

export function createSearchRepositoryBundle(database: DatabaseConnection): SearchRepositoryBundle {
  return {
    searchRepository: new PostgresSearchRepository(database),
  };
}

export class PostgresSearchRepository implements SearchRepository {
  constructor(private readonly database: DatabaseExecutor) {}

  async searchPublishedAudiobooks(query: SearchRepositoryQuery): Promise<SearchRepositoryResult> {
    const pattern = `%${escapeLike(query.query.toLowerCase())}%`;
    const sortClause = buildSortClause(query.sortBy, query.sortOrder);
    const params: Array<string | number | boolean | null> = [
      pattern,
      query.authorId ?? null,
      query.categoryId ?? null,
      query.tagId ?? null,
      query.narratorId ?? null,
      typeof query.premiumFlag === 'boolean' ? query.premiumFlag : null,
      query.limit,
      query.offset,
    ];

    const result = await this.database.query<SearchRow>(
      `
      WITH filtered AS (
        SELECT
          audiobooks.id,
          audiobooks.title,
          audiobooks.description,
          audiobooks.cover_image_asset_key AS "coverImageAssetKey",
          audiobooks.author_id AS "authorId",
          authors.name AS "authorName",
          audiobooks.premium_flag AS "premiumFlag",
          UPPER(audiobooks.status::text) AS status,
          audiobooks.published_at AS "publishedAt",
          audiobooks.created_at AS "createdAt",
          audiobooks.updated_at AS "updatedAt",
          (
            CASE WHEN lower(audiobooks.title) LIKE $1 THEN 120 ELSE 0 END
            + CASE WHEN lower(COALESCE(audiobooks.description, '')) LIKE $1 THEN 50 ELSE 0 END
            + CASE WHEN lower(authors.name) LIKE $1 THEN 90 ELSE 0 END
            + CASE WHEN EXISTS (
              SELECT 1
              FROM audiobook_narrators filtered_narrators
              INNER JOIN narrators ON narrators.id = filtered_narrators.narrator_id
              WHERE filtered_narrators.audiobook_id = audiobooks.id
                AND lower(narrators.name) LIKE $1
            ) THEN 70 ELSE 0 END
            + CASE WHEN EXISTS (
              SELECT 1
              FROM audiobook_categories filtered_categories
              INNER JOIN categories ON categories.id = filtered_categories.category_id
              WHERE filtered_categories.audiobook_id = audiobooks.id
                AND lower(categories.name) LIKE $1
            ) THEN 40 ELSE 0 END
            + CASE WHEN EXISTS (
              SELECT 1
              FROM audiobook_tags filtered_tags
              INNER JOIN tags ON tags.id = filtered_tags.tag_id
              WHERE filtered_tags.audiobook_id = audiobooks.id
                AND lower(tags.name) LIKE $1
            ) THEN 35 ELSE 0 END
          )::integer AS score,
          COUNT(*) OVER()::integer AS "totalItems"
        FROM audiobooks
        INNER JOIN authors ON authors.id = audiobooks.author_id
        WHERE audiobooks.status = 'published'
          AND ($2::uuid IS NULL OR audiobooks.author_id = $2::uuid)
          AND ($6::boolean IS NULL OR audiobooks.premium_flag = $6::boolean)
          AND ($3::uuid IS NULL OR EXISTS (
            SELECT 1
            FROM audiobook_categories
            WHERE audiobook_categories.audiobook_id = audiobooks.id
              AND audiobook_categories.category_id = $3::uuid
          ))
          AND ($4::uuid IS NULL OR EXISTS (
            SELECT 1
            FROM audiobook_tags
            WHERE audiobook_tags.audiobook_id = audiobooks.id
              AND audiobook_tags.tag_id = $4::uuid
          ))
          AND ($5::uuid IS NULL OR EXISTS (
            SELECT 1
            FROM audiobook_narrators
            WHERE audiobook_narrators.audiobook_id = audiobooks.id
              AND audiobook_narrators.narrator_id = $5::uuid
          ))
          AND (
            lower(audiobooks.title) LIKE $1
            OR lower(COALESCE(audiobooks.description, '')) LIKE $1
            OR lower(authors.name) LIKE $1
            OR EXISTS (
              SELECT 1
              FROM audiobook_narrators filtered_narrators
              INNER JOIN narrators ON narrators.id = filtered_narrators.narrator_id
              WHERE filtered_narrators.audiobook_id = audiobooks.id
                AND lower(narrators.name) LIKE $1
            )
            OR EXISTS (
              SELECT 1
              FROM audiobook_categories filtered_categories
              INNER JOIN categories ON categories.id = filtered_categories.category_id
              WHERE filtered_categories.audiobook_id = audiobooks.id
                AND lower(categories.name) LIKE $1
            )
            OR EXISTS (
              SELECT 1
              FROM audiobook_tags filtered_tags
              INNER JOIN tags ON tags.id = filtered_tags.tag_id
              WHERE filtered_tags.audiobook_id = audiobooks.id
                AND lower(tags.name) LIKE $1
            )
          )
      )
      SELECT
        filtered.id AS "audiobookId",
        filtered.title,
        filtered."coverImageAssetKey",
        filtered."authorName",
        COALESCE((
          SELECT ARRAY_AGG(narrators.name ORDER BY audiobook_narrators.role_index)
          FROM audiobook_narrators
          INNER JOIN narrators ON narrators.id = audiobook_narrators.narrator_id
          WHERE audiobook_narrators.audiobook_id = filtered.id
        ), ARRAY[]::text[]) AS "narratorNames",
        COALESCE((
          SELECT ARRAY_AGG(categories.name ORDER BY categories.name)
          FROM audiobook_categories
          INNER JOIN categories ON categories.id = audiobook_categories.category_id
          WHERE audiobook_categories.audiobook_id = filtered.id
        ), ARRAY[]::text[]) AS "categoryNames",
        COALESCE((
          SELECT ARRAY_AGG(tags.name ORDER BY tags.name)
          FROM audiobook_tags
          INNER JOIN tags ON tags.id = audiobook_tags.tag_id
          WHERE audiobook_tags.audiobook_id = filtered.id
        ), ARRAY[]::text[]) AS "tagNames",
        filtered."premiumFlag",
        filtered.status,
        filtered.score,
        filtered."totalItems"
      FROM filtered
      ${sortClause}
      LIMIT $7 OFFSET $8
      `,
      params,
    );

    const rows = result.rows.map((row) => this.mapRow(row, query.query));
    const totalItems = rows[0]?.meta.totalItems ?? 0;

    return {
      data: rows.map((row) => row.data),
      totalItems,
    };
  }

  private mapRow(row: SearchRow, query: string): { data: SearchAudiobookHitDto; meta: { totalItems: number } } {
    return {
      data: {
        audiobookId: row.audiobookId,
        title: row.title,
        coverImageAssetKey: row.coverImageAssetKey ?? undefined,
        authorName: row.authorName,
        narratorNames: row.narratorNames ?? [],
        categoryNames: row.categoryNames ?? [],
        tagNames: row.tagNames ?? [],
        premiumFlag: row.premiumFlag,
        status: row.status.toUpperCase() as SearchAudiobookHitDto['status'],
        score: row.score,
        highlight: buildHighlight(row, query),
      },
      meta: {
        totalItems: row.totalItems,
      },
    };
  }
}

interface SearchRow {
  audiobookId: string;
  title: string;
  coverImageAssetKey: string | null;
  authorName: string;
  narratorNames: string[] | null;
  categoryNames: string[] | null;
  tagNames: string[] | null;
  premiumFlag: boolean;
  status: SearchAudiobookHitDto['status'];
  score: number;
  totalItems: number;
}

function buildSortClause(sortBy: SearchRepositoryQuery['sortBy'], sortOrder: SearchRepositoryQuery['sortOrder']): string {
  const direction = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  switch (sortBy) {
    case 'CREATED_AT':
      return `ORDER BY filtered."createdAt" ${direction}, filtered."publishedAt" ${direction}`;
    case 'POPULARITY':
      return `ORDER BY filtered.score DESC, filtered."publishedAt" DESC, filtered."createdAt" DESC`;
    case 'RELEVANCE':
    default:
      return `ORDER BY filtered.score DESC, filtered."publishedAt" DESC, filtered."createdAt" DESC`;
  }
}

function buildHighlight(row: SearchRow, query: string): SearchAudiobookHitDto['highlight'] {
  const term = query.trim();
  if (!term) {
    return undefined;
  }

  return {
    title: highlightText(row.title, term),
    authorName: highlightText(row.authorName, term),
    narratorNames: row.narratorNames?.map((name) => highlightText(name, term)).filter((name): name is string => Boolean(name)),
    tagNames: row.tagNames?.map((name) => highlightText(name, term)).filter((name): name is string => Boolean(name)),
  };
}

function highlightText(value: string, term: string): string | undefined {
  const normalizedValue = value.trim();
  const pattern = new RegExp(escapeRegExp(term), 'ig');
  if (!pattern.test(normalizedValue)) {
    return undefined;
  }

  return normalizedValue.replace(pattern, (match) => `<em>${match}</em>`);
}

function escapeLike(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
