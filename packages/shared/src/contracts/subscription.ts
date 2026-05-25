export const SUBSCRIPTION_STATUSES = ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED'] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const BILLING_STATUSES = ['INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'] as const;

export type BillingStatus = (typeof BILLING_STATUSES)[number];

export const BILLING_PROVIDERS = ['IAP', 'GOOGLE_PLAY', 'WEB_GATEWAY'] as const;

export type BillingProvider = (typeof BILLING_PROVIDERS)[number];

export const SUBSCRIPTION_FLOW_STATES = [
  'PAYWALL',
  'SELECT_PLAN',
  'PAYMENT_PROCESSING',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'VERIFYING_ENTITLEMENT',
  'PENDING_VERIFICATION',
  'UNLOCKED',
] as const;

export type SubscriptionFlowState = (typeof SUBSCRIPTION_FLOW_STATES)[number];

export const SUBSCRIPTION_VERIFICATION_STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED'] as const;

export type SubscriptionVerificationStatus = (typeof SUBSCRIPTION_VERIFICATION_STATUSES)[number];

export const SUBSCRIPTION_ENTITLEMENT_STATUSES = ['LOCKED', 'PENDING', 'TRIAL', 'ACTIVE', 'EXPIRED'] as const;

export type SubscriptionEntitlementStatus = (typeof SUBSCRIPTION_ENTITLEMENT_STATUSES)[number];

export const SUBSCRIPTION_FLOW_TRANSITIONS = {
  PAYWALL: ['SELECT_PLAN'],
  SELECT_PLAN: ['PAYMENT_PROCESSING', 'PAYWALL'],
  PAYMENT_PROCESSING: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED'],
  PAYMENT_SUCCESS: ['VERIFYING_ENTITLEMENT', 'PENDING_VERIFICATION', 'PAYMENT_FAILED'],
  PAYMENT_FAILED: ['PAYWALL', 'SELECT_PLAN'],
  VERIFYING_ENTITLEMENT: ['UNLOCKED', 'PENDING_VERIFICATION', 'PAYMENT_FAILED'],
  PENDING_VERIFICATION: ['VERIFYING_ENTITLEMENT', 'UNLOCKED', 'PAYMENT_FAILED', 'PAYWALL'],
  UNLOCKED: ['PAYWALL'],
} as const satisfies Record<SubscriptionFlowState, readonly SubscriptionFlowState[]>;

export interface SubscriptionFlowSnapshot {
  status: SubscriptionStatus;
  billingStatus: BillingStatus;
  canAccessPremium: boolean;
  entitlementStatus?: SubscriptionEntitlementStatus;
  checkoutSessionId?: string | null;
}

export interface SubscriptionEntitlementSnapshot {
  status: SubscriptionStatus;
  billingStatus: BillingStatus;
  isTrial?: boolean;
  expiresAt?: string | null;
  checkedAt?: string | null;
  source?: SubscriptionEntitlementDto['source'];
  referenceAt?: string | Date;
}

export function canTransitionSubscriptionFlow(
  from: SubscriptionFlowState,
  to: SubscriptionFlowState,
): boolean {
  return (SUBSCRIPTION_FLOW_TRANSITIONS[from] as readonly SubscriptionFlowState[]).includes(to);
}

export function resolveSubscriptionFlowState(snapshot: SubscriptionFlowSnapshot): SubscriptionFlowState {
  if (snapshot.entitlementStatus === 'ACTIVE' || snapshot.entitlementStatus === 'TRIAL' || snapshot.canAccessPremium) {
    return 'UNLOCKED';
  }

  if (snapshot.entitlementStatus === 'EXPIRED') {
    return 'PAYWALL';
  }

  if (snapshot.canAccessPremium) {
    return 'UNLOCKED';
  }

  if (snapshot.status === 'FAILED' || snapshot.billingStatus === 'FAILED') {
    return 'PAYMENT_FAILED';
  }

  if (snapshot.billingStatus === 'PAID') {
    return 'VERIFYING_ENTITLEMENT';
  }

  if (snapshot.billingStatus === 'PENDING' || snapshot.billingStatus === 'INITIATED') {
    return snapshot.checkoutSessionId ? 'PAYMENT_PROCESSING' : 'SELECT_PLAN';
  }

  if (snapshot.status === 'ACTIVE') {
    return 'VERIFYING_ENTITLEMENT';
  }

  return 'PAYWALL';
}

export function resolveSubscriptionEntitlementStatus(
  snapshot: SubscriptionEntitlementSnapshot,
): SubscriptionEntitlementStatus {
  const expiresAt = snapshot.expiresAt ? new Date(snapshot.expiresAt).getTime() : null;
  const referenceAt =
    snapshot.referenceAt === undefined ? Date.now() : new Date(snapshot.referenceAt).getTime();

  if (expiresAt !== null && Number.isFinite(expiresAt) && referenceAt >= expiresAt) {
    return 'EXPIRED';
  }

  if (snapshot.status === 'ACTIVE') {
    return snapshot.isTrial ? 'TRIAL' : 'ACTIVE';
  }

  if (snapshot.status === 'EXPIRED' || snapshot.billingStatus === 'REFUNDED') {
    return 'EXPIRED';
  }

  if (snapshot.status === 'PENDING' || snapshot.billingStatus === 'PENDING' || snapshot.billingStatus === 'INITIATED') {
    return 'PENDING';
  }

  return 'LOCKED';
}

export function resolveSubscriptionEntitlement(snapshot: SubscriptionEntitlementSnapshot): SubscriptionEntitlementDto {
  const status = resolveSubscriptionEntitlementStatus(snapshot);
  const canAccessPremium = status === 'ACTIVE' || status === 'TRIAL';

  const entitlement: SubscriptionEntitlementDto = {
    status,
    canAccessPremium,
    checkedAt: snapshot.checkedAt ?? new Date().toISOString(),
    source: snapshot.source ?? 'subscription',
  };

  if (status === 'TRIAL') {
    entitlement.isTrial = true;
  } else if (snapshot.isTrial !== undefined) {
    entitlement.isTrial = snapshot.isTrial;
  }

  if (snapshot.expiresAt !== undefined && snapshot.expiresAt !== null) {
    entitlement.expiresAt = snapshot.expiresAt;
  }

  return entitlement;
}

export const SUBSCRIPTION_PLAN_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

export type SubscriptionPlanStatus = (typeof SUBSCRIPTION_PLAN_STATUSES)[number];

export const SUBSCRIPTION_CHECKOUT_STATUSES = ['INITIATED', 'PENDING', 'REQUIRES_ACTION'] as const;

export type SubscriptionCheckoutStatus = (typeof SUBSCRIPTION_CHECKOUT_STATUSES)[number];

export const SUBSCRIPTION_WEBHOOK_EVENT_TYPES = [
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_RENEWED',
  'SUBSCRIPTION_CANCELLED',
  'PAYMENT_FAILED',
  'PAYMENT_REFUNDED',
] as const;

export type SubscriptionWebhookEventType = (typeof SUBSCRIPTION_WEBHOOK_EVENT_TYPES)[number];

export interface SubscriptionPlanDto {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  status: SubscriptionPlanStatus;
}

export interface SubscriptionBillingDto {
  provider: BillingProvider;
  status: BillingStatus;
  reference?: string;
  checkoutSessionId?: string;
  lastBillingAt?: string;
  nextBillingAt?: string;
}

export interface SubscriptionEntitlementDto {
  status: SubscriptionEntitlementStatus;
  canAccessPremium: boolean;
  isTrial?: boolean;
  expiresAt?: string;
  checkedAt?: string;
  source?: 'subscription' | 'receipt' | 'webhook';
}

export interface SubscriptionDetailDto {
  id: string;
  status: SubscriptionStatus;
  flowState?: SubscriptionFlowState;
  plan: SubscriptionPlanDto;
  billing: SubscriptionBillingDto;
  entitlement: SubscriptionEntitlementDto;
  startAt: string;
  endAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPaymentAttemptDto {
  paymentAttemptId: string;
  checkoutSessionId: string;
  plan: SubscriptionPlanDto;
  provider: BillingProvider;
  status: SubscriptionCheckoutStatus;
  flowState: SubscriptionFlowState;
  redirectUrl?: string;
  expiresAt?: string;
  returnUrl?: string;
  trialRequested?: boolean;
}

export interface SubscriptionCheckoutRequestDto {
  planId: string;
  provider: BillingProvider;
  returnUrl?: string;
  trialRequested?: boolean;
}

export interface SubscriptionCheckoutResponseDto extends SubscriptionPaymentAttemptDto {
  checkoutSessionId: string;
}

export interface SubscriptionPlanCatalogDto {
  data: SubscriptionPlanDto[];
}

export interface SubscriptionReceiptVerificationDto {
  status: SubscriptionVerificationStatus;
  checkedAt?: string;
  entitlement?: SubscriptionEntitlementDto;
  subscription?: SubscriptionDetailDto | null;
  message?: string;
  nextPollAfterMs?: number;
}

export interface SubscriptionVerifyRequestDto {
  provider?: BillingProvider;
  checkoutSessionId?: string;
  receiptToken?: string;
  transactionId?: string;
  orderId?: string;
  platform?: 'ios' | 'android' | 'web';
}

export interface SubscriptionVerifyResponseDto extends SubscriptionReceiptVerificationDto {
}

export interface SubscriptionWebhookEventDto {
  provider: BillingProvider;
  eventType: SubscriptionWebhookEventType;
  billingReference: string;
  subscriptionId?: string;
  checkoutSessionId?: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}
