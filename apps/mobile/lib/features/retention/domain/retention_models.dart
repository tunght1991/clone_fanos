import '../../discovery/domain/discovery_models.dart';

class RetentionWeeklySummary {
  final String headline;
  final String description;
  final int activeDays;
  final int listeningSessions;
  final int bookmarksCreated;
  final int notesCreated;
  final int favoritesAdded;
  final String? topAudiobookTitle;
  final String? topAuthorName;
  final DateTime periodStart;
  final DateTime periodEnd;
  final DateTime? lastActivityAt;

  const RetentionWeeklySummary({
    required this.headline,
    required this.description,
    required this.activeDays,
    required this.listeningSessions,
    required this.bookmarksCreated,
    required this.notesCreated,
    required this.favoritesAdded,
    required this.topAudiobookTitle,
    required this.topAuthorName,
    required this.periodStart,
    required this.periodEnd,
    required this.lastActivityAt,
  });

  RetentionWeeklySummary.empty()
      : headline = 'Keep the next session close',
        description = 'Your habit summary will appear after a few listening actions.',
        activeDays = 0,
        listeningSessions = 0,
        bookmarksCreated = 0,
        notesCreated = 0,
        favoritesAdded = 0,
        topAudiobookTitle = null,
        topAuthorName = null,
        periodStart = DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
        periodEnd = DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
        lastActivityAt = null;
}

class RetentionRecommendation {
  final AudiobookSummary item;
  final String reasonType;
  final String reason;

  const RetentionRecommendation({
    required this.item,
    required this.reasonType,
    required this.reason,
  });
}

class RetentionHomeData {
  final RetentionWeeklySummary weeklySummary;
  final List<RetentionRecommendation> recommendations;

  const RetentionHomeData({
    required this.weeklySummary,
    required this.recommendations,
  });

  RetentionHomeData.empty()
      : weeklySummary = RetentionWeeklySummary.empty(),
        recommendations = const <RetentionRecommendation>[];
}
