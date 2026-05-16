import '../domain/engagement_models.dart';
import '../domain/engagement_repository.dart';

class MockEngagementRepository implements EngagementRepository {
  final List<BookmarkEntry> _bookmarks = <BookmarkEntry>[
    BookmarkEntry(
      id: 'bookmark-1',
      audiobookId: 'book-clean-architecture',
      audiobookTitle: 'Clean Architecture cho Product Teams',
      audiobookCoverImageAssetKey: 'cover-clean-architecture',
      authorName: 'Bảo Trần',
      chapterId: 'chapter-2',
      chapterTitle: 'Service layer và boundaries',
      positionMs: 860000,
      note: 'Chỗ này cần review lại boundaries.',
      createdAt: DateTime.utc(2026, 5, 12, 2, 0, 0),
    ),
  ];

  final List<FavoriteEntry> _favorites = <FavoriteEntry>[
    FavoriteEntry(
      id: 'favorite-1',
      audiobookId: 'book-clean-architecture',
      audiobookTitle: 'Clean Architecture cho Product Teams',
      audiobookCoverImageAssetKey: 'cover-clean-architecture',
      authorName: 'Bảo Trần',
      durationSec: 18600,
      premiumFlag: false,
      createdAt: DateTime.utc(2026, 5, 12, 2, 0, 0),
    ),
  ];

  @override
  Future<BookmarkEntry> createBookmark(
    BookmarkCreateRequest request, {
    String? userId,
    String? accessToken,
  }) async {
    final entry = BookmarkEntry(
      id: 'bookmark-${_bookmarks.length + 1}',
      audiobookId: request.audiobookId,
      audiobookTitle: request.audiobookId,
      audiobookCoverImageAssetKey: null,
      authorName: 'Unknown',
      chapterId: request.chapterId,
      chapterTitle: request.chapterId,
      positionMs: request.positionMs,
      note: request.note,
      createdAt: DateTime.now().toUtc(),
    );
    _bookmarks.insert(0, entry);
    return entry;
  }

  @override
  Future<bool> deleteBookmark(
    String bookmarkId, {
    String? userId,
    String? accessToken,
  }) async {
    final before = _bookmarks.length;
    _bookmarks.removeWhere((item) => item.id == bookmarkId);
    return _bookmarks.length != before;
  }

  @override
  Future<List<BookmarkEntry>> listBookmarks({
    String? audiobookId,
    String? userId,
    String? accessToken,
  }) async {
    if (audiobookId == null) {
      return List<BookmarkEntry>.unmodifiable(_bookmarks);
    }

    return List<BookmarkEntry>.unmodifiable(
      _bookmarks.where((item) => item.audiobookId == audiobookId),
    );
  }

  @override
  Future<FavoriteToggleResult> toggleFavorite(
    String audiobookId, {
    String? userId,
    String? accessToken,
  }) async {
    final existingIndex = _favorites.indexWhere((item) => item.audiobookId == audiobookId);
    if (existingIndex >= 0) {
      final removed = _favorites.removeAt(existingIndex);
      return FavoriteToggleResult(favorited: false, favorite: removed);
    }

    final entry = FavoriteEntry(
      id: 'favorite-${_favorites.length + 1}',
      audiobookId: audiobookId,
      audiobookTitle: audiobookId,
      audiobookCoverImageAssetKey: null,
      authorName: 'Unknown',
      durationSec: 0,
      premiumFlag: false,
      createdAt: DateTime.now().toUtc(),
    );
    _favorites.insert(0, entry);
    return FavoriteToggleResult(favorited: true, favorite: entry);
  }

  @override
  Future<List<FavoriteEntry>> listFavorites({
    String? audiobookId,
    String? userId,
    String? accessToken,
  }) async {
    if (audiobookId == null) {
      return List<FavoriteEntry>.unmodifiable(_favorites);
    }

    return List<FavoriteEntry>.unmodifiable(
      _favorites.where((item) => item.audiobookId == audiobookId),
    );
  }

  @override
  Future<bool> isFavorite(
    String audiobookId, {
    String? userId,
    String? accessToken,
  }) async {
    return _favorites.any((item) => item.audiobookId == audiobookId);
  }
}
