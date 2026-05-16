import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemorySearchAliasManager } from './search.index.repository.js';

test('InMemorySearchAliasManager swaps aliases and keeps rollback state', async () => {
  const aliasManager = new InMemorySearchAliasManager({
    readAlias: 'audiobooks_read',
    writeAlias: 'audiobooks_write',
    activeIndexName: 'audiobooks_v1',
    previousIndexName: 'audiobooks_v0',
  });

  const versionedIndex = await aliasManager.createVersionedIndexName('audiobooks');
  assert.equal(versionedIndex, 'audiobooks_v2');

  const swapped = await aliasManager.swapAliases({
    activeIndexName: versionedIndex,
    previousIndexName: 'audiobooks_v1',
  });

  assert.equal(swapped.activeIndexName, 'audiobooks_v2');
  assert.equal(swapped.previousIndexName, 'audiobooks_v1');

  const rolledBack = await aliasManager.rollbackLastSwap();

  assert.equal(rolledBack.activeIndexName, 'audiobooks_v1');
  assert.equal(rolledBack.previousIndexName, 'audiobooks_v2');
});
