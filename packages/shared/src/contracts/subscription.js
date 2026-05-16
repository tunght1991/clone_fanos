export const SUBSCRIPTION_STATUSES = ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED'];
export const BILLING_STATUSES = ['INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'];
export const BILLING_PROVIDERS = ['IAP', 'GOOGLE_PLAY', 'WEB_GATEWAY'];
export const SUBSCRIPTION_FLOW_STATES = [
    'PAYWALL',
    'SELECT_PLAN',
    'PAYMENT_PROCESSING',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'VERIFYING_ENTITLEMENT',
    'PENDING_VERIFICATION',
    'UNLOCKED',
];
export const SUBSCRIPTION_VERIFICATION_STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED'];
export const SUBSCRIPTION_ENTITLEMENT_STATUSES = ['LOCKED', 'PENDING', 'TRIAL', 'ACTIVE', 'EXPIRED'];
export const SUBSCRIPTION_FLOW_TRANSITIONS = {
    PAYWALL: ['SELECT_PLAN'],
    SELECT_PLAN: ['PAYMENT_PROCESSING', 'PAYWALL'],
    PAYMENT_PROCESSING: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED'],
    PAYMENT_SUCCESS: ['VERIFYING_ENTITLEMENT', 'PENDING_VERIFICATION', 'PAYMENT_FAILED'],
    PAYMENT_FAILED: ['PAYWALL', 'SELECT_PLAN'],
    VERIFYING_ENTITLEMENT: ['UNLOCKED', 'PENDING_VERIFICATION', 'PAYMENT_FAILED'],
    PENDING_VERIFICATION: ['VERIFYING_ENTITLEMENT', 'UNLOCKED', 'PAYMENT_FAILED', 'PAYWALL'],
    UNLOCKED: ['PAYWALL'],
};
export function canTransitionSubscriptionFlow(from, to) {
    return SUBSCRIPTION_FLOW_TRANSITIONS[from].includes(to);
}
export function resolveSubscriptionFlowState(snapshot) {
    if (snapshot.entitlementStatus === 'ACTIVE' || snapshot.entitlementStatus === 'TRIAL' || snapshot.canAccessPremium) {
        return 'UNLOCKED';
    }
    if (snapshot.entitlementStatus === 'EXPIRED') {
        return 'PAYWALL';
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
export function resolveSubscriptionEntitlementStatus(snapshot) {
    const expiresAt = snapshot.expiresAt ? new Date(snapshot.expiresAt).getTime() : null;
    const referenceAt = snapshot.referenceAt === undefined ? Date.now() : new Date(snapshot.referenceAt).getTime();
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
export function resolveSubscriptionEntitlement(snapshot) {
    const status = resolveSubscriptionEntitlementStatus(snapshot);
    const canAccessPremium = status === 'ACTIVE' || status === 'TRIAL';
    return {
        status,
        canAccessPremium,
        isTrial: status === 'TRIAL' ? true : snapshot.isTrial,
        expiresAt: snapshot.expiresAt ?? undefined,
        checkedAt: snapshot.checkedAt ?? new Date().toISOString(),
        source: snapshot.source ?? 'subscription',
    };
}
export const SUBSCRIPTION_PLAN_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
export const SUBSCRIPTION_CHECKOUT_STATUSES = ['INITIATED', 'PENDING', 'REQUIRES_ACTION'];
export const SUBSCRIPTION_WEBHOOK_EVENT_TYPES = [
    'SUBSCRIPTION_CREATED',
    'SUBSCRIPTION_RENEWED',
    'SUBSCRIPTION_CANCELLED',
    'PAYMENT_FAILED',
    'PAYMENT_REFUNDED',
];
