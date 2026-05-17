import 'dart:convert';
import 'dart:io';

import '../domain/analytics_models.dart';
import '../domain/analytics_repository.dart';

class HttpAnalyticsRepository implements AnalyticsRepository {
  final Uri baseUri;
  final HttpClient _client;

  HttpAnalyticsRepository({
    required this.baseUri,
    HttpClient? client,
  }) : _client = client ?? HttpClient();

  @override
  Future<void> trackEvent({
    required AnalyticsEvent event,
    required String? userId,
    required String? accessToken,
  }) async {
    final request = await _client.postUrl(baseUri.resolve('/analytics/events'));
    request.headers.contentType = ContentType.json;
    if (accessToken != null && accessToken.isNotEmpty) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $accessToken');
    }
    if (userId != null && userId.isNotEmpty) {
      request.headers.set('x-user-id', userId);
    }
    request.write(
      jsonEncode({
        'events': [event.toJson()],
      }),
    );
    final response = await request.close();
    final payload = await utf8.decoder.bind(response).join();
    if (response.statusCode >= 400) {
      throw HttpException('Request failed: ${response.statusCode} $payload');
    }
  }
}
