import '../../discovery/domain/discovery_models.dart';
import '../domain/retention_models.dart';
import '../domain/retention_repository.dart';

class MockRetentionRepository implements RetentionRepository {
  const MockRetentionRepository();

  @override
  Future<RetentionHomeData> getHomeData({
    required String? userId,
    required String? accessToken,
  }) async {
    return RetentionHomeData(
      weeklySummary: RetentionWeeklySummary(
        headline: 'Your habit is sticking',
        description: '3 active titles · 2 bookmarks · 1 note · 1 favorite',
        activeDays: 3,
        listeningSessions: 2,
        bookmarksCreated: 2,
        notesCreated: 1,
        favoritesAdded: 1,
        topAudiobookTitle: 'Learning Habit System',
        topAuthorName: 'Anh Lê',
        periodStart: DateTime.utc(2026, 6, 2),
        periodEnd: DateTime.utc(2026, 6, 9),
        lastActivityAt: DateTime.utc(2026, 6, 9, 1, 0, 0),
      ),
      recommendations: const <RetentionRecommendation>[
        RetentionRecommendation(
          item: AudiobookSummary(
            id: 'book-habit-system',
            title: 'Learning Habit System',
            description: 'Thiết kế thói quen học tập bền vững bằng checkpoint, bookmark và continue listening.',
            coverImageAssetKey: 'cover-habit-system',
            authorId: 'author-anh',
            authorName: 'Anh Lê',
            narratorIds: ['narrator-1'],
            narratorNames: ['Minh Anh'],
            categoryIds: ['cat-business'],
            categoryNames: ['Business'],
            tagNames: ['Retention', 'Habit'],
            durationSec: 15600,
            premiumFlag: true,
            status: 'PUBLISHED',
            isFeatured: false,
            isNew: false,
            languageCode: 'vi',
          ),
          reasonType: 'MORE_FROM_AUTHOR',
          reason: 'More from Anh Lê',
        ),
        RetentionRecommendation(
          item: AudiobookSummary(
            id: 'book-japanese-listening',
            title: 'Japanese Daily Listening',
            description: 'Nghe ngắn mỗi ngày với tốc độ phù hợp, tập trung vào học từ vựng và ngữ điệu.',
            coverImageAssetKey: 'cover-japanese-listening',
            authorId: 'author-hao',
            authorName: 'Hảo Nguyễn',
            narratorIds: ['narrator-4'],
            narratorNames: ['Yui'],
            categoryIds: ['cat-language'],
            categoryNames: ['Japanese'],
            tagNames: ['Language', 'JLPT'],
            durationSec: 13200,
            premiumFlag: false,
            status: 'PUBLISHED',
            isFeatured: false,
            isNew: true,
            languageCode: 'ja',
          ),
          reasonType: 'FRESH_PICK',
          reason: 'Fresh pick',
        ),
      ],
    );
  }
}
