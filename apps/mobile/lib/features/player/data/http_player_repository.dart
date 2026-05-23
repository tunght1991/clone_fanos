import 'dart:convert';

import '../../../core/network/api_transport.dart';
import '../domain/player_models.dart';
import '../domain/player_repository.dart';

class HttpPlayerRepository implements PlayerRepository {
  final Uri baseUri;
  final ApiTransport _transport;

  HttpPlayerRepository({
    required this.baseUri,
    ApiTransport? transport,
  }) : _transport = transport ?? createApiTransport();

  @override
  Future<PlaybackProgressState?> getProgress({
    required String audiobookId,
    required String? userId,
    required String? accessToken,
  }) async {
    final json = await _getJson(
      '/playback/progress/$audiobookId',
      accessToken: accessToken,
      userId: userId,
    );
    if (json == null) {
      return null;
    }

    return _parseProgress(json);
  }

  @override
  Future<PlaybackProgressState> saveProgress({
    required String audiobookId,
    required String chapterId,
    required int positionMs,
    required bool completed,
    required String? userId,
    required String? accessToken,
  }) async {
    final json = await _postJson(
      '/playback/progress',
      {
        'audiobookId': audiobookId,
        'chapterId': chapterId,
        'positionMs': positionMs,
        'completed': completed,
      },
      accessToken: accessToken,
      userId: userId,
    );

    return _parseProgress(json);
  }

  @override
  Future<AudioAssetAccess> getChapterAssetAccess({
    required String audioAssetKey,
    required String? userId,
    required String? accessToken,
  }) async {
    final json = await _postJson(
      '/assets/access',
      {
        'assetKey': audioAssetKey,
        'kind': 'AUDIO',
        'purpose': 'STREAM',
        'offlineCapable': true,
      },
      accessToken: accessToken,
      userId: userId,
    );
    return _parseAssetAccess(json);
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

    final decoded = jsonDecode(response.body);
    return decoded is Map<String, dynamic>
        ? decoded
        : <String, dynamic>{'data': decoded};
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

  PlaybackProgressState _parseProgress(Map<String, dynamic> json) {
    final data = (json['data'] as Map<String, dynamic>?) ?? json;
    return PlaybackProgressState(
      audiobookId: data['audiobookId'] as String? ?? '',
      chapterId: data['chapterId'] as String? ?? '',
      positionMs: data['positionMs'] as int? ?? 0,
      completed: data['completed'] as bool? ?? false,
      lastPlayedAt: data['lastPlayedAt'] == null
          ? null
          : DateTime.parse(data['lastPlayedAt'] as String),
      updatedAt: DateTime.parse(
          data['updatedAt'] as String? ?? DateTime.now().toIso8601String()),
    );
  }

  AudioAssetAccess _parseAssetAccess(Map<String, dynamic> json) {
    final data = (json['data'] as Map<String, dynamic>?) ?? json;
    final headers = <String, String>{};
    final rawHeaders = data['headers'] as Map<String, dynamic>?;
    if (rawHeaders != null) {
      rawHeaders.forEach((key, value) {
        headers[key] = value?.toString() ?? '';
      });
    }

    return AudioAssetAccess(
      provider: data['provider'] as String? ?? 'CDN',
      url: data['url'] as String? ?? '',
      expiresAt: DateTime.parse(
          data['expiresAt'] as String? ?? DateTime.now().toIso8601String()),
      streamable: data['streamable'] as bool? ?? true,
      offlineCapable: data['offlineCapable'] as bool? ?? false,
      headers: headers,
    );
  }
}
