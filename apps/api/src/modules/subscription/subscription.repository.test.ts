import assert from 'node:assert/strict';
import test from 'node:test';

import { PostgresSubscriptionRepository } from './subscription.repository.js';

test('PostgresSubscriptionRepository queries active plans using the database enum value', async () => {
  let capturedQuery = '';

  const repository = new PostgresSubscriptionRepository({
    async query(text: string) {
      capturedQuery = text;
      return { rows: [] };
    },
  });

  await repository.findActivePlans();

  assert.match(capturedQuery, /WHERE status = 'active'/);
  assert.doesNotMatch(capturedQuery, /WHERE status = 'ACTIVE'/);
  assert.match(capturedQuery, /upper\(status::text\) AS status/);
});

test('PostgresSubscriptionRepository writes webhook statuses using database enum values', async () => {
  let capturedParams: unknown[] = [];

  const repository = new PostgresSubscriptionRepository({
    async query(_text: string, params?: unknown[]) {
      capturedParams = params ?? [];
      return {
        rows: [
          {
            id: 'subscription-id',
            userId: 'user-id',
            planId: 'plan-id',
            status: 'active',
            startAt: new Date('2026-01-01T00:00:00Z'),
            endAt: new Date('2026-02-01T00:00:00Z'),
            provider: null,
            providerSubscriptionId: 'provider-subscription-id',
            billingProvider: 'WEB_GATEWAY',
            billingStatus: 'paid',
            billingReference: 'billing-reference',
            checkoutSessionId: 'checkout-session-id',
            lastBillingAt: null,
            nextBillingAt: null,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
          },
        ],
      };
    },
  });

  await repository.updateAfterWebhook({
    subscriptionId: 'subscription-id',
    billingProvider: 'WEB_GATEWAY',
    billingStatus: 'PAID',
    billingReference: 'billing-reference',
    providerSubscriptionId: 'provider-subscription-id',
    checkoutSessionId: 'checkout-session-id',
    status: 'ACTIVE',
  });

  assert.equal(capturedParams[2], 'paid');
  assert.equal(capturedParams[8], 'active');
});
