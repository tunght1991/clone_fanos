import assert from 'node:assert/strict';
import test from 'node:test';

import { SubscriptionService } from './subscription.service.js';
import type { SubscriptionServiceDependencies } from './subscription.service.js';
import type { SubscriptionRepositoryBundle, SubscriptionRow, SubscriptionPlanRow, SubscriptionDetailRow } from './subscription.repository.js';

function createDependencies(): SubscriptionServiceDependencies & {
  repoState: {
    plans: Map<string, SubscriptionPlanRow>;
    subscriptions: Map<string, SubscriptionRow>;
    details: Map<string, SubscriptionDetailRow>;
    webhookKeys: Set<string>;
  };
} {
  const repoState = {
    plans: new Map<string, SubscriptionPlanRow>([
      [
        'plan-1',
        {
          id: 'plan-1',
          name: 'Premium Monthly',
          price: '99000',
          durationDays: 30,
          status: 'ACTIVE',
          createdAt: new Date('2026-05-01T00:00:00.000Z'),
          updatedAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      ],
      [
        'plan-2',
        {
          id: 'plan-2',
          name: 'Premium Yearly',
          price: '999000',
          durationDays: 365,
          status: 'ACTIVE',
          createdAt: new Date('2026-05-02T00:00:00.000Z'),
          updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        },
      ],
      [
        'plan-archived',
        {
          id: 'plan-archived',
          name: 'Legacy Plan',
          price: '49000',
          durationDays: 30,
          status: 'ARCHIVED',
          createdAt: new Date('2026-04-01T00:00:00.000Z'),
          updatedAt: new Date('2026-04-01T00:00:00.000Z'),
        },
      ],
    ]),
    subscriptions: new Map<string, SubscriptionRow>(),
    details: new Map<string, SubscriptionDetailRow>(),
    webhookKeys: new Set<string>(),
    receiptKeys: new Set<string>(),
  };

  const repositories: SubscriptionRepositoryBundle = {
    subscriptionRepository: {
      async findById(id: string) {
        return repoState.subscriptions.get(id) ?? null;
      },
      async findPlanById(id: string) {
        return repoState.plans.get(id) ?? null;
      },
      async findActivePlans() {
        return [...repoState.plans.values()].filter((plan) => plan.status === 'ACTIVE');
      },
      async findActiveByUserId(userId: string) {
        return [...repoState.subscriptions.values()].find((item) => item.userId === userId && item.status === 'active') ?? null;
      },
      async findLatestByUserId(userId: string) {
        return [...repoState.subscriptions.values()].find((item) => item.userId === userId) ?? null;
      },
      async findActiveDetailByUserId(userId: string) {
        return [...repoState.details.values()].find((item) => item.status === 'active' && item.id.startsWith(userId)) ?? null;
      },
      async findLatestDetailByUserId(userId: string) {
        return [...repoState.details.values()].find((item) => item.id.startsWith(userId)) ?? null;
      },
      async findByCheckoutSessionId(checkoutSessionId: string) {
        return [...repoState.subscriptions.values()].find((item) => item.checkoutSessionId === checkoutSessionId) ?? null;
      },
      async findByBillingReference(billingReference: string) {
        return [...repoState.subscriptions.values()].find((item) => item.billingReference === billingReference) ?? null;
      },
      async createPendingSubscription(input) {
        const now = new Date('2026-05-11T00:00:00.000Z');
        const id = `sub_${repoState.subscriptions.size + 1}`;
        const row: SubscriptionRow = {
          id,
          userId: input.userId,
          planId: input.planId,
          status: 'pending',
          startAt: input.startAt,
          endAt: input.endAt,
          provider: input.provider ?? null,
          providerSubscriptionId: null,
          billingProvider: input.billingProvider,
          billingStatus: 'initiated',
          billingReference: null,
          checkoutSessionId: input.checkoutSessionId,
          lastBillingAt: null,
          nextBillingAt: null,
          createdAt: now,
          updatedAt: now,
        };
        repoState.subscriptions.set(id, row);
        return row;
      },
      async updateAfterWebhook(input) {
        const current = repoState.subscriptions.get(input.subscriptionId);
        if (!current) {
          throw new Error('missing subscription');
        }

        const next: SubscriptionRow = {
          ...current,
          billingProvider: input.billingProvider,
          billingStatus: input.billingStatus,
          billingReference: input.billingReference,
          providerSubscriptionId: input.providerSubscriptionId ?? current.providerSubscriptionId,
          checkoutSessionId: input.checkoutSessionId ?? current.checkoutSessionId,
          lastBillingAt: input.lastBillingAt ?? current.lastBillingAt,
          nextBillingAt: input.nextBillingAt ?? current.nextBillingAt,
          status: input.status,
          updatedAt: new Date('2026-05-11T01:00:00.000Z'),
        };
        repoState.subscriptions.set(next.id, next);

        const detail: SubscriptionDetailRow = {
          id: `${next.userId}-detail`,
          status: next.status,
          planId: next.planId,
          planName: repoState.plans.get(next.planId)?.name ?? 'Premium Monthly',
          planPrice: repoState.plans.get(next.planId)?.price ?? '99000',
          planDurationDays: repoState.plans.get(next.planId)?.durationDays ?? 30,
          planStatus: repoState.plans.get(next.planId)?.status ?? 'ACTIVE',
          billingProvider: next.billingProvider,
          billingStatus: next.billingStatus,
          billingReference: next.billingReference,
          checkoutSessionId: next.checkoutSessionId,
          lastBillingAt: next.lastBillingAt,
          nextBillingAt: next.nextBillingAt,
          canAccessPremium: next.status === 'active',
          expiresAt: next.endAt,
          startAt: next.startAt,
          endAt: next.endAt,
          createdAt: next.createdAt,
          updatedAt: next.updatedAt,
        };
        repoState.details.set(detail.id, detail);
        return next;
      },
      async recordWebhookEvent(input) {
        if (repoState.webhookKeys.has(input.idempotencyKey)) {
          return false;
        }
        repoState.webhookKeys.add(input.idempotencyKey);
        return true;
      },
      async markWebhookProcessed() {
        return;
      },
      async recordReceiptVerification(input) {
        if (repoState.receiptKeys.has(input.idempotencyKey)) {
          return false;
        }
        repoState.receiptKeys.add(input.idempotencyKey);
        return true;
      },
      async markReceiptVerificationProcessed() {
        return;
      },
    },
    subscriptionPlanRepository: {
      async findById(id: string) {
        return repoState.plans.get(id) ?? null;
      },
      async findActivePlans() {
        return [...repoState.plans.values()].filter((plan) => plan.status === 'ACTIVE');
      },
    },
  };

  return {
    policy: {
      environment: 'development',
      provider: 'WEB_GATEWAY',
      billingMode: 'SANDBOX',
      allowSandbox: true,
    },
    repositories,
    repoState,
  };
}

test('SubscriptionService creates checkout session for allowed plan/provider', async () => {
  const deps = createDependencies();
  const service = new SubscriptionService(deps);

  const result = await service.checkout({
    userId: 'user-1',
    request: {
      planId: 'plan-1',
      provider: 'WEB_GATEWAY',
      returnUrl: 'https://app.example.com/return',
    },
  });

  assert.equal(result.provider, 'WEB_GATEWAY');
  assert.equal(result.status, 'REQUIRES_ACTION');
  assert.equal(result.flowState, 'PAYMENT_PROCESSING');
  assert.equal(result.paymentAttemptId, result.checkoutSessionId);
  assert.equal(result.plan.id, 'plan-1');
  assert.ok(result.checkoutSessionId.startsWith('sub_chk_'));
  assert.ok(result.redirectUrl?.includes('checkoutSessionId='));
});

test('SubscriptionService verifies a pending subscription using checkout session and activates entitlement', async () => {
  const deps = createDependencies();
  const service = new SubscriptionService(deps);

  const checkout = await service.checkout({
    userId: 'user-1',
    request: {
      planId: 'plan-1',
      provider: 'WEB_GATEWAY',
    },
  });

  const result = await service.verifySubscription('user-1', {
    checkoutSessionId: checkout.checkoutSessionId,
    receiptToken: 'receipt-token-1',
    provider: 'WEB_GATEWAY',
    platform: 'web',
  });

  assert.ok(result);
  assert.equal(result?.status, 'SUCCEEDED');
  assert.equal(result?.subscription?.status, 'ACTIVE');
  assert.equal(result?.entitlement?.canAccessPremium, true);
  assert.equal(result?.entitlement?.status, 'ACTIVE');
  assert.equal(result?.subscription?.billing.status, 'PAID');
  assert.equal(result?.subscription?.billing.reference, 'receipt-token-1');
  assert.equal(result?.subscription?.flowState, 'UNLOCKED');
});

test('SubscriptionService lists only active plans for the paywall catalog', async () => {
  const deps = createDependencies();
  const service = new SubscriptionService(deps);

  const result = await service.listPlans();

  assert.equal(result.data.length, 2);
  assert.deepEqual(
    result.data.map((plan) => plan.id),
    ['plan-1', 'plan-2'],
  );
  assert.equal(result.data[0].status, 'ACTIVE');
  assert.equal(result.data[1].price, 999000);
});

test('SubscriptionService handles webhook idempotently', async () => {
  const deps = createDependencies();
  const service = new SubscriptionService(deps);

  await service.checkout({
    userId: 'user-1',
    request: {
      planId: 'plan-1',
      provider: 'WEB_GATEWAY',
    },
  });

  const subscription = [...deps.repoState.subscriptions.values()][0];
  assert.ok(subscription);

  const event = {
    provider: 'WEB_GATEWAY' as const,
    eventType: 'SUBSCRIPTION_CREATED' as const,
    billingReference: 'billing-ref-1',
    subscriptionId: subscription.id,
    checkoutSessionId: subscription.checkoutSessionId ?? undefined,
    occurredAt: '2026-05-11T00:10:00.000Z',
    payload: {},
  };

  const first = await service.handleWebhook(event);
  const second = await service.handleWebhook(event);

  assert.equal(first.accepted, true);
  assert.equal(first.applied, true);
  assert.equal(second.accepted, false);
  assert.equal(second.applied, false);
});

test('SubscriptionService maps subscription detail status and entitlement to API contract', async () => {
  const deps = createDependencies();
  deps.repoState.details.set('user-1-detail', {
    id: 'user-1-detail',
    status: 'active',
    planId: 'plan-1',
    planName: 'Premium Monthly',
    planPrice: '99000',
    planDurationDays: 30,
    planStatus: 'ACTIVE',
    billingProvider: 'WEB_GATEWAY',
    billingStatus: 'PAID',
    billingReference: 'billing-ref-1',
    checkoutSessionId: 'checkout-1',
    lastBillingAt: new Date('2026-05-11T00:00:00.000Z'),
    nextBillingAt: new Date('2026-06-11T00:00:00.000Z'),
    canAccessPremium: true,
    expiresAt: new Date('2026-06-11T00:00:00.000Z'),
    startAt: new Date('2026-05-11T00:00:00.000Z'),
    endAt: new Date('2026-06-11T00:00:00.000Z'),
    createdAt: new Date('2026-05-11T00:00:00.000Z'),
    updatedAt: new Date('2026-05-11T00:00:00.000Z'),
  });
  const service = new SubscriptionService(deps);

  const result = await service.getMySubscription('user-1');

  assert.ok(result);
  assert.equal(result?.status, 'ACTIVE');
  assert.equal(result?.entitlement.canAccessPremium, true);
  assert.equal(result?.entitlement.expiresAt, '2026-06-11T00:00:00.000Z');
  assert.equal(result?.entitlement.status, 'ACTIVE');
});

test('SubscriptionService marks expired subscription entitlement as locked after expiry', async () => {
  const deps = createDependencies();
  deps.repoState.details.set('user-1-detail', {
    id: 'user-1-detail',
    status: 'active',
    planId: 'plan-1',
    planName: 'Premium Monthly',
    planPrice: '99000',
    planDurationDays: 30,
    planStatus: 'ACTIVE',
    billingProvider: 'WEB_GATEWAY',
    billingStatus: 'PAID',
    billingReference: 'billing-ref-1',
    checkoutSessionId: 'checkout-1',
    lastBillingAt: new Date('2026-04-11T00:00:00.000Z'),
    nextBillingAt: new Date('2026-05-11T00:00:00.000Z'),
    canAccessPremium: true,
    expiresAt: new Date('2026-05-01T00:00:00.000Z'),
    startAt: new Date('2026-04-01T00:00:00.000Z'),
    endAt: new Date('2026-05-01T00:00:00.000Z'),
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-15T00:00:00.000Z'),
  });
  const service = new SubscriptionService(deps);

  const result = await service.getMySubscription('user-1');

  assert.ok(result);
  assert.equal(result?.status, 'ACTIVE');
  assert.equal(result?.entitlement.canAccessPremium, false);
  assert.equal(result?.entitlement.status, 'EXPIRED');
  assert.equal(result?.flowState, 'PAYWALL');
});

test('SubscriptionService returns failed verification for expired entitlement', async () => {
  const deps = createDependencies();
  deps.repoState.details.set('user-1-detail', {
    id: 'user-1-detail',
    status: 'active',
    planId: 'plan-1',
    planName: 'Premium Monthly',
    planPrice: '99000',
    planDurationDays: 30,
    planStatus: 'ACTIVE',
    billingProvider: 'WEB_GATEWAY',
    billingStatus: 'PAID',
    billingReference: 'billing-ref-1',
    checkoutSessionId: 'checkout-1',
    lastBillingAt: new Date('2026-04-11T00:00:00.000Z'),
    nextBillingAt: new Date('2026-05-11T00:00:00.000Z'),
    canAccessPremium: true,
    expiresAt: new Date('2026-05-01T00:00:00.000Z'),
    startAt: new Date('2026-04-01T00:00:00.000Z'),
    endAt: new Date('2026-05-01T00:00:00.000Z'),
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-15T00:00:00.000Z'),
  });
  const service = new SubscriptionService(deps);

  const result = await service.verifySubscription('user-1');

  assert.ok(result);
  assert.equal(result?.status, 'FAILED');
  assert.equal(result?.entitlement?.status, 'EXPIRED');
  assert.equal(result?.message, 'Subscription expired');
  assert.equal(result?.nextPollAfterMs, undefined);
});

test('SubscriptionService does not re-grant an expired subscription when the same receipt is verified again', async () => {
  const deps = createDependencies();
  deps.repoState.subscriptions.set('sub-1', {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-1',
    status: 'expired',
    startAt: new Date('2026-04-01T00:00:00.000Z'),
    endAt: new Date('2026-05-01T00:00:00.000Z'),
    provider: 'web_gateway',
    providerSubscriptionId: 'provider-sub-1',
    billingProvider: 'WEB_GATEWAY',
    billingStatus: 'PAID',
    billingReference: 'receipt-token-1',
    checkoutSessionId: 'checkout-1',
    lastBillingAt: new Date('2026-04-11T00:00:00.000Z'),
    nextBillingAt: new Date('2026-05-11T00:00:00.000Z'),
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-15T00:00:00.000Z'),
  });
  deps.repoState.details.set('user-1-detail', {
    id: 'user-1-detail',
    status: 'expired',
    planId: 'plan-1',
    planName: 'Premium Monthly',
    planPrice: '99000',
    planDurationDays: 30,
    planStatus: 'ACTIVE',
    billingProvider: 'WEB_GATEWAY',
    billingStatus: 'PAID',
    billingReference: 'receipt-token-1',
    checkoutSessionId: 'checkout-1',
    lastBillingAt: new Date('2026-04-11T00:00:00.000Z'),
    nextBillingAt: new Date('2026-05-11T00:00:00.000Z'),
    canAccessPremium: false,
    expiresAt: new Date('2026-05-01T00:00:00.000Z'),
    startAt: new Date('2026-04-01T00:00:00.000Z'),
    endAt: new Date('2026-05-01T00:00:00.000Z'),
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-15T00:00:00.000Z'),
  });
  const service = new SubscriptionService(deps);

  const result = await service.verifySubscription('user-1', {
    receiptToken: 'receipt-token-1',
    provider: 'WEB_GATEWAY',
    platform: 'web',
  });

  assert.ok(result);
  assert.equal(result?.status, 'FAILED');
  assert.equal(result?.entitlement?.status, 'EXPIRED');
  assert.equal(deps.repoState.subscriptions.get('sub-1')?.status, 'expired');
  assert.equal(deps.repoState.subscriptions.get('sub-1')?.billingReference, 'receipt-token-1');
});
