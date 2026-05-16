export declare const SUBSCRIPTION_STATUSES: readonly ["PENDING", "ACTIVE", "EXPIRED", "CANCELLED", "FAILED"];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export declare const BILLING_STATUSES: readonly ["INITIATED", "PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"];
export type BillingStatus = (typeof BILLING_STATUSES)[number];
export declare const BILLING_PROVIDERS: readonly ["IAP", "GOOGLE_PLAY", "WEB_GATEWAY"];
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];
export declare const SUBSCRIPTION_FLOW_STATES: readonly ["PAYWALL", "SELECT_PLAN", "PAYMENT_PROCESSING", "PAYMENT_SUCCESS", "PAYMENT_FAILED", "VERIFYING_ENTITLEMENT", "PENDING_VERIFICATION", "UNLOCKED"];
export type SubscriptionFlowState = (typeof SUBSCRIPTION_FLOW_STATES)[number];
export declare const SUBSCRIPTION_VERIFICATION_STATUSES: readonly ["PENDING", "SUCCEEDED", "FAILED"];
export type SubscriptionVerificationStatus = (typeof SUBSCRIPTION_VERIFICATION_STATUSES)[number];
export declare const SUBSCRIPTION_ENTITLEMENT_STATUSES: readonly ["LOCKED", "PENDING", "TRIAL", "ACTIVE", "EXPIRED"];
export type SubscriptionEntitlementStatus = (typeof SUBSCRIPTION_ENTITLEMENT_STATUSES)[number];
export declare const SUBSCRIPTION_FLOW_TRANSITIONS: {
    readonly PAYWALL: readonly ["SELECT_PLAN"];
    readonly SELECT_PLAN: readonly ["PAYMENT_PROCESSING", "PAYWALL"];
    readonly PAYMENT_PROCESSING: readonly ["PAYMENT_SUCCESS", "PAYMENT_FAILED"];
    readonly PAYMENT_SUCCESS: readonly ["VERIFYING_ENTITLEMENT", "PENDING_VERIFICATION", "PAYMENT_FAILED"];
    readonly PAYMENT_FAILED: readonly ["PAYWALL", "SELECT_PLAN"];
    readonly VERIFYING_ENTITLEMENT: readonly ["UNLOCKED", "PENDING_VERIFICATION", "PAYMENT_FAILED"];
    readonly PENDING_VERIFICATION: readonly ["VERIFYING_ENTITLEMENT", "UNLOCKED", "PAYMENT_FAILED", "PAYWALL"];
    readonly UNLOCKED: readonly ["PAYWALL"];
};
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
export declare function canTransitionSubscriptionFlow(from: SubscriptionFlowState, to: SubscriptionFlowState): boolean;
export declare function resolveSubscriptionFlowState(snapshot: SubscriptionFlowSnapshot): SubscriptionFlowState;
export declare function resolveSubscriptionEntitlementStatus(snapshot: SubscriptionEntitlementSnapshot): SubscriptionEntitlementStatus;
export declare function resolveSubscriptionEntitlement(snapshot: SubscriptionEntitlementSnapshot): SubscriptionEntitlementDto;
export declare const SUBSCRIPTION_PLAN_STATUSES: readonly ["ACTIVE", "INACTIVE", "ARCHIVED"];
export type SubscriptionPlanStatus = (typeof SUBSCRIPTION_PLAN_STATUSES)[number];
export declare const SUBSCRIPTION_CHECKOUT_STATUSES: readonly ["INITIATED", "PENDING", "REQUIRES_ACTION"];
export type SubscriptionCheckoutStatus = (typeof SUBSCRIPTION_CHECKOUT_STATUSES)[number];
export declare const SUBSCRIPTION_WEBHOOK_EVENT_TYPES: readonly ["SUBSCRIPTION_CREATED", "SUBSCRIPTION_RENEWED", "SUBSCRIPTION_CANCELLED", "PAYMENT_FAILED", "PAYMENT_REFUNDED"];
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
