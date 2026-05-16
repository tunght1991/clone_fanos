class ContentCategory {
  final String id;
  final String name;
  final int itemCount;

  const ContentCategory({
    required this.id,
    required this.name,
    required this.itemCount,
  });
}

class AudiobookSummary {
  final String id;
  final String title;
  final String description;
  final String? coverImageAssetKey;
  final String authorId;
  final String authorName;
  final List<String> narratorIds;
  final List<String> narratorNames;
  final List<String> categoryIds;
  final List<String> categoryNames;
  final List<String> tagNames;
  final int durationSec;
  final bool premiumFlag;
  final String status;
  final bool isFeatured;
  final bool isNew;
  final String languageCode;

  const AudiobookSummary({
    required this.id,
    required this.title,
    required this.description,
    required this.coverImageAssetKey,
    required this.authorId,
    required this.authorName,
    required this.narratorIds,
    required this.narratorNames,
    required this.categoryIds,
    required this.categoryNames,
    required this.tagNames,
    required this.durationSec,
    required this.premiumFlag,
    required this.status,
    required this.isFeatured,
    required this.isNew,
    required this.languageCode,
  });
}

class AudiobookChapter {
  final String id;
  final String title;
  final int orderIndex;
  final int durationSec;
  final String audioAssetKey;
  final String? transcript;
  final String status;

  const AudiobookChapter({
    required this.id,
    required this.title,
    required this.orderIndex,
    required this.durationSec,
    required this.audioAssetKey,
    required this.transcript,
    required this.status,
  });
}

class AudiobookDetail extends AudiobookSummary {
  final List<AudiobookChapter> chapters;

  const AudiobookDetail({
    required super.id,
    required super.title,
    required super.description,
    required super.coverImageAssetKey,
    required super.authorId,
    required super.authorName,
    required super.narratorIds,
    required super.narratorNames,
    required super.categoryIds,
    required super.categoryNames,
    required super.tagNames,
    required super.durationSec,
    required super.premiumFlag,
    required super.status,
    required super.isFeatured,
    required super.isNew,
    required super.languageCode,
    required this.chapters,
  });
}

class ListeningProgress {
  final String audiobookId;
  final String audiobookTitle;
  final String chapterId;
  final String chapterTitle;
  final int positionMs;
  final int totalDurationMs;
  final DateTime lastPlayedAt;
  final bool premiumFlag;
  final String? coverImageAssetKey;
  final String authorName;

  const ListeningProgress({
    required this.audiobookId,
    required this.audiobookTitle,
    required this.chapterId,
    required this.chapterTitle,
    required this.positionMs,
    required this.totalDurationMs,
    required this.lastPlayedAt,
    required this.premiumFlag,
    required this.coverImageAssetKey,
    required this.authorName,
  });

  double get progressFraction {
    if (totalDurationMs <= 0) {
      return 0;
    }

    return (positionMs / totalDurationMs).clamp(0, 1);
  }
}

class BrowseFeed {
  final List<ContentCategory> categories;
  final List<AudiobookSummary> featured;
  final List<AudiobookSummary> newReleases;
  final ListeningProgress? continueListening;

  const BrowseFeed({
    required this.categories,
    required this.featured,
    required this.newReleases,
    required this.continueListening,
  });
}

class SearchPage {
  final List<AudiobookSummary> items;
  final String query;
  final int page;
  final int pageSize;
  final int totalItems;
  final int totalPages;
  final bool hasNext;

  const SearchPage({
    required this.items,
    required this.query,
    required this.page,
    required this.pageSize,
    required this.totalItems,
    required this.totalPages,
    required this.hasNext,
  });
}
