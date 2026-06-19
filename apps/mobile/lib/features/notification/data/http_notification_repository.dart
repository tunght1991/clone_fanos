import 'dart:convert';

import '../../../core/network/api_transport.dart';
import '../domain/notification_models.dart';
import '../domain/notification_repository.dart';

class HttpNotificationRepository implements NotificationRepository {
  final Uri baseUri;
  final ApiTransport _transport;

  HttpNotificationRepository({
    required this.baseUri,
    ApiTransport? transport,
  }) : _transport = transport ?? createApiTransport();

  @override
  Future<NotificationHomeData> getHomeData({
    required String? userId,
    required String? accessToken,
  }) async {
    final uri = baseUri.resolve('/notifications/home');
    final response = await _transport.get(
      uri,
      headers: <String, String>{
        if (accessToken != null && accessToken.isNotEmpty)
          'Authorization': 'Bearer $accessToken',
        if (userId != null && userId.isNotEmpty) 'x-user-id': userId,
      },
    );

    if (response.statusCode >= 400) {
      throw ApiException(
        method: 'GET',
        uri: uri,
        statusCode: response.statusCode,
        body: response.body,
      );
    }

    if (response.body.trim().isEmpty) {
      return NotificationHomeData.empty();
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>? ?? json;
    final reminder = data['resumeReminder'] as Map<String, dynamic>?;

    return NotificationHomeData(
      resumeReminder: reminder == null ? null : _parseReminder(reminder),
      generatedAt: DateTime.parse(
        (json['meta'] as Map<String, dynamic>?)?['generatedAt'] as String? ??
            DateTime.fromMillisecondsSinceEpoch(0, isUtc: true).toIso8601String(),
      ),
      windowDays: (json['meta'] as Map<String, dynamic>?)?['windowDays'] as int? ?? 7,
    );
  }

  NotificationResumeReminder _parseReminder(Map<String, dynamic> json) {
    return NotificationResumeReminder(
      audiobookId: json['audiobookId'] as String? ?? '',
      chapterId: json['chapterId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String?,
      progressMs: json['progressMs'] as int? ?? 0,
      lastActivityAt: DateTime.parse(
        json['lastActivityAt'] as String? ??
            DateTime.fromMillisecondsSinceEpoch(0, isUtc: true).toIso8601String(),
      ),
    );
  }
}
