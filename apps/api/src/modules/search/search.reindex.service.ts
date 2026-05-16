import type { SearchIndexAliasManager, SearchIndexAliasState, SearchDocumentSource, SearchIndexRepository } from './search.index.repository.js';

export interface SearchReindexServiceDependencies {
  documentSource: SearchDocumentSource;
  indexRepository: SearchIndexRepository;
  aliasManager: SearchIndexAliasManager;
}

export interface SearchReindexAllResult {
  indexedCount: number;
  activeIndexName: string;
  previousIndexName: string | null;
}

export interface SearchReindexSingleResult {
  indexed: boolean;
  documentId: string;
}

export class SearchReindexService {
  constructor(private readonly dependencies: SearchReindexServiceDependencies) {}

  async reindexAllPublishedAudiobooks(): Promise<SearchReindexAllResult> {
    const documents = await this.dependencies.documentSource.listPublishedSearchDocuments();
    const versionedIndexName = await this.dependencies.aliasManager.createVersionedIndexName('audiobooks');
    const currentState = await this.dependencies.aliasManager.describeState();

    await this.dependencies.indexRepository.replaceAll(documents, {
      indexName: versionedIndexName,
      refresh: true,
    });

    const swappedState = await this.dependencies.aliasManager.swapAliases({
      activeIndexName: versionedIndexName,
      previousIndexName: currentState.activeIndexName,
    });

    return {
      indexedCount: documents.length,
      activeIndexName: swappedState.activeIndexName,
      previousIndexName: swappedState.previousIndexName,
    };
  }

  async reindexPublishedAudiobook(audiobookId: string): Promise<SearchReindexSingleResult> {
    const document = await this.dependencies.documentSource.findPublishedSearchDocumentByAudiobookId(audiobookId);

    if (!document) {
      const currentState = await this.dependencies.aliasManager.describeState();
      await this.dependencies.indexRepository.deleteByIds([audiobookId], {
        indexName: currentState.writeAlias,
        refresh: true,
      });
      return {
        indexed: false,
        documentId: audiobookId,
      };
    }

    const currentState = await this.dependencies.aliasManager.describeState();
    await this.dependencies.indexRepository.upsert([document], {
      indexName: currentState.writeAlias,
      refresh: true,
    });
    return {
      indexed: true,
      documentId: document.audiobookId,
    };
  }

  async rollbackLastSuccessfulBulkSwap(): Promise<SearchIndexAliasState> {
    return this.dependencies.aliasManager.rollbackLastSwap();
  }
}
