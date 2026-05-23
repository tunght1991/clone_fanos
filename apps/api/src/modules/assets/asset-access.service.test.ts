import assert from 'node:assert/strict';
import test from 'node:test';

import { AssetAccessService } from './asset-access.service.js';

test('AssetAccessService keeps offline capability disabled for the current MVP boundary', () => {
  const service = new AssetAccessService({
    policy: {
      environment: 'development',
      allowedProviders: ['LOCALFILE'],
      defaultProvider: 'LOCALFILE',
      urlTtlSeconds: 300,
    },
    config: {
      environment: 'development',
      localBaseUrl: 'http://localhost:3000',
    },
  });

  const access = service.resolve({
    assetKey: 'chapters/book-1/ch-1.mp3',
    kind: 'AUDIO',
    purpose: 'STREAM',
    offlineCapable: true,
  });

  assert.equal(access.offlineCapable, false);
  assert.equal(access.streamable, true);
});
