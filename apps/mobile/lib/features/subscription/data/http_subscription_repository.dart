import 'dart:convert';

import '../../../core/network/api_transport.dart';
import '../domain/subscription_models.dart';
import '../domain/subscription_repository.dart';

class HttpSubscriptionRepository implements SubscriptionRepository {
  final Uri baseUri;
  final ApiTransport _transport;

  HttpSubscriptionRepository({
    required this.baseUri,
    ApiTransport? transport,
  }) : _transport = transport ?? createApiTransport();

  @override
  Future<List<SubscriptionPlan>> getPlans({
    required String? userId,
    required String? accessToken,
  }) async {
    final json = await _getJson('/subscriptions/plans',
        accessToken: accessToken, userId: userId);
    final data = (json?['data'] as List<dynamic>?) ?? const <dynamic>[];
    return data
        .whereType<Map<String, dynamic>>()
        .map(
          (item) => SubscriptionPlan(
            id: item['id'] as String? ?? '',
            name: item['name'] as String? ?? '',
            price: item['price'] as int? ?? 0,
            durationDays: item['durationDays'] as int? ?? 0,
            status: item['status'] as String? ?? 'ACTIVE',
          ),
        )
        .toList(growable: false);
  }

  @override
  Future<SubscriptionState?> getMySubscription({
    required String? userId,
    required String? accessToken,
  }) async {
    final json = await _getJson('/subscriptions/me',
        accessToken: accessToken, userId: userId);
    return json == null ? null : _parseSubscription(json);
  }

  @override
  Future<SubscriptionState?> verifySubscription({
    required String? userId,
    required String? accessToken,
    SubscriptionVerifyRequest? request,
  }) async {
    final json = await _postJson(
      '/subscriptions/verify',
      {
        if (request?.provider != null) 'provider': request!.provider,
        if (request?.checkoutSessionId != null)
          'checkoutSessionId': request!.checkoutSessionId,
        if (request?.receiptToken != null)
          'receiptToken': request!.receiptToken,
        if (request?.transactionId != null)
          'transactionId': request!.transactionId,
        if (request?.orderId != null) 'orderId': request!.orderId,
        if (request?.platform != null) 'platform': request!.platform,
      },
      accessToken: accessToken,
      userId: userId,
    );
    return json.isEmpty ? null : _parseSubscription(json);
  }

  @override
  Future<SubscriptionCheckoutResult> checkout({
    required SubscriptionCheckoutRequest request,
    required String? userId,
    required String? accessToken,
  }) async {
    final json = await _postJson(
      '/subscriptions/checkout',
      {
        'planId': request.planId,
        'provider': request.provider,
        if (request.returnUrl != null) 'returnUrl': request.returnUrl,
        if (request.trialRequested != null)
          'trialRequested': request.trialRequested,
      },
      accessToken: accessToken,
      userId: userId,
    );
    return _parseCheckout(json);
  }

  Future<Map<String, dynamic>?> _getJson(
    String path, {
    required String? accessToken,
    required String? userId,
  }) async {
    final uri = baseUri.resolve(path);
    final response = await _transport.get(
      uri,
      headers: <String, String>{
        if (accessToken != null && accessToken.isNotEmpty)
          'Authorization': 'Bearer $accessToken',
        if (userId != null && userId.isNotEmpty) 'x-user-id': userId,
      },
    );
    if (response.statusCode == 404) {
      return null;
    }
    if (response.statusCode >= 400) {
      throw ApiException(
        method: 'GET',
        uri: uri,
        statusCode: response.statusCode,
        body: response.body,
      );
    }
    if (response.body.trim().isEmpty) {
      return null;
    }
    final decoded = jsonDecode(response.body);
    return decoded is Map<String, dynamic>
        ? decoded
        : <String, dynamic>{'data': decoded};
  }

  Future<Map<String, dynamic>> _postJson(
    String path,
    Map<String, dynamic> body, {
    required String? accessToken,
    required String? userId,
  }) async {
    final uri = baseUri.resolve(path);
    final response = await _transport.postJson(
      uri,
      body,
      headers: <String, String>{
        if (accessToken != null && accessToken.isNotEmpty)
          'Authorization': 'Bearer $accessToken',
        if (userId != null && userId.isNotEmpty) 'x-user-id': userId,
      },
    );
    if (response.statusCode >= 400) {
      throw ApiException(
        method: 'POST',
        uri: uri,
        statusCode: response.statusCode,
        body: response.body,
      );
    }
    if (response.body.trim().isEmpty) {
      return <String, dynamic>{};
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  SubscriptionState _parseSubscription(Map<String, dynamic> json) {
    final envelope = (json['data'] as Map<String, dynamic>?) ?? json;
    final data =
        (envelope['subscription'] as Map<String, dynamic>?) ?? envelope;
    return SubscriptionState(
      id: data['id'] as String? ?? '',
      status: data['status'] as String? ?? 'PENDING',
      flowState: data['flowState'] as String?,
      plan: SubscriptionPlan(
        id: (data['plan'] as Map<String, dynamic>?)?['id'] as String? ?? '',
        name: (data['plan'] as Map<String, dynamic>?)?['name'] as String? ?? '',
        price: (data['plan'] as Map<String, dynamic>?)?['price'] as int? ?? 0,
        durationDays:
            (data['plan'] as Map<String, dynamic>?)?['durationDays'] as int? ??
                0,
        status: (data['plan'] as Map<String, dynamic>?)?['status'] as String? ??
            'ACTIVE',
      ),
      billing: SubscriptionBilling(
        provider: (data['billing'] as Map<String, dynamic>?)?['provider']
                as String? ??
            'WEB_GATEWAY',
        status:
            (data['billing'] as Map<String, dynamic>?)?['status'] as String? ??
                'PENDING',
        reference:
            (data['billing'] as Map<String, dynamic>?)?['reference'] as String?,
        checkoutSessionId: (data['billing']
            as Map<String, dynamic>?)?['checkoutSessionId'] as String?,
        lastBillingAt: (data['billing']
            as Map<String, dynamic>?)?['lastBillingAt'] as String?,
        nextBillingAt: (data['billing']
            as Map<String, dynamic>?)?['nextBillingAt'] as String?,
      ),
      entitlement: SubscriptionEntitlement(
        status: (data['entitlement'] as Map<String, dynamic>?)?['status']
                as String? ??
            'LOCKED',
        canAccessPremium: (data['entitlement']
                as Map<String, dynamic>?)?['canAccessPremium'] as bool? ??
            false,
        isTrial: (data['entitlement'] as Map<String, dynamic>?)?['isTrial']
                as bool? ??
            false,
        expiresAt: (data['entitlement'] as Map<String, dynamic>?)?['expiresAt']
            as String?,
        checkedAt: (data['entitlement'] as Map<String, dynamic>?)?['checkedAt']
            as String?,
        source: (data['entitlement'] as Map<String, dynamic>?)?['source']
            as String?,
      ),
      startAt: data['startAt'] as String? ?? DateTime.now().toIso8601String(),
      endAt: data['endAt'] as String?,
      createdAt:
          data['createdAt'] as String? ?? DateTime.now().toIso8601String(),
      updatedAt:
          data['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
    );
  }

  SubscriptionCheckoutResult _parseCheckout(Map<String, dynamic> json) {
    final data = (json['data'] as Map<String, dynamic>?) ?? json;
    return SubscriptionCheckoutResult(
      paymentAttemptId: data['paymentAttemptId'] as String? ??
          data['checkoutSessionId'] as String? ??
          '',
      checkoutSessionId: data['checkoutSessionId'] as String? ?? '',
      plan: (data['plan'] as Map<String, dynamic>?) == null
          ? null
          : SubscriptionPlan(
              id: (data['plan'] as Map<String, dynamic>)['id'] as String? ?? '',
              name: (data['plan'] as Map<String, dynamic>)['name'] as String? ??
                  '',
              price:
                  (data['plan'] as Map<String, dynamic>)['price'] as int? ?? 0,
              durationDays: (data['plan']
                      as Map<String, dynamic>)['durationDays'] as int? ??
                  0,
              status:
                  (data['plan'] as Map<String, dynamic>)['status'] as String? ??
                      'ACTIVE',
            ),
      provider: data['provider'] as String? ?? 'WEB_GATEWAY',
      redirectUrl: data['redirectUrl'] as String?,
      status: data['status'] as String? ?? 'INITIATED',
      flowState: data['flowState'] as String?,
      returnUrl: data['returnUrl'] as String?,
      trialRequested: data['trialRequested'] as bool?,
      expiresAt: data['expiresAt'] as String?,
    );
  }
}
