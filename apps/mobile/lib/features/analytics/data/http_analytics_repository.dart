import 'dart:convert';

import '../../../core/network/api_transport.dart';
import '../domain/analytics_models.dart';
import '../domain/analytics_repository.dart';

class HttpAnalyticsRepository implements AnalyticsRepository {
  final Uri baseUri;
  final ApiTransport _transport;

  HttpAnalyticsRepository({
    required this.baseUri,
    ApiTransport? transport,
  }) : _transport = transport ?? createApiTransport();

  @override
  Future<void> trackEvent({
    required AnalyticsEvent event,
    required String? userId,
    required String? accessToken,
  }) async {
    final uri = baseUri.resolve('/analytics/events');
    final response = await _transport.postJson(
      uri,
      <String, dynamic>{
        'events': [event.toJson()],
      },
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
  }
}
