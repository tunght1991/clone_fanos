import 'dart:convert';
import 'dart:io';

import '../domain/engagement_models.dart';
import '../domain/engagement_repository.dart';

class HttpEngagementRepository implements EngagementRepository {
  final Uri baseUri;
  final HttpClient _client;

  HttpEngagementRepository({
    required this.baseUri,
    HttpClient? client,
  }) : _client = client ?? HttpClient();

  @override
  Future<BookmarkEntry> createBookmark(
    BookmarkCreateRequest request, {
    String? userId,
    String? accessToken,
  }) async {
    final json = await _postJson(
      '/bookmarks',
      {
        'audiobookId': request.audiobookId,
        'chapterId': request.chapterId,
        'positionMs': request.positionMs,
        if (request.note != null) 'note': request.note,
      },
      userId: userId,
      accessToken: accessToken,
    );
    return _parseBookmark(json);
  }

  @override
  Future<bool> deleteBookmark(
    String bookmarkId, {
    String? userId,
    String? accessToken,
  }) async {
    await _deleteJson('/bookmarks/$bookmarkId', userId: userId, accessToken: accessToken);
    return true;
  }

  @override
  Future<List<BookmarkEntry>> listBookmarks({
    String? audiobookId,
    String? userId,
    String? accessToken,
  }) async {
    final json = await _getJson('/bookmarks', queryParameters: {
      if (audiobookId != null) 'audiobookId': audiobookId,
    }, userId: userId, accessToken: accessToken);
    final data = json['data'] as List<dynamic>? ?? const <dynamic>[];
    return data.map((item) => _parseBookmark(item as Map<String, dynamic>)).toList();
  }

  @override
  Future<FavoriteToggleResult> toggleFavorite(
    String audiobookId, {
    String? userId,
    String? accessToken,
  }) async {
    final existing = await isFavorite(audiobookId, userId: userId, accessToken: accessToken);
    if (existing) {
      await _deleteJson('/favorites/$audiobookId', userId: userId, accessToken: accessToken);
      final favorite = FavoriteEntry(
        id: audiobookId,
        audiobookId: audiobookId,
        audiobookTitle: audiobookId,
        audiobookCoverImageAssetKey: null,
        authorName: 'Unknown',
        durationSec: 0,
        premiumFlag: false,
        createdAt: DateTime.now().toUtc(),
      );
      return FavoriteToggleResult(favorited: false, favorite: favorite);
    }

    final json = await _postJson(
      '/favorites/$audiobookId',
      <String, dynamic>{},
      userId: userId,
      accessToken: accessToken,
    );
    final result = json['favorite'] as Map<String, dynamic>? ?? json;
    return FavoriteToggleResult(favorited: true, favorite: _parseFavorite(result));
  }

  @override
  Future<List<FavoriteEntry>> listFavorites({
    String? audiobookId,
    String? userId,
    String? accessToken,
  }) async {
    final json = await _getJson('/favorites', queryParameters: {
      if (audiobookId != null) 'audiobookId': audiobookId,
    }, userId: userId, accessToken: accessToken);
    final data = json['data'] as List<dynamic>? ?? const <dynamic>[];
    return data.map((item) => _parseFavorite(item as Map<String, dynamic>)).toList();
  }

  @override
  Future<bool> isFavorite(
    String audiobookId, {
    String? userId,
    String? accessToken,
  }) async {
    final favorites = await listFavorites(audiobookId: audiobookId, userId: userId, accessToken: accessToken);
    return favorites.isNotEmpty;
  }

  Future<Map<String, dynamic>> _postJson(
    String path,
    Map<String, dynamic> body, {
    String? userId,
    String? accessToken,
  }) async {
    final request = await _client.postUrl(baseUri.resolve(path));
    _applyAuthHeaders(request, userId: userId, accessToken: accessToken);
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode(body));
    final response = await request.close();
    final payload = await utf8.decoder.bind(response).join();
    if (response.statusCode >= 400) {
      throw HttpException('Request failed: ${response.statusCode} $payload');
    }
    if (payload.trim().isEmpty) {
      return <String, dynamic>{};
    }
    return jsonDecode(payload) as Map<String, dynamic>;
  }

  Future<void> _deleteJson(
    String path, {
    String? userId,
    String? accessToken,
  }) async {
    final request = await _client.deleteUrl(baseUri.resolve(path));
    _applyAuthHeaders(request, userId: userId, accessToken: accessToken);
    final response = await request.close();
    final payload = await utf8.decoder.bind(response).join();
    if (response.statusCode >= 400) {
      throw HttpException('Request failed: ${response.statusCode} $payload');
    }
  }

  Future<Map<String, dynamic>> _getJson(
    String path, {
    Map<String, String>? queryParameters,
    String? userId,
    String? accessToken,
  }) async {
    final request = await _client.getUrl(
      baseUri.replace(
        path: path,
        queryParameters: queryParameters,
      ),
    );
    _applyAuthHeaders(request, userId: userId, accessToken: accessToken);
    final response = await request.close();
    final payload = await utf8.decoder.bind(response).join();
    if (response.statusCode >= 400) {
      throw HttpException('Request failed: ${response.statusCode} $payload');
    }
    if (payload.trim().isEmpty) {
      return <String, dynamic>{};
    }
    return jsonDecode(payload) as Map<String, dynamic>;
  }

  void _applyAuthHeaders(
    HttpClientRequest request, {
    String? userId,
    String? accessToken,
  }) {
    if (accessToken != null && accessToken.isNotEmpty) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $accessToken');
    }
    if (userId != null && userId.isNotEmpty) {
      request.headers.set('x-user-id', userId);
    }
  }

  BookmarkEntry _parseBookmark(Map<String, dynamic> json) {
    return BookmarkEntry(
      id: json['id'] as String? ?? '',
      audiobookId: json['audiobookId'] as String? ?? '',
      audiobookTitle: json['audiobookTitle'] as String? ?? '',
      audiobookCoverImageAssetKey: json['audiobookCoverImageAssetKey'] as String?,
      authorName: json['authorName'] as String? ?? '',
      chapterId: json['chapterId'] as String? ?? '',
      chapterTitle: json['chapterTitle'] as String? ?? '',
      positionMs: json['positionMs'] as int? ?? 0,
      note: json['note'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String? ?? DateTime.now().toIso8601String()),
    );
  }

  FavoriteEntry _parseFavorite(Map<String, dynamic> json) {
    return FavoriteEntry(
      id: json['id'] as String? ?? '',
      audiobookId: json['audiobookId'] as String? ?? '',
      audiobookTitle: json['audiobookTitle'] as String? ?? '',
      audiobookCoverImageAssetKey: json['audiobookCoverImageAssetKey'] as String?,
      authorName: json['authorName'] as String? ?? '',
      durationSec: json['durationSec'] as int? ?? 0,
      premiumFlag: json['premiumFlag'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String? ?? DateTime.now().toIso8601String()),
    );
  }
}
