import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { buildSubscriptionPolicy } from './subscription.policy.js';

describe('Subscription policy', () => {
  it('defaults to sandbox web gateway in development', () => {
    const policy = buildSubscriptionPolicy({
      environment: 'development',
    });

    assert.equal(policy.provider, 'WEB_GATEWAY');
    assert.equal(policy.billingMode, 'SANDBOX');
    assert.equal(policy.allowSandbox, true);
  });

  it('requires explicit provider in production', () => {
    assert.throws(() =>
      buildSubscriptionPolicy({
        environment: 'production',
      }),
    );
  });

  it('rejects sandbox in production', () => {
    assert.throws(() =>
      buildSubscriptionPolicy({
        environment: 'production',
        provider: 'IAP',
        billingMode: 'SANDBOX',
      }),
    );
  });

  it('allows live billing in production', () => {
    const policy = buildSubscriptionPolicy({
      environment: 'production',
      provider: 'IAP',
      billingMode: 'LIVE',
    });

    assert.equal(policy.provider, 'IAP');
    assert.equal(policy.billingMode, 'LIVE');
    assert.equal(policy.allowSandbox, false);
  });
});

