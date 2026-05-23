import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/core/network/api_transport.dart';
import 'package:clone_fanos_mobile/features/subscription/data/http_subscription_repository.dart';
import 'package:clone_fanos_mobile/features/subscription/domain/subscription_models.dart';

void main() {
  test('HttpSubscriptionRepository parses plans, checkout and verify responses',
      () async {
    final transport = _FakeTransport();
    final repository = HttpSubscriptionRepository(
      baseUri: Uri.parse('http://localhost:3000'),
      transport: transport,
    );

    final plans = await repository.getPlans(
      userId: 'user-1',
      accessToken: 'access-1',
    );
    final checkout = await repository.checkout(
      request: const SubscriptionCheckoutRequest(
        planId: 'premium-monthly',
        provider: 'mock',
      ),
      userId: 'user-1',
      accessToken: 'access-1',
    );
    final verified = await repository.verifySubscription(
      userId: 'user-1',
      accessToken: 'access-1',
      request: const SubscriptionVerifyRequest(
        checkoutSessionId: 'checkout-1',
        provider: 'mock',
      ),
    );

    expect(plans, hasLength(1));
    expect(plans.single.id, 'premium-monthly');
    expect(checkout.checkoutSessionId, 'checkout-1');
    expect(checkout.flowState, 'PAYMENT_PROCESSING');
    expect(verified?.billing.checkoutSessionId, 'checkout-1');
  });
}

class _FakeTransport implements ApiTransport {
  Map<String, String>? lastGetHeaders;
  Map<String, String>? lastPostHeaders;

  @override
  Future<ApiResponse> delete(
    Uri uri, {
    Map<String, String>? headers,
  }) async {
    return const ApiResponse(statusCode: 200, body: '');
  }

  @override
  Future<ApiResponse> get(
    Uri uri, {
    Map<String, String>? headers,
  }) async {
    lastGetHeaders = headers;
    if (uri.path.endsWith('/subscriptions/plans')) {
      return const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "data": [
            {
              "id": "premium-monthly",
              "name": "Monthly",
              "price": 99000,
              "durationDays": 30,
              "status": "ACTIVE"
            }
          ]
        }
        ''',
      );
    }

    return const ApiResponse(statusCode: 404, body: '');
  }

  @override
  Future<ApiResponse> postJson(
    Uri uri,
    Object body, {
    Map<String, String>? headers,
  }) async {
    lastPostHeaders = headers;
    if (uri.path.endsWith('/subscriptions/checkout')) {
      return const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "data": {
            "paymentAttemptId": "attempt-1",
            "checkoutSessionId": "checkout-1",
            "provider": "WEB_GATEWAY",
            "redirectUrl": "https://pay.example",
            "status": "INITIATED",
            "flowState": "PAYMENT_PROCESSING",
            "returnUrl": "https://app.example/return",
            "trialRequested": false,
            "expiresAt": "2026-05-12T04:00:00.000Z"
          }
        }
        ''',
      );
    }

    if (uri.path.endsWith('/subscriptions/verify')) {
      return const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "data": {
            "subscription": {
              "id": "sub-1",
              "status": "ACTIVE",
              "flowState": "UNLOCKED",
              "plan": {
                "id": "premium-monthly",
                "name": "Monthly",
                "price": 99000,
                "durationDays": 30,
                "status": "ACTIVE"
              },
              "billing": {
                "provider": "WEB_GATEWAY",
                "status": "PAID",
                "reference": "ref-1",
                "checkoutSessionId": "checkout-1",
                "lastBillingAt": "2026-05-12T04:00:00.000Z",
                "nextBillingAt": "2026-06-12T04:00:00.000Z"
              },
              "entitlement": {
                "status": "UNLOCKED",
                "canAccessPremium": true,
                "isTrial": false,
                "expiresAt": "2026-06-12T04:00:00.000Z",
                "checkedAt": "2026-05-12T04:00:00.000Z",
                "source": "WEB"
              },
              "startAt": "2026-05-12T04:00:00.000Z",
              "endAt": "2026-06-12T04:00:00.000Z",
              "createdAt": "2026-05-12T04:00:00.000Z",
              "updatedAt": "2026-05-12T04:00:00.000Z"
            }
          }
        }
        ''',
      );
    }

    return const ApiResponse(statusCode: 200, body: '{}');
  }
}
