import type { DatabaseConnection, DatabaseExecutor } from '../../db/postgres.js';
import { buildSearchDocument } from './search.document.js';
import type { SearchDocument } from './search.document.js';

export interface SearchIndexRepository {
  replaceAll(documents: SearchDocument[], options?: SearchIndexWriteOptions): Promise<SearchIndexWriteResult>;
  upsert(documents: SearchDocument[], options?: SearchIndexWriteOptions): Promise<SearchIndexWriteResult>;
  deleteByIds(audiobookIds: string[], options?: SearchIndexWriteOptions): Promise<SearchIndexWriteResult>;
}

export interface SearchIndexWriteResult {
  indexedCount: number;
  deletedCount: number;
}

export interface SearchIndexWriteOptions {
  indexName?: string;
  refresh?: boolean;
}

export interface SearchDocumentSource {
  listPublishedSearchDocuments(): Promise<SearchDocument[]>;
  findPublishedSearchDocumentByAudiobookId(audiobookId: string): Promise<SearchDocument | null>;
}

export interface SearchIndexBundle {
  indexRepository: SearchIndexRepository;
  documentSource: SearchDocumentSource;
  aliasManager: SearchIndexAliasManager;
}

export function createSearchIndexBundle(database: DatabaseConnection): SearchIndexBundle {
  return {
    indexRepository: new NoopSearchIndexRepository(),
    documentSource: new PostgresSearchDocumentSource(database),
    aliasManager: new InMemorySearchAliasManager({
      readAlias: 'audiobooks_read',
      writeAlias: 'audiobooks_write',
      activeIndexName: 'audiobooks_v1',
      previousIndexName: null,
    }),
  };
}

export class NoopSearchIndexRepository implements SearchIndexRepository {
  async replaceAll(documents: SearchDocument[], _options?: SearchIndexWriteOptions): Promise<SearchIndexWriteResult> {
    return {
      indexedCount: documents.length,
      deletedCount: 0,
    };
  }

  async upsert(documents: SearchDocument[], _options?: SearchIndexWriteOptions): Promise<SearchIndexWriteResult> {
    return {
      indexedCount: documents.length,
      deletedCount: 0,
    };
  }

  async deleteByIds(audiobookIds: string[], _options?: SearchIndexWriteOptions): Promise<SearchIndexWriteResult> {
    return {
      indexedCount: 0,
      deletedCount: audiobookIds.length,
    };
  }
}

export interface SearchIndexAliasState {
  readAlias: string;
  writeAlias: string;
  activeIndexName: string;
  previousIndexName: string | null;
}

export interface SearchIndexAliasSwapInput {
  activeIndexName: string;
  previousIndexName?: string | null;
}

export interface SearchIndexAliasManager {
  createVersionedIndexName(baseIndexName: string): Promise<string>;
  swapAliases(input: SearchIndexAliasSwapInput): Promise<SearchIndexAliasState>;
  rollbackLastSwap(): Promise<SearchIndexAliasState>;
  describeState(): Promise<SearchIndexAliasState>;
}

export class InMemorySearchAliasManager implements SearchIndexAliasManager {
  private state: SearchIndexAliasState;

  constructor(initialState: SearchIndexAliasState) {
    this.state = initialState;
  }

  async createVersionedIndexName(baseIndexName: string): Promise<string> {
    const currentVersion = extractVersionNumber(this.state.activeIndexName, baseIndexName);
    return `${baseIndexName}_v${currentVersion + 1}`;
  }

  async swapAliases(input: SearchIndexAliasSwapInput): Promise<SearchIndexAliasState> {
    this.state = {
      ...this.state,
      previousIndexName: input.previousIndexName ?? this.state.activeIndexName,
      activeIndexName: input.activeIndexName,
    };
    return this.describeState();
  }

  async rollbackLastSwap(): Promise<SearchIndexAliasState> {
    if (!this.state.previousIndexName) {
      return this.describeState();
    }

    const currentIndexName = this.state.activeIndexName;
    const previousIndexName = this.state.previousIndexName;
    this.state = {
      ...this.state,
      activeIndexName: previousIndexName,
      previousIndexName: currentIndexName,
    };
    return this.describeState();
  }

  async describeState(): Promise<SearchIndexAliasState> {
    return { ...this.state };
  }
}

export class PostgresSearchDocumentSource implements SearchDocumentSource {
  constructor(private readonly database: DatabaseExecutor) {}

  async listPublishedSearchDocuments(): Promise<SearchDocument[]> {
    const result = await this.database.query<SearchDocumentSourceRow>(
      `
      SELECT
        audiobooks.id AS "audiobookId",
        audiobooks.title,
        audiobooks.description,
        audiobooks.cover_image_asset_key AS "coverImageAssetKey",
        audiobooks.author_id AS "authorId",
        authors.name AS "authorName",
        COALESCE((
          SELECT ARRAY_AGG(audiobook_narrators.narrator_id ORDER BY audiobook_narrators.role_index)
          FROM audiobook_narrators
          WHERE audiobook_narrators.audiobook_id = audiobooks.id
        ), ARRAY[]::uuid[]) AS "narratorIds",
        COALESCE((
          SELECT ARRAY_AGG(narrators.name ORDER BY audiobook_narrators.role_index)
          FROM audiobook_narrators
          INNER JOIN narrators ON narrators.id = audiobook_narrators.narrator_id
          WHERE audiobook_narrators.audiobook_id = audiobooks.id
        ), ARRAY[]::text[]) AS "narratorNames",
        COALESCE((
          SELECT ARRAY_AGG(audiobook_categories.category_id ORDER BY categories.name)
          FROM audiobook_categories
          INNER JOIN categories ON categories.id = audiobook_categories.category_id
          WHERE audiobook_categories.audiobook_id = audiobooks.id
        ), ARRAY[]::uuid[]) AS "categoryIds",
        COALESCE((
          SELECT ARRAY_AGG(categories.name ORDER BY categories.name)
          FROM audiobook_categories
          INNER JOIN categories ON categories.id = audiobook_categories.category_id
          WHERE audiobook_categories.audiobook_id = audiobooks.id
        ), ARRAY[]::text[]) AS "categoryNames",
        COALESCE((
          SELECT ARRAY_AGG(audiobook_tags.tag_id ORDER BY tags.name)
          FROM audiobook_tags
          INNER JOIN tags ON tags.id = audiobook_tags.tag_id
          WHERE audiobook_tags.audiobook_id = audiobooks.id
        ), ARRAY[]::uuid[]) AS "tagIds",
        COALESCE((
          SELECT ARRAY_AGG(tags.name ORDER BY tags.name)
          FROM audiobook_tags
          INNER JOIN tags ON tags.id = audiobook_tags.tag_id
          WHERE audiobook_tags.audiobook_id = audiobooks.id
        ), ARRAY[]::text[]) AS "tagNames",
        audiobooks.premium_flag AS "premiumFlag",
        UPPER(audiobooks.status::text) AS status,
        audiobooks.published_at AS "publishedAt",
        COALESCE((
          SELECT COUNT(*)::integer
          FROM user_progress
          WHERE user_progress.audiobook_id = audiobooks.id
        ), 0) AS "popularityScore",
        audiobooks.language_code AS "languageCode",
        audiobooks.created_at AS "createdAt",
        audiobooks.updated_at AS "updatedAt"
       FROM audiobooks
       INNER JOIN authors ON authors.id = audiobooks.author_id
       WHERE audiobooks.status = 'published'
       ORDER BY audiobooks.published_at DESC NULLS LAST, audiobooks.created_at DESC, audiobooks.id ASC`
    );

    return result.rows.map((row) => buildSearchDocument(row));
  }

  async findPublishedSearchDocumentByAudiobookId(audiobookId: string): Promise<SearchDocument | null> {
    const result = await this.database.query<SearchDocumentSourceRow>(
      `
      SELECT
        audiobooks.id AS "audiobookId",
        audiobooks.title,
        audiobooks.description,
        audiobooks.cover_image_asset_key AS "coverImageAssetKey",
        audiobooks.author_id AS "authorId",
        authors.name AS "authorName",
        COALESCE((
          SELECT ARRAY_AGG(audiobook_narrators.narrator_id ORDER BY audiobook_narrators.role_index)
          FROM audiobook_narrators
          WHERE audiobook_narrators.audiobook_id = audiobooks.id
        ), ARRAY[]::uuid[]) AS "narratorIds",
        COALESCE((
          SELECT ARRAY_AGG(narrators.name ORDER BY audiobook_narrators.role_index)
          FROM audiobook_narrators
          INNER JOIN narrators ON narrators.id = audiobook_narrators.narrator_id
          WHERE audiobook_narrators.audiobook_id = audiobooks.id
        ), ARRAY[]::text[]) AS "narratorNames",
        COALESCE((
          SELECT ARRAY_AGG(audiobook_categories.category_id ORDER BY categories.name)
          FROM audiobook_categories
          INNER JOIN categories ON categories.id = audiobook_categories.category_id
          WHERE audiobook_categories.audiobook_id = audiobooks.id
        ), ARRAY[]::uuid[]) AS "categoryIds",
        COALESCE((
          SELECT ARRAY_AGG(categories.name ORDER BY categories.name)
          FROM audiobook_categories
          INNER JOIN categories ON categories.id = audiobook_categories.category_id
          WHERE audiobook_categories.audiobook_id = audiobooks.id
        ), ARRAY[]::text[]) AS "categoryNames",
        COALESCE((
          SELECT ARRAY_AGG(audiobook_tags.tag_id ORDER BY tags.name)
          FROM audiobook_tags
          INNER JOIN tags ON tags.id = audiobook_tags.tag_id
          WHERE audiobook_tags.audiobook_id = audiobooks.id
        ), ARRAY[]::uuid[]) AS "tagIds",
        COALESCE((
          SELECT ARRAY_AGG(tags.name ORDER BY tags.name)
          FROM audiobook_tags
          INNER JOIN tags ON tags.id = audiobook_tags.tag_id
          WHERE audiobook_tags.audiobook_id = audiobooks.id
        ), ARRAY[]::text[]) AS "tagNames",
        audiobooks.premium_flag AS "premiumFlag",
        UPPER(audiobooks.status::text) AS status,
        audiobooks.published_at AS "publishedAt",
        COALESCE((
          SELECT COUNT(*)::integer
          FROM user_progress
          WHERE user_progress.audiobook_id = audiobooks.id
        ), 0) AS "popularityScore",
        audiobooks.language_code AS "languageCode",
        audiobooks.created_at AS "createdAt",
        audiobooks.updated_at AS "updatedAt"
       FROM audiobooks
       INNER JOIN authors ON authors.id = audiobooks.author_id
       WHERE audiobooks.id = $1 AND audiobooks.status = 'published'
       LIMIT 1`,
      [audiobookId],
    );

    const row = result.rows[0];
    return row ? buildSearchDocument(row) : null;
  }
}

interface SearchDocumentSourceRow {
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
  status: 'PUBLISHED';
  publishedAt: Date | null;
  popularityScore: number;
  languageCode: string;
  createdAt: Date;
  updatedAt: Date;
}

function extractVersionNumber(indexName: string, baseIndexName: string): number {
  const prefix = `${baseIndexName}_v`;
  if (!indexName.startsWith(prefix)) {
    return 1;
  }

  const parsed = Number(indexName.slice(prefix.length));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}
