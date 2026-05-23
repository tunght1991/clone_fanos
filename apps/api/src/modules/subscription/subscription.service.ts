import { createHash, randomUUID } from 'node:crypto';

import { resolveSubscriptionEntitlement, resolveSubscriptionFlowState } from '../../../../../packages/shared/src/contracts/subscription.js';
import type { SubscriptionPolicy } from './subscription.types.js';
import type {
  BillingStatus,
  SubscriptionCheckoutRequestDto,
  SubscriptionCheckoutResponseDto,
  SubscriptionDetailDto,
  SubscriptionPlanCatalogDto,
  SubscriptionReceiptVerificationDto,
  SubscriptionVerifyRequestDto,
  SubscriptionWebhookEventDto,
  SubscriptionStatus,
} from './subscription.dto.js';
import type { SubscriptionDetailRow, SubscriptionRepositoryBundle } from './subscription.repository.js';

export interface SubscriptionServiceDependencies {
  policy: SubscriptionPolicy;
  repositories: SubscriptionRepositoryBundle;
}

export interface SubscriptionCheckoutContext {
  userId: string;
  request: SubscriptionCheckoutRequestDto;
}

export interface SubscriptionWebhookResult {
  accepted: boolean;
  applied: boolean;
  subscription?: SubscriptionDetailDto | null;
}

export class SubscriptionService {
  constructor(private readonly dependencies: SubscriptionServiceDependencies) {}

  async getMySubscription(userId: string): Promise<SubscriptionDetailDto | null> {
    const detail = await this.dependencies.repositories.subscriptionRepository.findLatestDetailByUserId(userId);
    if (!detail) {
      return null;
    }

    return this.mapSubscriptionDetail(detail);
  }

  async listPlans(): Promise<SubscriptionPlanCatalogDto> {
    const plans = await this.dependencies.repositories.subscriptionPlanRepository.findActivePlans();

    return {
      data: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: Number(plan.price),
        durationDays: plan.durationDays,
        status: plan.status,
      })),
    };
  }

  async verifySubscription(userId: string, request?: SubscriptionVerifyRequestDto): Promise<SubscriptionReceiptVerificationDto | null> {
    const checkedAt = new Date();
    const verificationReference = this.resolveVerificationReference(request);
    const hasVerificationProof = Boolean(request?.receiptToken || request?.transactionId || request?.orderId);
    const verificationIdempotencyKey =
      request && verificationReference && hasVerificationProof
        ? this.buildReceiptVerificationIdempotencyKey(userId, request, verificationReference)
        : null;

    if (request && verificationReference && hasVerificationProof && verificationIdempotencyKey) {
      await this.dependencies.repositories.subscriptionRepository.recordReceiptVerification({
        userId,
        provider: request.provider ?? this.dependencies.policy.provider,
        idempotencyKey: verificationIdempotencyKey,
        checkoutSessionId: request.checkoutSessionId,
        receiptToken: request.receiptToken,
        transactionId: request.transactionId,
        orderId: request.orderId,
        payloadJson: request as Record<string, unknown>,
        occurredAt: checkedAt,
      });

      const candidate =
        (request.checkoutSessionId
          ? await this.dependencies.repositories.subscriptionRepository.findByCheckoutSessionId(request.checkoutSessionId)
          : null) ?? (await this.dependencies.repositories.subscriptionRepository.findLatestByUserId(userId));

      if (candidate) {
        if (String(candidate.status).toLowerCase() === 'active') {
          await this.dependencies.repositories.subscriptionRepository.markReceiptVerificationProcessed(verificationIdempotencyKey);
          return this.buildReceiptVerificationResponse(userId, checkedAt);
        }

        if (candidate.billingReference === verificationReference) {
          await this.dependencies.repositories.subscriptionRepository.markReceiptVerificationProcessed(verificationIdempotencyKey);
          return this.buildReceiptVerificationResponse(userId, checkedAt);
        }

        if (String(candidate.status).toLowerCase() !== 'active') {
          await this.dependencies.repositories.subscriptionRepository.updateAfterWebhook({
            subscriptionId: candidate.id,
            billingProvider: request.provider ?? candidate.billingProvider,
            billingStatus: 'PAID',
            billingReference: verificationReference,
            providerSubscriptionId: request.transactionId ?? request.orderId,
            checkoutSessionId: request.checkoutSessionId ?? candidate.checkoutSessionId ?? undefined,
            lastBillingAt: new Date(),
            nextBillingAt: candidate.endAt,
            status: 'ACTIVE',
          });
        }
      }

      await this.dependencies.repositories.subscriptionRepository.markReceiptVerificationProcessed(verificationIdempotencyKey);
    }

    return this.buildReceiptVerificationResponse(userId, checkedAt);
  }

  async checkout(context: SubscriptionCheckoutContext): Promise<SubscriptionCheckoutResponseDto> {
    const { request, userId } = context;
    this.assertProviderAllowed(request.provider);

    const plan = await this.dependencies.repositories.subscriptionRepository.findPlanById(request.planId);
    if (!plan) {
      throw new Error(`Subscription plan ${request.planId} not found`);
    }

    if (plan.status !== 'ACTIVE') {
      throw new Error(`Subscription plan ${request.planId} is not active`);
    }

    const checkoutSessionId = `sub_chk_${randomUUID().replaceAll('-', '')}`;
    const startAt = new Date();
    const endAt = new Date(startAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    await this.dependencies.repositories.subscriptionRepository.createPendingSubscription({
      userId,
      planId: plan.id,
      billingProvider: request.provider,
      checkoutSessionId,
      startAt,
      endAt,
      provider: this.mapProviderLabel(request.provider),
    });

    return {
      paymentAttemptId: checkoutSessionId,
      checkoutSessionId,
      plan: {
        id: plan.id,
        name: plan.name,
        price: Number(plan.price),
        durationDays: plan.durationDays,
        status: plan.status,
      },
      provider: request.provider,
      redirectUrl: this.buildRedirectUrl(request.provider, checkoutSessionId, request.returnUrl),
      status: request.provider === 'WEB_GATEWAY' ? 'REQUIRES_ACTION' : 'INITIATED',
      flowState: 'PAYMENT_PROCESSING',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      returnUrl: request.returnUrl,
      trialRequested: request.trialRequested,
    };
  }

  async handleWebhook(event: SubscriptionWebhookEventDto): Promise<SubscriptionWebhookResult> {
    const idempotencyKey = this.buildWebhookIdempotencyKey(event);
    const accepted = await this.dependencies.repositories.subscriptionRepository.recordWebhookEvent({
      provider: event.provider,
      eventType: event.eventType,
      billingReference: event.billingReference,
      idempotencyKey,
      subscriptionId: event.subscriptionId,
      checkoutSessionId: event.checkoutSessionId,
      payloadJson: event.payload,
      occurredAt: new Date(event.occurredAt),
    });

    if (!accepted) {
      return {
        accepted: false,
        applied: false,
      };
    }

    const subscription =
      (event.checkoutSessionId
        ? await this.dependencies.repositories.subscriptionRepository.findByCheckoutSessionId(event.checkoutSessionId)
        : null) ??
      (await this.dependencies.repositories.subscriptionRepository.findByBillingReference(event.billingReference)) ??
      (event.subscriptionId ? await this.dependencies.repositories.subscriptionRepository.findById(event.subscriptionId) : null);

    if (!subscription) {
      await this.dependencies.repositories.subscriptionRepository.markWebhookProcessed(idempotencyKey);
      return {
        accepted: true,
        applied: false,
      };
    }

    const occurredAt = new Date(event.occurredAt);
    const state = this.mapWebhookToState(event.eventType, occurredAt);
    const updated = await this.dependencies.repositories.subscriptionRepository.updateAfterWebhook({
      subscriptionId: subscription.id,
      billingProvider: event.provider,
      billingStatus: state.billingStatus,
      billingReference: event.billingReference,
      providerSubscriptionId: event.subscriptionId,
      checkoutSessionId: event.checkoutSessionId,
      lastBillingAt: state.lastBillingAt,
      nextBillingAt: state.nextBillingAt ?? subscription.endAt,
      status: state.status,
    });

    await this.dependencies.repositories.subscriptionRepository.markWebhookProcessed(idempotencyKey);

    return {
      accepted: true,
      applied: true,
      subscription: await this.dependencies.repositories.subscriptionRepository
        .findLatestDetailByUserId(updated.userId)
        .then((detail) => (detail ? this.mapSubscriptionDetail(detail) : null)),
    };
  }

  private assertProviderAllowed(provider: SubscriptionCheckoutRequestDto['provider']): void {
    if (provider !== this.dependencies.policy.provider) {
      throw new Error(
        `Subscription provider ${provider} is not allowed in ${this.dependencies.policy.environment} environment`,
      );
    }
  }

  private buildRedirectUrl(
    provider: SubscriptionCheckoutRequestDto['provider'],
    checkoutSessionId: string,
    returnUrl?: string,
  ): string | undefined {
    if (provider !== 'WEB_GATEWAY') {
      return undefined;
    }

    const url = new URL('https://billing.example.com/checkout');
    url.searchParams.set('checkoutSessionId', checkoutSessionId);
    if (returnUrl) {
      url.searchParams.set('returnUrl', returnUrl);
    }

    return url.toString();
  }

  private buildWebhookIdempotencyKey(event: SubscriptionWebhookEventDto): string {
    return createHash('sha256')
      .update(
        [
          event.provider,
          event.eventType,
          event.billingReference,
          event.subscriptionId ?? '',
          event.checkoutSessionId ?? '',
          event.occurredAt,
        ].join('|'),
      )
      .digest('hex');
  }

  private resolveVerificationReference(request?: SubscriptionVerifyRequestDto): string | null {
    if (!request) {
      return null;
    }

    return request.receiptToken ?? request.transactionId ?? request.orderId ?? request.checkoutSessionId ?? null;
  }

  private buildReceiptVerificationIdempotencyKey(
    userId: string,
    request: SubscriptionVerifyRequestDto,
    verificationReference: string,
  ): string {
    return createHash('sha256')
      .update(
        [
          userId,
          request.provider ?? this.dependencies.policy.provider,
          verificationReference,
        ].join('|'),
      )
      .digest('hex');
  }

  private async buildReceiptVerificationResponse(
    userId: string,
    checkedAt: Date,
  ): Promise<SubscriptionReceiptVerificationDto | null> {
    const active = await this.dependencies.repositories.subscriptionRepository.findActiveDetailByUserId(userId);
    if (active) {
      const subscription = this.mapSubscriptionDetail(active);
      return this.buildReceiptVerificationDto(subscription, checkedAt);
    }

    const latest = await this.getMySubscription(userId);
    if (!latest) {
      return null;
    }

    return this.buildReceiptVerificationDto(latest, checkedAt);
  }

  private buildReceiptVerificationDto(
    subscription: SubscriptionDetailDto,
    checkedAt: Date,
  ): SubscriptionReceiptVerificationDto {
    return {
      status: subscription.entitlement.canAccessPremium
        ? 'SUCCEEDED'
        : subscription.entitlement.status === 'EXPIRED'
          ? 'FAILED'
          : 'PENDING',
      checkedAt: checkedAt.toISOString(),
      subscription,
      entitlement: subscription.entitlement,
      message: subscription.entitlement.canAccessPremium
        ? undefined
        : subscription.entitlement.status === 'EXPIRED'
          ? 'Subscription expired'
          : 'Subscription verification pending',
      nextPollAfterMs:
        subscription.entitlement.canAccessPremium || subscription.entitlement.status === 'EXPIRED' ? undefined : 15_000,
    };
  }

  private mapWebhookToState(
    eventType: SubscriptionWebhookEventDto['eventType'],
    occurredAt: Date,
  ): {
    billingStatus: BillingStatus;
    status: SubscriptionStatus;
    lastBillingAt?: Date;
    nextBillingAt?: Date;
  } {
    switch (eventType) {
      case 'SUBSCRIPTION_CREATED':
      case 'SUBSCRIPTION_RENEWED':
        return {
          billingStatus: 'PAID',
          status: 'ACTIVE',
          lastBillingAt: occurredAt,
        };
      case 'SUBSCRIPTION_CANCELLED':
        return {
          billingStatus: 'CANCELLED',
          status: 'CANCELLED',
        };
      case 'PAYMENT_FAILED':
        return {
          billingStatus: 'FAILED',
          status: 'FAILED',
        };
      case 'PAYMENT_REFUNDED':
        return {
          billingStatus: 'REFUNDED',
          status: 'EXPIRED',
        };
      default: {
        const unreachable: never = eventType;
        return unreachable;
      }
    }
  }

  private mapSubscriptionDetail(subscription: SubscriptionDetailRow): SubscriptionDetailDto {
    const normalizedStatus = this.normalizeSubscriptionStatus(subscription.status);
    const normalizedBillingStatus = this.normalizeBillingStatus(subscription.billingStatus);
    const entitlement = resolveSubscriptionEntitlement({
      status: normalizedStatus,
      billingStatus: normalizedBillingStatus,
      expiresAt: subscription.expiresAt ? subscription.expiresAt.toISOString() : subscription.endAt.toISOString(),
      checkedAt: subscription.updatedAt.toISOString(),
      source: 'subscription',
      referenceAt: subscription.updatedAt,
    });

    return {
      id: subscription.id,
      status: normalizedStatus,
      plan: {
        id: subscription.planId,
        name: subscription.planName,
        price: Number(subscription.planPrice),
        durationDays: subscription.planDurationDays,
        status: subscription.planStatus,
      },
      billing: {
        provider: subscription.billingProvider,
        status: normalizedBillingStatus,
        reference: subscription.billingReference ?? undefined,
        checkoutSessionId: subscription.checkoutSessionId ?? undefined,
        lastBillingAt: subscription.lastBillingAt?.toISOString(),
        nextBillingAt: subscription.nextBillingAt?.toISOString(),
      },
      entitlement,
      flowState: resolveSubscriptionFlowState({
        status: normalizedStatus,
        billingStatus: normalizedBillingStatus,
        canAccessPremium: entitlement.canAccessPremium,
        entitlementStatus: entitlement.status,
        checkoutSessionId: subscription.checkoutSessionId,
      }),
      startAt: subscription.startAt.toISOString(),
      endAt: subscription.endAt.toISOString(),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }

  private normalizeSubscriptionStatus(status: SubscriptionDetailRow['status']): SubscriptionDetailDto['status'] {
    switch (String(status).toLowerCase()) {
      case 'pending':
        return 'PENDING';
      case 'active':
        return 'ACTIVE';
      case 'expired':
        return 'EXPIRED';
      case 'cancelled':
      case 'canceled':
        return 'CANCELLED';
      case 'failed':
        return 'FAILED';
      default: {
        throw new Error(`Unsupported subscription status ${status}`);
      }
    }
  }

  private normalizeBillingStatus(status: BillingStatus | string): SubscriptionDetailDto['billing']['status'] {
    switch (String(status).toLowerCase()) {
      case 'initiated':
        return 'INITIATED';
      case 'pending':
        return 'PENDING';
      case 'paid':
        return 'PAID';
      case 'failed':
        return 'FAILED';
      case 'refunded':
        return 'REFUNDED';
      case 'cancelled':
      case 'canceled':
        return 'CANCELLED';
      default: {
        throw new Error(`Unsupported billing status ${status}`);
      }
    }
  }

  private mapProviderLabel(provider: SubscriptionCheckoutRequestDto['provider']): string {
    switch (provider) {
      case 'IAP':
        return 'iap';
      case 'GOOGLE_PLAY':
        return 'google_play';
      case 'WEB_GATEWAY':
        return 'web_gateway';
      default: {
        const unreachable: never = provider;
        return unreachable;
      }
    }
  }
}
