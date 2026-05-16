import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BILLING_PROVIDERS,
  BILLING_STATUSES,
  SUBSCRIPTION_ENTITLEMENT_STATUSES,
  SUBSCRIPTION_FLOW_TRANSITIONS,
  SUBSCRIPTION_FLOW_STATES,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_VERIFICATION_STATUSES,
  SUBSCRIPTION_WEBHOOK_EVENT_TYPES,
  canTransitionSubscriptionFlow,
  resolveSubscriptionEntitlement,
  resolveSubscriptionEntitlementStatus,
  resolveSubscriptionFlowState,
} from './subscription.js';

test('subscription contract keeps subscription statuses stable', () => {
  assert.deepEqual(SUBSCRIPTION_STATUSES, ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED']);
});

test('subscription contract keeps billing statuses stable', () => {
  assert.deepEqual(BILLING_STATUSES, ['INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED']);
});

test('subscription contract keeps billing providers stable', () => {
  assert.deepEqual(BILLING_PROVIDERS, ['IAP', 'GOOGLE_PLAY', 'WEB_GATEWAY']);
});

test('subscription contract keeps flow states stable', () => {
  assert.deepEqual(SUBSCRIPTION_FLOW_STATES, [
    'PAYWALL',
    'SELECT_PLAN',
    'PAYMENT_PROCESSING',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'VERIFYING_ENTITLEMENT',
    'PENDING_VERIFICATION',
    'UNLOCKED',
  ]);
});

test('subscription contract defines allowed flow transitions', () => {
  assert.deepEqual(SUBSCRIPTION_FLOW_TRANSITIONS.PAYWALL, ['SELECT_PLAN']);
  assert.equal(canTransitionSubscriptionFlow('PAYWALL', 'SELECT_PLAN'), true);
  assert.equal(canTransitionSubscriptionFlow('PAYWALL', 'UNLOCKED'), false);
});

test('subscription contract keeps entitlement statuses stable', () => {
  assert.deepEqual(SUBSCRIPTION_ENTITLEMENT_STATUSES, ['LOCKED', 'PENDING', 'TRIAL', 'ACTIVE', 'EXPIRED']);
});

test('subscription contract resolves entitlement status from subscription snapshot', () => {
  assert.equal(
    resolveSubscriptionEntitlementStatus({
      status: 'PENDING',
      billingStatus: 'INITIATED',
      canAccessPremium: false,
    }),
    'PENDING',
  );
  assert.equal(
    resolveSubscriptionEntitlementStatus({
      status: 'ACTIVE',
      billingStatus: 'PAID',
      canAccessPremium: true,
      isTrial: true,
    }),
    'TRIAL',
  );
});

test('subscription contract resolves entitlement dto from subscription snapshot', () => {
  const entitlement = resolveSubscriptionEntitlement({
    status: 'ACTIVE',
    billingStatus: 'PAID',
    expiresAt: '2026-06-11T00:00:00.000Z',
    checkedAt: '2026-05-11T00:00:00.000Z',
    source: 'subscription',
    referenceAt: '2026-05-11T00:00:00.000Z',
  });

  assert.equal(entitlement.status, 'ACTIVE');
  assert.equal(entitlement.canAccessPremium, true);
  assert.equal(entitlement.checkedAt, '2026-05-11T00:00:00.000Z');
});

test('subscription contract resolves backend subscription state to flow state', () => {
  assert.equal(
    resolveSubscriptionFlowState({
      status: 'PENDING',
      billingStatus: 'INITIATED',
      canAccessPremium: false,
      checkoutSessionId: 'sub_chk_123',
    }),
    'PAYMENT_PROCESSING',
  );
  assert.equal(
    resolveSubscriptionFlowState({
      status: 'ACTIVE',
      billingStatus: 'PAID',
      canAccessPremium: true,
    }),
    'UNLOCKED',
  );
  assert.equal(
    resolveSubscriptionFlowState({
      status: 'ACTIVE',
      billingStatus: 'PAID',
      canAccessPremium: false,
      entitlementStatus: 'EXPIRED',
    }),
    'PAYWALL',
  );
});

test('subscription contract keeps verification statuses stable', () => {
  assert.deepEqual(SUBSCRIPTION_VERIFICATION_STATUSES, ['PENDING', 'SUCCEEDED', 'FAILED']);
});

test('subscription contract keeps webhook event types stable', () => {
  assert.deepEqual(SUBSCRIPTION_WEBHOOK_EVENT_TYPES, [
    'SUBSCRIPTION_CREATED',
    'SUBSCRIPTION_RENEWED',
    'SUBSCRIPTION_CANCELLED',
    'PAYMENT_FAILED',
    'PAYMENT_REFUNDED',
  ]);
});
