import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/features/subscription/data/mock_subscription_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_models.dart';

void main() {
  test('MockSubscriptionRepository exposes active subscription plans for paywall', () async {
    final repository = MockSubscriptionRepository();

    final plans = await repository.getPlans(
      userId: 'user-1',
      accessToken: 'token-1',
    );

    expect(plans, hasLength(2));
    expect(plans.first.id, 'premium-monthly');
    expect(plans.last.id, 'premium-yearly');
  });

  test('MockSubscriptionRepository seeds a locked subscription', () async {
    final repository = MockSubscriptionRepository();

    final state = await repository.getMySubscription(
      userId: 'user-1',
      accessToken: 'token-1',
    );

    expect(state, isNotNull);
    expect(state!.entitlement.status, 'LOCKED');
    expect(state!.entitlement.canAccessPremium, isFalse);
    expect(state.status, 'EXPIRED');
  });

  test('MockSubscriptionRepository checkout unlocks premium access', () async {
    final repository = MockSubscriptionRepository();

    final checkout = await repository.checkout(
      request: const SubscriptionCheckoutRequest(
        planId: 'premium-monthly',
        provider: 'WEB_GATEWAY',
      ),
      userId: 'user-1',
      accessToken: 'token-1',
    );

    expect(checkout.status, 'INITIATED');
    expect(checkout.paymentAttemptId, checkout.checkoutSessionId);

    final pendingState = await repository.getMySubscription(
      userId: 'user-1',
      accessToken: 'token-1',
    );

    expect(pendingState, isNotNull);
    expect(pendingState!.flowState, SubscriptionFlowState.paymentProcessing.toString());

    final state = await repository.verifySubscription(
      userId: 'user-1',
      accessToken: 'token-1',
      request: SubscriptionVerifyRequest(
        checkoutSessionId: checkout.checkoutSessionId,
        receiptToken: 'receipt-token-1',
        provider: 'WEB_GATEWAY',
        platform: 'web',
      ),
    );

    expect(state, isNotNull);
    expect(state!.entitlement.canAccessPremium, isTrue);
    expect(state.entitlement.status, 'ACTIVE');
    expect(state.plan.status, 'ACTIVE');
    expect(state.flowState, 'UNLOCKED');
  });
}
