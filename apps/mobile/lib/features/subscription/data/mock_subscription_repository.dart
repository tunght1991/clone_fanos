import '../domain/subscription_models.dart';
import '../domain/subscription_repository.dart';

class MockSubscriptionRepository implements SubscriptionRepository {
  final List<SubscriptionPlan> _plans = const [
    SubscriptionPlan(
      id: 'premium-monthly',
      name: 'Premium Monthly',
      price: 99000,
      durationDays: 30,
      status: 'ACTIVE',
    ),
    SubscriptionPlan(
      id: 'premium-yearly',
      name: 'Premium Yearly',
      price: 999000,
      durationDays: 365,
      status: 'ACTIVE',
    ),
  ];

  SubscriptionState _subscription = const SubscriptionState(
    id: 'sub-free',
    status: 'EXPIRED',
    flowState: 'PAYWALL',
    plan: SubscriptionPlan(
      id: 'plan-free',
      name: 'Free',
      price: 0,
      durationDays: 0,
      status: 'ACTIVE',
    ),
    billing: SubscriptionBilling(
      provider: 'WEB_GATEWAY',
      status: 'CANCELLED',
      reference: null,
      checkoutSessionId: null,
      lastBillingAt: null,
      nextBillingAt: null,
    ),
    entitlement: SubscriptionEntitlement(
      status: 'LOCKED',
      canAccessPremium: false,
      isTrial: false,
      expiresAt: null,
      checkedAt: '2026-05-01T00:00:00.000Z',
      source: 'subscription',
    ),
    startAt: '2026-05-01T00:00:00.000Z',
    endAt: '2026-05-31T00:00:00.000Z',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  );

  @override
  Future<List<SubscriptionPlan>> getPlans({
    required String? userId,
    required String? accessToken,
  }) async {
    return _plans;
  }

  @override
  Future<SubscriptionState?> getMySubscription({
    required String? userId,
    required String? accessToken,
  }) async {
    return _subscription;
  }

  @override
  Future<SubscriptionState?> verifySubscription({
    required String? userId,
    required String? accessToken,
    SubscriptionVerifyRequest? request,
  }) async {
    if (request?.checkoutSessionId != null || request?.receiptToken != null || request?.transactionId != null) {
      _subscription = SubscriptionState(
        id: _subscription.id,
        status: 'ACTIVE',
        flowState: SubscriptionFlowState.unlocked.toString(),
        plan: _subscription.plan,
        billing: SubscriptionBilling(
          provider: request?.provider ?? _subscription.billing.provider,
          status: 'PAID',
          reference: request?.receiptToken ?? request?.transactionId ?? request?.orderId ?? request?.checkoutSessionId,
          checkoutSessionId: request?.checkoutSessionId ?? _subscription.billing.checkoutSessionId,
          lastBillingAt: DateTime.now().toUtc().toIso8601String(),
          nextBillingAt: DateTime.now().toUtc().add(const Duration(days: 30)).toIso8601String(),
        ),
        entitlement: SubscriptionEntitlement(
          status: 'ACTIVE',
          canAccessPremium: true,
          isTrial: false,
          expiresAt: DateTime.now().toUtc().add(const Duration(days: 30)).toIso8601String(),
          checkedAt: DateTime.now().toUtc().toIso8601String(),
          source: 'receipt',
        ),
        startAt: _subscription.startAt,
        endAt: DateTime.now().toUtc().add(const Duration(days: 30)).toIso8601String(),
        createdAt: _subscription.createdAt,
        updatedAt: DateTime.now().toUtc().toIso8601String(),
      );
    }

    return _subscription;
  }

  @override
  Future<SubscriptionCheckoutResult> checkout({
    required SubscriptionCheckoutRequest request,
    required String? userId,
    required String? accessToken,
  }) async {
    final now = DateTime.now().toUtc();
    final plan = _plans.firstWhere(
      (item) => item.id == request.planId,
      orElse: () => _plans.first,
    );

    final checkoutSessionId = 'cs-${now.millisecondsSinceEpoch}';
    _subscription = SubscriptionState(
      id: 'sub-${request.planId}',
      status: 'PENDING',
      flowState: SubscriptionFlowState.paymentProcessing.toString(),
      plan: plan,
      billing: SubscriptionBilling(
        provider: request.provider,
        status: 'INITIATED',
        reference: null,
        checkoutSessionId: checkoutSessionId,
        lastBillingAt: null,
        nextBillingAt: null,
      ),
      entitlement: SubscriptionEntitlement(
        status: 'PENDING',
        canAccessPremium: false,
        isTrial: request.trialRequested ?? false,
        expiresAt: null,
        checkedAt: now.toIso8601String(),
        source: 'subscription',
      ),
      startAt: now.toIso8601String(),
      endAt: now.add(Duration(days: plan.durationDays)).toIso8601String(),
      createdAt: now.toIso8601String(),
      updatedAt: now.toIso8601String(),
    );

    return SubscriptionCheckoutResult(
      paymentAttemptId: checkoutSessionId,
      checkoutSessionId: checkoutSessionId,
      plan: plan,
      provider: request.provider,
      redirectUrl: request.returnUrl,
      status: 'INITIATED',
      flowState: SubscriptionFlowState.paymentProcessing.toString(),
      returnUrl: request.returnUrl,
      trialRequested: request.trialRequested,
      expiresAt: now.add(const Duration(minutes: 15)).toIso8601String(),
    );
  }
}
