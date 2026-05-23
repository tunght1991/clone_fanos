import { isNarratorRoleIndexValid } from '../../../../../packages/shared/src/contracts/content.js';
import type { DatabaseExecutor } from '../../db/postgres.js';
import type { AudiobookNarratorRow, ChapterRow, ContentStatus } from './content.types.js';

export interface AdminAudiobookListItem {
  id: string;
  title: string;
  description: string | null;
  coverImageAssetKey: string | null;
  authorId: string;
  authorName: string;
  durationSec: number;
  status: ContentStatus;
  premiumFlag: boolean;
  languageCode: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  chapterCount: number;
  narratorNames: string[];
  categoryNames: string[];
  tagNames: string[];
}

export interface AdminAudiobookDetail extends AdminAudiobookListItem {
  chapters: ChapterRow[];
  narrators: Array<AudiobookNarratorRow & { narratorName: string }>;
  categoryIds: string[];
  tagIds: string[];
}

export interface AdminAudiobookListResponse {
  data: AdminAudiobookListItem[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface AdminAudiobookListQuery {
  page: number;
  pageSize: number;
  query?: string;
  status?: string;
}

function normalizeAdminStatusFilter(status?: string): string {
  const normalized = String(status ?? 'ALL').trim().toUpperCase();
  if (normalized === 'ALL') {
    return 'ALL';
  }

  const lower = normalized.toLowerCase();
  return ['draft', 'published', 'unpublished', 'archived'].includes(lower) ? lower : 'ALL';
}

function normalizeSearchPattern(query?: string): string {
  const normalized = String(query ?? '').trim();
  return normalized ? `%${normalized}%` : '';
}

function normalizeTextArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function mapAudiobookListRow(row: AdminAudiobookListItem & {
  narratorNames?: string[] | null;
  categoryNames?: string[] | null;
  tagNames?: string[] | null;
  chapterCount?: number | string | null;
}): AdminAudiobookListItem {
  return {
    ...row,
    narratorNames: normalizeTextArray(row.narratorNames),
    categoryNames: normalizeTextArray(row.categoryNames),
    tagNames: normalizeTextArray(row.tagNames),
    chapterCount: Number(row.chapterCount ?? 0),
  };
}

function createFilterSql() {
  return `
    WHERE ($1 = 'ALL' OR a.status = $1)
      AND (
        $2 = '' OR
        a.title ILIKE $2 OR
        COALESCE(a.description, '') ILIKE $2 OR
        authors.name ILIKE $2 OR
        EXISTS (
          SELECT 1
          FROM audiobook_narrators an
          INNER JOIN narrators n ON n.id = an.narrator_id
          WHERE an.audiobook_id = a.id AND n.name ILIKE $2
        ) OR
        EXISTS (
          SELECT 1
          FROM audiobook_categories ac
          INNER JOIN categories c ON c.id = ac.category_id
          WHERE ac.audiobook_id = a.id AND c.name ILIKE $2
        ) OR
        EXISTS (
          SELECT 1
          FROM audiobook_tags at
          INNER JOIN tags t ON t.id = at.tag_id
          WHERE at.audiobook_id = a.id AND t.name ILIKE $2
        )
      )
  `;
}

export class AdminContentService {
  constructor(private readonly database: DatabaseExecutor) {}

  async listAudiobooks(input: AdminAudiobookListQuery): Promise<AdminAudiobookListResponse> {
    const page = input.page > 0 ? input.page : 1;
    const pageSize = input.pageSize > 0 ? input.pageSize : 20;
    const statusFilter = normalizeAdminStatusFilter(input.status);
    const searchPattern = normalizeSearchPattern(input.query);
    const filterSql = createFilterSql();

    const countResult = await this.database.query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM audiobooks a
      INNER JOIN authors ON authors.id = a.author_id
      ${filterSql}`,
      [statusFilter, searchPattern],
    );
    const totalItems = Number(countResult.rows[0]?.count ?? 0);
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
    const currentPage = Math.min(page, totalPages);
    const offset = (currentPage - 1) * pageSize;

    const itemsResult = await this.database.query<AdminAudiobookListItem & {
      narratorNames: string[] | null;
      categoryNames: string[] | null;
      tagNames: string[] | null;
      chapterCount: number;
    }>(
      `
      SELECT
        a.id,
        a.title,
        a.description,
        a.cover_image_asset_key AS "coverImageAssetKey",
        a.author_id AS "authorId",
        authors.name AS "authorName",
        a.duration_sec AS "durationSec",
        a.status,
        a.premium_flag AS "premiumFlag",
        a.language_code AS "languageCode",
        a.published_at AS "publishedAt",
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt",
        COALESCE(chapter_counts.chapter_count, 0) AS "chapterCount",
        COALESCE(narrator_names.narrator_names, '{}'::text[]) AS "narratorNames",
        COALESCE(category_names.category_names, '{}'::text[]) AS "categoryNames",
        COALESCE(tag_names.tag_names, '{}'::text[]) AS "tagNames"
      FROM audiobooks a
      INNER JOIN authors ON authors.id = a.author_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS chapter_count
        FROM chapters
        WHERE chapters.audiobook_id = a.id
      ) chapter_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(narrators.name ORDER BY audiobook_narrators.role_index) AS narrator_names
        FROM audiobook_narrators
        INNER JOIN narrators ON narrators.id = audiobook_narrators.narrator_id
        WHERE audiobook_narrators.audiobook_id = a.id
      ) narrator_names ON TRUE
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(categories.name ORDER BY categories.name) AS category_names
        FROM audiobook_categories
        INNER JOIN categories ON categories.id = audiobook_categories.category_id
        WHERE audiobook_categories.audiobook_id = a.id
      ) category_names ON TRUE
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(tags.name ORDER BY tags.name) AS tag_names
        FROM audiobook_tags
        INNER JOIN tags ON tags.id = audiobook_tags.tag_id
        WHERE audiobook_tags.audiobook_id = a.id
      ) tag_names ON TRUE
      ${filterSql}
      ORDER BY a.updated_at DESC, a.created_at DESC
      LIMIT $3 OFFSET $4`,
      [statusFilter, searchPattern, pageSize, offset],
    );

    return {
      data: itemsResult.rows.map(mapAudiobookListRow),
      meta: {
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1,
      },
    };
  }

  async getAudiobookById(audiobookId: string): Promise<AdminAudiobookDetail | null> {
    const audiobookResult = await this.database.query<AdminAudiobookListItem>(
      `
      SELECT
        a.id,
        a.title,
        a.description,
        a.cover_image_asset_key AS "coverImageAssetKey",
        a.author_id AS "authorId",
        authors.name AS "authorName",
        a.duration_sec AS "durationSec",
        a.status,
        a.premium_flag AS "premiumFlag",
        a.language_code AS "languageCode",
        a.published_at AS "publishedAt",
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt",
        COALESCE(chapter_counts.chapter_count, 0) AS "chapterCount",
        COALESCE(narrator_names.narrator_names, '{}'::text[]) AS "narratorNames",
        COALESCE(category_names.category_names, '{}'::text[]) AS "categoryNames",
        COALESCE(tag_names.tag_names, '{}'::text[]) AS "tagNames"
      FROM audiobooks a
      INNER JOIN authors ON authors.id = a.author_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS chapter_count
        FROM chapters
        WHERE chapters.audiobook_id = a.id
      ) chapter_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(narrators.name ORDER BY audiobook_narrators.role_index) AS narrator_names
        FROM audiobook_narrators
        INNER JOIN narrators ON narrators.id = audiobook_narrators.narrator_id
        WHERE audiobook_narrators.audiobook_id = a.id
      ) narrator_names ON TRUE
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(categories.name ORDER BY categories.name) AS category_names
        FROM audiobook_categories
        INNER JOIN categories ON categories.id = audiobook_categories.category_id
        WHERE audiobook_categories.audiobook_id = a.id
      ) category_names ON TRUE
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(tags.name ORDER BY tags.name) AS tag_names
        FROM audiobook_tags
        INNER JOIN tags ON tags.id = audiobook_tags.tag_id
        WHERE audiobook_tags.audiobook_id = a.id
      ) tag_names ON TRUE
      WHERE a.id = $1
      LIMIT 1`,
      [audiobookId],
    );

    const audiobook = audiobookResult.rows[0];
    if (!audiobook) {
      return null;
    }

    const [chapters, narrators, categories, tags] = await Promise.all([
      this.database.query<ChapterRow>(
        `
        SELECT
          id,
          audiobook_id AS "audiobookId",
          title,
          order_index AS "orderIndex",
          duration_sec AS "durationSec",
          audio_asset_key AS "audioAssetKey",
          transcript,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM chapters
        WHERE audiobook_id = $1
        ORDER BY order_index ASC`,
        [audiobookId],
      ),
      this.database.query<AudiobookNarratorRow & { narratorName: string }>(
        `
        SELECT
          audiobook_narrators.id,
          audiobook_narrators.audiobook_id AS "audiobookId",
          audiobook_narrators.narrator_id AS "narratorId",
          narrators.name AS "narratorName",
          audiobook_narrators.role_index AS "roleIndex",
          audiobook_narrators.is_primary AS "isPrimary",
          audiobook_narrators.created_at AS "createdAt",
          audiobook_narrators.updated_at AS "updatedAt"
        FROM audiobook_narrators
        INNER JOIN narrators ON narrators.id = audiobook_narrators.narrator_id
        WHERE audiobook_narrators.audiobook_id = $1
        ORDER BY audiobook_narrators.role_index ASC`,
        [audiobookId],
      ),
      this.database.query<{ id: string; name: string }>(
        `
        SELECT
          categories.id,
          categories.name
        FROM audiobook_categories
        INNER JOIN categories ON categories.id = audiobook_categories.category_id
        WHERE audiobook_categories.audiobook_id = $1
        ORDER BY categories.name ASC`,
        [audiobookId],
      ),
      this.database.query<{ id: string; name: string }>(
        `
        SELECT
          tags.id,
          tags.name
        FROM audiobook_tags
        INNER JOIN tags ON tags.id = audiobook_tags.tag_id
        WHERE audiobook_tags.audiobook_id = $1
        ORDER BY tags.name ASC`,
        [audiobookId],
      ),
    ]);

    return {
      ...mapAudiobookListRow(audiobook),
      chapterCount: chapters.rows.length,
      chapters: chapters.rows,
      narrators: narrators.rows.map((narrator) => {
        this.assertValidNarratorRole(narrator.roleIndex);
        return narrator;
      }),
      categoryIds: categories.rows.map((row) => row.id),
      tagIds: tags.rows.map((row) => row.id),
    };
  }

  private assertValidNarratorRole(roleIndex: number): void {
    if (!isNarratorRoleIndexValid(roleIndex)) {
      throw new Error(`Invalid narrator role index ${roleIndex}`);
    }
  }
}
