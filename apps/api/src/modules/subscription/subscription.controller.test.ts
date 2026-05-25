import assert from 'node:assert/strict';
import test from 'node:test';

import { SubscriptionController } from './subscription.controller.js';
import type { SubscriptionService, SubscriptionWebhookResult } from './subscription.service.js';
import type {
  SubscriptionCheckoutRequestDto,
  SubscriptionDetailDto,
  SubscriptionPlanCatalogDto,
  SubscriptionVerifyRequestDto,
  SubscriptionWebhookEventDto,
} from './subscription.dto.js';

function createSubscriptionServiceStub(overrides: Partial<SubscriptionService> = {}): SubscriptionService {
  const subscription: SubscriptionDetailDto = {
    id: 'sub-1',
    status: 'ACTIVE',
    plan: {
      id: 'plan-1',
      name: 'Premium',
      price: 99000,
      durationDays: 30,
      status: 'ACTIVE',
    },
    billing: {
      provider: 'WEB_GATEWAY',
      status: 'PAID',
      reference: 'billing-1',
      checkoutSessionId: 'checkout-1',
      lastBillingAt: '2026-05-11T00:00:00.000Z',
      nextBillingAt: '2026-06-11T00:00:00.000Z',
    },
    entitlement: {
      status: 'ACTIVE',
      canAccessPremium: true,
      expiresAt: '2026-06-11T00:00:00.000Z',
      checkedAt: '2026-05-11T00:00:00.000Z',
      source: 'subscription',
    },
    startAt: '2026-05-11T00:00:00.000Z',
    endAt: '2026-06-11T00:00:00.000Z',
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
  };

  return {
    async getMySubscription(userId: string) {
      return userId === 'user-1' ? subscription : null;
    },
    async listPlans(): Promise<SubscriptionPlanCatalogDto> {
      return {
        data: [
          {
            id: 'plan-1',
            name: 'Premium',
            price: 99000,
            durationDays: 30,
            status: 'ACTIVE',
          },
        ],
      };
    },
    async verifySubscription(userId: string) {
      return userId === 'user-1'
        ? {
            status: 'SUCCEEDED',
            checkedAt: '2026-05-11T00:00:00.000Z',
            subscription,
            entitlement: subscription.entitlement,
          }
        : null;
    },
    async verifySubscriptionWithContext(
      userId: string,
      request: SubscriptionVerifyRequestDto,
    ) {
      return userId === 'user-1' && request.checkoutSessionId === 'checkout-1'
        ? {
            status: 'SUCCEEDED',
            checkedAt: '2026-05-11T00:00:00.000Z',
            subscription,
            entitlement: subscription.entitlement,
          }
        : null;
    },
    async checkout(context: { userId: string; request: SubscriptionCheckoutRequestDto }) {
      return {
        paymentAttemptId: `checkout-${context.userId}`,
        checkoutSessionId: `checkout-${context.userId}`,
        plan: {
          id: context.request.planId,
          name: 'Premium',
          price: 99000,
          durationDays: 30,
          status: 'ACTIVE',
        },
        provider: context.request.provider,
        redirectUrl: 'https://billing.example.com/checkout',
        status: 'INITIATED',
        flowState: 'PAYMENT_PROCESSING',
        returnUrl: context.request.returnUrl,
        trialRequested: context.request.trialRequested,
        expiresAt: '2026-05-11T00:15:00.000Z',
      };
    },
    async handleWebhook(
      event: SubscriptionWebhookEventDto,
      signature?: string,
    ): Promise<SubscriptionWebhookResult> {
      return {
        accepted: true,
        applied: event.eventType === 'SUBSCRIPTION_CREATED',
        subscription: event.eventType === 'SUBSCRIPTION_CREATED' ? subscription : null,
      };
    },
    ...overrides,
  } as SubscriptionService;
}

test('SubscriptionController delegates getMySubscription to the service', async () => {
  const controller = new SubscriptionController(createSubscriptionServiceStub());

  const result = await controller.getMySubscription('user-1');

  assert.ok(result);
  assert.equal(result?.id, 'sub-1');
  assert.equal(result?.billing.provider, 'WEB_GATEWAY');
});

test('SubscriptionController delegates listPlans to the service', async () => {
  const controller = new SubscriptionController(createSubscriptionServiceStub());

  const result = await controller.listPlans();

  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].id, 'plan-1');
});

test('SubscriptionController delegates verifySubscription to the service', async () => {
  const controller = new SubscriptionController(createSubscriptionServiceStub());

  const result = await controller.verifySubscription('user-1');

  assert.ok(result);
  assert.equal(result?.status, 'SUCCEEDED');
  assert.equal(result?.subscription?.status, 'ACTIVE');
  assert.equal(result?.entitlement?.canAccessPremium, true);
});

test('SubscriptionController delegates verifySubscriptionWithContext to the service', async () => {
  const controller = new SubscriptionController(createSubscriptionServiceStub());

  const result = await controller.verifySubscriptionWithContext('user-1', {
    checkoutSessionId: 'checkout-1',
    receiptToken: 'receipt-1',
  });

  assert.ok(result);
  assert.equal(result?.subscription?.id, 'sub-1');
});

test('SubscriptionController delegates checkout with userId and request payload', async () => {
  const controller = new SubscriptionController(createSubscriptionServiceStub());

  const request: SubscriptionCheckoutRequestDto = {
    planId: 'plan-1',
    provider: 'WEB_GATEWAY',
    returnUrl: 'https://app.example.com/billing/return',
  };

  const result = await controller.checkout('user-1', request);

  assert.equal(result.checkoutSessionId, 'checkout-user-1');
  assert.equal(result.provider, 'WEB_GATEWAY');
  assert.equal(result.redirectUrl, 'https://billing.example.com/checkout');
});

test('SubscriptionController delegates webhook events to the service', async () => {
  const controller = new SubscriptionController(createSubscriptionServiceStub());

  const event: SubscriptionWebhookEventDto = {
    provider: 'WEB_GATEWAY',
    eventType: 'SUBSCRIPTION_CREATED',
    billingReference: 'billing-1',
    checkoutSessionId: 'checkout-1',
    subscriptionId: 'provider-sub-1',
    occurredAt: '2026-05-11T00:00:00.000Z',
    payload: {
      source: 'test',
    },
  };

  const result = await controller.handleWebhook(event, 'signature');

  assert.equal(result.accepted, true);
  assert.equal(result.applied, true);
  assert.equal(result.subscription?.id, 'sub-1');
});
