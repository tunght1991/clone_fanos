import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemorySearchAliasManager, NoopSearchIndexRepository } from './search.index.repository.js';

test('NoopSearchIndexRepository honors write options while counting documents', async () => {
  const repository = new NoopSearchIndexRepository();
  const result = await repository.replaceAll([{ audiobookId: 'book-1' } as never], {
    indexName: 'audiobooks_v2',
    refresh: true,
  });

  assert.equal(result.indexedCount, 1);
  assert.equal(result.deletedCount, 0);
});

test('InMemorySearchAliasManager increments versioned index names and swaps safely', async () => {
  const manager = new InMemorySearchAliasManager({
    readAlias: 'audiobooks_read',
    writeAlias: 'audiobooks_write',
    activeIndexName: 'audiobooks_v1',
    previousIndexName: null,
  });

  const next = await manager.createVersionedIndexName('audiobooks');
  assert.equal(next, 'audiobooks_v2');

  const swapped = await manager.swapAliases({
    activeIndexName: next,
    previousIndexName: 'audiobooks_v1',
  });

  assert.equal(swapped.activeIndexName, 'audiobooks_v2');
  assert.equal(swapped.previousIndexName, 'audiobooks_v1');

  const rolledBack = await manager.rollbackLastSwap();
  assert.equal(rolledBack.activeIndexName, 'audiobooks_v1');
  assert.equal(rolledBack.previousIndexName, 'audiobooks_v2');
});
