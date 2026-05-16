import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { buildAssetAccessPolicy } from './asset-access.policy.js';

describe('Asset access policy', () => {
  it('allows LOCALFILE in development by default', () => {
    const policy = buildAssetAccessPolicy({
      environment: 'development',
    });

    assert.equal(policy.defaultProvider, 'LOCALFILE');
    assert.equal(policy.allowedProviders.includes('LOCALFILE'), true);
  });

  it('defaults to CDN in production', () => {
    const policy = buildAssetAccessPolicy({
      environment: 'production',
    });

    assert.equal(policy.defaultProvider, 'CDN');
    assert.equal(policy.allowedProviders.includes('LOCALFILE'), false);
  });

  it('rejects LOCALFILE in production', () => {
    assert.throws(() =>
      buildAssetAccessPolicy({
        environment: 'production',
        provider: 'LOCALFILE',
      }),
    );
  });

  it('rejects invalid ttl', () => {
    assert.throws(() =>
      buildAssetAccessPolicy({
        environment: 'development',
        urlTtlSeconds: 0,
      }),
    );
  });
});

