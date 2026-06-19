import 'dart:convert';

import '../../../core/network/api_transport.dart';
import '../../discovery/domain/discovery_models.dart';
import '../domain/retention_models.dart';
import '../domain/retention_repository.dart';

class HttpRetentionRepository implements RetentionRepository {
  final Uri baseUri;
  final ApiTransport _transport;

  HttpRetentionRepository({
    required this.baseUri,
    ApiTransport? transport,
  }) : _transport = transport ?? createApiTransport();

  @override
  Future<RetentionHomeData> getHomeData({
    required String? userId,
    required String? accessToken,
  }) async {
    final response = await _getJson('/retention/home');
    final data = response['data'] as Map<String, dynamic>? ?? response;
    final summary = data['weeklySummary'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    final recommendations = (data['recommendations'] as List<dynamic>? ?? const <dynamic>[])
        .map((item) => _parseRecommendation(item as Map<String, dynamic>))
        .toList();

    return RetentionHomeData(
      weeklySummary: _parseWeeklySummary(summary),
      recommendations: recommendations,
    );
  }

  Future<Map<String, dynamic>> _getJson(String path) async {
    final resolvedUri = baseUri.replace(
      path: _joinPaths(baseUri.path, path),
      queryParameters: baseUri.queryParameters,
    );
    final response = await _transport.get(resolvedUri);

    if (response.statusCode >= 400) {
      throw ApiException(
        method: 'GET',
        uri: resolvedUri,
        statusCode: response.statusCode,
        body: response.body,
      );
    }

    if (response.body.trim().isEmpty) {
      return <String, dynamic>{};
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  RetentionWeeklySummary _parseWeeklySummary(Map<String, dynamic> json) {
    return RetentionWeeklySummary(
      headline: json['headline'] as String? ?? 'Keep the next session close',
      description: json['description'] as String? ??
          'Your habit summary will appear after a few listening actions.',
      activeDays: json['activeDays'] as int? ?? 0,
      listeningSessions: json['listeningSessions'] as int? ?? 0,
      bookmarksCreated: json['bookmarksCreated'] as int? ?? 0,
      notesCreated: json['notesCreated'] as int? ?? 0,
      favoritesAdded: json['favoritesAdded'] as int? ?? 0,
      topAudiobookTitle: json['topAudiobookTitle'] as String?,
      topAuthorName: json['topAuthorName'] as String?,
      periodStart: DateTime.parse(
        json['periodStart'] as String? ?? DateTime.fromMillisecondsSinceEpoch(0, isUtc: true).toIso8601String(),
      ),
      periodEnd: DateTime.parse(
        json['periodEnd'] as String? ?? DateTime.fromMillisecondsSinceEpoch(0, isUtc: true).toIso8601String(),
      ),
      lastActivityAt: json['lastActivityAt'] == null
          ? null
          : DateTime.parse(json['lastActivityAt'] as String),
    );
  }

  RetentionRecommendation _parseRecommendation(Map<String, dynamic> json) {
    return RetentionRecommendation(
      item: AudiobookSummary(
        id: json['audiobookId'] as String? ?? '',
        title: json['title'] as String? ?? '',
        description: json['description'] as String? ?? '',
        coverImageAssetKey: json['coverImageAssetKey'] as String?,
        authorId: json['authorId'] as String? ?? '',
        authorName: json['authorName'] as String? ?? '',
        narratorIds: const <String>[],
        narratorNames: const <String>[],
        categoryIds: const <String>[],
        categoryNames: const <String>[],
        tagNames: const <String>[],
        durationSec: json['durationSec'] as int? ?? 0,
        premiumFlag: json['premiumFlag'] as bool? ?? false,
        status: json['status'] as String? ?? 'PUBLISHED',
        isFeatured: false,
        isNew: false,
        languageCode: 'vi',
      ),
      reasonType: json['reasonType'] as String? ?? 'HABIT_BUILDER',
      reason: json['reason'] as String? ?? 'Keep building your listening habit',
    );
  }

  String _joinPaths(String basePath, String path) {
    final left = basePath.replaceAll(RegExp(r'/+$'), '');
    final right = path.replaceAll(RegExp(r'^/'), '');
    return '/$left/$right'.replaceAll(RegExp(r'//+'), '/');
  }
}
