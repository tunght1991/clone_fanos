import assert from 'node:assert/strict';
import test from 'node:test';

import { SubscriptionHttpController } from './subscription.http.controller.js';
import type { SubscriptionController } from '../modules/subscription/index.js';

function createAuthControllerStub() {
  return {
    async resolvePrincipalFromToken(token: string) {
      return token === 'token-1'
        ? {
            userId: 'user-1',
            email: 'user@example.com',
            displayName: 'User One',
            role: 'user',
          }
        : null;
    },
  };
}

function createSubscriptionControllerStub(): SubscriptionController {
  return {
    async getMySubscription() {
      return null;
    },
    async listPlans() {
      return {
        data: [
          {
            id: 'plan-1',
            name: 'Premium Monthly',
            price: 99000,
            durationDays: 30,
            status: 'ACTIVE',
          },
        ],
      };
    },
    async verifySubscriptionWithContext(userId: string, request: { checkoutSessionId?: string }) {
      return userId === 'user-1' && request.checkoutSessionId === 'checkout-1'
        ? {
            status: 'SUCCEEDED',
            checkedAt: '2026-05-11T00:00:00.000Z',
            subscription: {
              id: 'sub-1',
              status: 'ACTIVE',
              plan: {
                id: 'plan-1',
                name: 'Premium Monthly',
                price: 99000,
                durationDays: 30,
                status: 'ACTIVE',
              },
              billing: {
                provider: 'WEB_GATEWAY',
                status: 'PAID',
                reference: 'receipt-1',
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
            },
            entitlement: {
              status: 'ACTIVE',
              canAccessPremium: true,
              expiresAt: '2026-06-11T00:00:00.000Z',
              checkedAt: '2026-05-11T00:00:00.000Z',
              source: 'subscription',
            },
          }
        : null;
    },
    async verifySubscription() {
      return null;
    },
    async checkout() {
      throw new Error('checkout should not be called in this test');
    },
    async handleWebhook(event: unknown, signature?: string) {
      throw new Error('webhook should not be called in this test');
    },
  } as SubscriptionController;
}

test('SubscriptionHttpController exposes the paywall plan catalog without auth', async () => {
  const controller = new SubscriptionHttpController(createSubscriptionControllerStub(), createAuthControllerStub() as never);

  const result = await controller.listPlans();

  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].id, 'plan-1');
});

test('SubscriptionHttpController verifies subscription using request body payload', async () => {
  const controller = new SubscriptionHttpController(createSubscriptionControllerStub(), createAuthControllerStub() as never);

  const result = await controller.verifySubscription('Bearer token-1', {
    checkoutSessionId: 'checkout-1',
    receiptToken: 'receipt-1',
  });

  assert.equal(result.status, 'SUCCEEDED');
  assert.equal(result.subscription?.id, 'sub-1');
  assert.equal(result.entitlement?.canAccessPremium, true);
});
