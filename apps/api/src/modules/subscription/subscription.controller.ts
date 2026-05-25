import type {
  SubscriptionCheckoutRequestDto,
  SubscriptionCheckoutResponseDto,
  SubscriptionDetailDto,
  SubscriptionPlanCatalogDto,
  SubscriptionReceiptVerificationDto,
  SubscriptionVerifyRequestDto,
  SubscriptionWebhookEventDto,
} from './subscription.dto.js';
import type { SubscriptionService, SubscriptionWebhookResult } from './subscription.service.js';

export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async getMySubscription(userId: string): Promise<SubscriptionDetailDto | null> {
    return this.subscriptionService.getMySubscription(userId);
  }

  async listPlans(): Promise<SubscriptionPlanCatalogDto> {
    return this.subscriptionService.listPlans();
  }

  async verifySubscription(userId: string): Promise<SubscriptionReceiptVerificationDto | null> {
    return this.subscriptionService.verifySubscription(userId);
  }

  async verifySubscriptionWithContext(
    userId: string,
    request: SubscriptionVerifyRequestDto,
  ): Promise<SubscriptionReceiptVerificationDto | null> {
    return this.subscriptionService.verifySubscription(userId, request);
  }

  async checkout(
    userId: string,
    request: SubscriptionCheckoutRequestDto,
  ): Promise<SubscriptionCheckoutResponseDto> {
    return this.subscriptionService.checkout({ userId, request });
  }

  async handleWebhook(
    event: SubscriptionWebhookEventDto,
    signature?: string,
  ): Promise<SubscriptionWebhookResult> {
    return this.subscriptionService.handleWebhook(event, signature);
  }
}
