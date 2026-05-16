class SubscriptionFlowState {
  final String value;

  const SubscriptionFlowState._(this.value);

  static const paywall = SubscriptionFlowState._('PAYWALL');
  static const selectPlan = SubscriptionFlowState._('SELECT_PLAN');
  static const paymentProcessing = SubscriptionFlowState._('PAYMENT_PROCESSING');
  static const paymentSuccess = SubscriptionFlowState._('PAYMENT_SUCCESS');
  static const paymentFailed = SubscriptionFlowState._('PAYMENT_FAILED');
  static const verifyingEntitlement = SubscriptionFlowState._('VERIFYING_ENTITLEMENT');
  static const pendingVerification = SubscriptionFlowState._('PENDING_VERIFICATION');
  static const unlocked = SubscriptionFlowState._('UNLOCKED');

  @override
  String toString() => value;
}

class SubscriptionPlan {
  final String id;
  final String name;
  final int price;
  final int durationDays;
  final String status;

  const SubscriptionPlan({
    required this.id,
    required this.name,
    required this.price,
    required this.durationDays,
    required this.status,
  });
}

class SubscriptionBilling {
  final String provider;
  final String status;
  final String? reference;
  final String? checkoutSessionId;
  final String? lastBillingAt;
  final String? nextBillingAt;

  const SubscriptionBilling({
    required this.provider,
    required this.status,
    required this.reference,
    required this.checkoutSessionId,
    required this.lastBillingAt,
    required this.nextBillingAt,
  });
}

class SubscriptionEntitlement {
  final String status;
  final bool canAccessPremium;
  final bool isTrial;
  final String? expiresAt;
  final String? checkedAt;
  final String? source;

  const SubscriptionEntitlement({
    required this.status,
    required this.canAccessPremium,
    required this.isTrial,
    required this.expiresAt,
    required this.checkedAt,
    required this.source,
  });
}

class SubscriptionState {
  final String id;
  final String status;
  final String? flowState;
  final SubscriptionPlan plan;
  final SubscriptionBilling billing;
  final SubscriptionEntitlement entitlement;
  final String startAt;
  final String? endAt;
  final String createdAt;
  final String updatedAt;

  const SubscriptionState({
    required this.id,
    required this.status,
    required this.flowState,
    required this.plan,
    required this.billing,
    required this.entitlement,
    required this.startAt,
    required this.endAt,
    required this.createdAt,
    required this.updatedAt,
  });
}

class SubscriptionVerifyRequest {
  final String? provider;
  final String? checkoutSessionId;
  final String? receiptToken;
  final String? transactionId;
  final String? orderId;
  final String? platform;

  const SubscriptionVerifyRequest({
    this.provider,
    this.checkoutSessionId,
    this.receiptToken,
    this.transactionId,
    this.orderId,
    this.platform,
  });
}

class SubscriptionCheckoutRequest {
  final String planId;
  final String provider;
  final String? returnUrl;
  final bool? trialRequested;

  const SubscriptionCheckoutRequest({
    required this.planId,
    required this.provider,
    this.returnUrl,
    this.trialRequested,
  });
}

class SubscriptionCheckoutResult {
  final String paymentAttemptId;
  final String checkoutSessionId;
  final SubscriptionPlan? plan;
  final String provider;
  final String? redirectUrl;
  final String status;
  final String? flowState;
  final String? returnUrl;
  final bool? trialRequested;
  final String? expiresAt;

  const SubscriptionCheckoutResult({
    required this.paymentAttemptId,
    required this.checkoutSessionId,
    required this.plan,
    required this.provider,
    required this.redirectUrl,
    required this.status,
    required this.flowState,
    required this.returnUrl,
    required this.trialRequested,
    required this.expiresAt,
  });
}
