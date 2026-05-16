import '../../../app/app_config.dart';
import 'package:flutter/foundation.dart';
import 'engagement_models.dart';
import '../data/http_engagement_repository.dart';
import '../data/mock_engagement_repository.dart';

class EngagementListRequest {
  final String? audiobookId;
  final int page;
  final int pageSize;

  const EngagementListRequest({
    this.audiobookId,
    this.page = 1,
    this.pageSize = 20,
  });
}

abstract class EngagementRepository {
  Future<List<BookmarkEntry>> listBookmarks({
    String? audiobookId,
    String? userId,
    String? accessToken,
  });

  Future<BookmarkEntry> createBookmark(
    BookmarkCreateRequest request, {
    String? userId,
    String? accessToken,
  });

  Future<bool> deleteBookmark(
    String bookmarkId, {
    String? userId,
    String? accessToken,
  });

  Future<List<FavoriteEntry>> listFavorites({
    String? audiobookId,
    String? userId,
    String? accessToken,
  });

  Future<FavoriteToggleResult> toggleFavorite(
    String audiobookId, {
    String? userId,
    String? accessToken,
  });

  Future<bool> isFavorite(
    String audiobookId, {
    String? userId,
    String? accessToken,
  });
}

EngagementRepository createEngagementRepository(AppConfig config, {bool? isWeb}) {
  if (shouldUseMockRepositories(config, isWeb: isWeb)) {
    return MockEngagementRepository();
  }

  return HttpEngagementRepository(baseUri: config.apiBaseUri);
}
