class BookmarkEntry {
  final String id;
  final String audiobookId;
  final String audiobookTitle;
  final String? audiobookCoverImageAssetKey;
  final String authorName;
  final String chapterId;
  final String chapterTitle;
  final int positionMs;
  final String? note;
  final DateTime createdAt;

  const BookmarkEntry({
    required this.id,
    required this.audiobookId,
    required this.audiobookTitle,
    required this.audiobookCoverImageAssetKey,
    required this.authorName,
    required this.chapterId,
    required this.chapterTitle,
    required this.positionMs,
    required this.note,
    required this.createdAt,
  });
}

class FavoriteEntry {
  final String id;
  final String audiobookId;
  final String audiobookTitle;
  final String? audiobookCoverImageAssetKey;
  final String authorName;
  final int durationSec;
  final bool premiumFlag;
  final DateTime createdAt;

  const FavoriteEntry({
    required this.id,
    required this.audiobookId,
    required this.audiobookTitle,
    required this.audiobookCoverImageAssetKey,
    required this.authorName,
    required this.durationSec,
    required this.premiumFlag,
    required this.createdAt,
  });
}

class FavoriteToggleResult {
  final bool favorited;
  final FavoriteEntry favorite;

  const FavoriteToggleResult({
    required this.favorited,
    required this.favorite,
  });
}

class BookmarkCreateRequest {
  final String audiobookId;
  final String chapterId;
  final int positionMs;
  final String? note;

  const BookmarkCreateRequest({
    required this.audiobookId,
    required this.chapterId,
    required this.positionMs,
    this.note,
  });
}

