import '../domain/discovery_models.dart';
import '../domain/discovery_repository.dart';

class MockDiscoveryRepository implements DiscoveryRepository {
  final List<_MockAudiobookRecord> _records = _seedRecords();

  @override
  Future<BrowseFeed> getBrowseFeed({String? categoryId}) async {
    final items = _filterRecords(categoryId: categoryId);
    final categories = _buildCategories(_records);
    final featured = items.where((record) => record.summary.isFeatured).map((record) => record.summary).toList();
    final newReleases = items.where((record) => record.summary.isNew).map((record) => record.summary).toList();

    return BrowseFeed(
      categories: categories,
      featured: featured,
      newReleases: newReleases,
      continueListening: _records.firstWhere((record) => record.progress != null).progress,
    );
  }

  @override
  Future<SearchPage> searchAudiobooks(DiscoverySearchRequest request) async {
    final normalizedQuery = request.query.trim().toLowerCase();
    final filtered = _sortRecords(
      _filterRecords(
      categoryId: request.categoryId,
      premiumFlag: request.premiumFlag,
      query: normalizedQuery,
      ),
      sortBy: request.sortBy,
      sortOrder: request.sortOrder,
    ).map((record) => record.summary).toList();

    final page = request.page < 1 ? 1 : request.page;
    final pageSize = request.pageSize < 1 ? 20 : request.pageSize;
    final startIndex = (page - 1) * pageSize;
    final pageItems = startIndex >= filtered.length ? <AudiobookSummary>[] : filtered.skip(startIndex).take(pageSize).toList();
    final totalPages = filtered.isEmpty ? 0 : ((filtered.length - 1) ~/ pageSize) + 1;

    return SearchPage(
      items: pageItems,
      query: request.query,
      page: page,
      pageSize: pageSize,
      totalItems: filtered.length,
      totalPages: totalPages,
      hasNext: startIndex + pageItems.length < filtered.length,
    );
  }

  @override
  Future<AudiobookDetail?> getAudiobookDetail(String audiobookId) async {
    final record = _records.cast<_MockAudiobookRecord?>().firstWhere(
      (item) => item?.summary.id == audiobookId,
      orElse: () => null,
    );

    return record?.detail;
  }

  List<_MockAudiobookRecord> _filterRecords({
    String? categoryId,
    bool? premiumFlag,
    String? query,
  }) {
    return _records.where((record) {
      if (categoryId != null && !record.summary.categoryIds.contains(categoryId)) {
        return false;
      }

      if (premiumFlag != null && record.summary.premiumFlag != premiumFlag) {
        return false;
      }

      if (query != null && query.isNotEmpty) {
        final haystack = <String>[
          record.summary.title,
          record.summary.description,
          record.summary.authorName,
          ...record.summary.narratorNames,
          ...record.summary.categoryNames,
          ...record.summary.tagNames,
        ].join(' ').toLowerCase();

        if (!haystack.contains(query)) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  List<_MockAudiobookRecord> _sortRecords(
    List<_MockAudiobookRecord> records, {
    required String sortBy,
    required String sortOrder,
  }) {
    final sorted = [...records];
    final descending = sortOrder == discoverySearchSortOrderDesc;

    int compareStrings(String left, String right) {
      final result = left.toLowerCase().compareTo(right.toLowerCase());
      return descending ? -result : result;
    }

    switch (sortBy) {
      case discoverySearchSortByTitle:
        sorted.sort((left, right) => compareStrings(left.summary.title, right.summary.title));
        break;
      case discoverySearchSortByDuration:
        sorted.sort(
          (left, right) => descending
              ? right.summary.durationSec.compareTo(left.summary.durationSec)
              : left.summary.durationSec.compareTo(right.summary.durationSec),
        );
        break;
      case discoverySearchSortByRelevance:
      default:
        break;
    }

    return sorted;
  }

  List<ContentCategory> _buildCategories(List<_MockAudiobookRecord> records) {
    final counts = <String, _CategoryBucket>{};

    for (final record in records) {
      for (var index = 0; index < record.summary.categoryIds.length; index += 1) {
        final categoryId = record.summary.categoryIds[index];
        final categoryName = record.summary.categoryNames[index];
        final bucket = counts.putIfAbsent(
          categoryId,
          () => _CategoryBucket(id: categoryId, name: categoryName),
        );
        bucket.count += 1;
      }
    }

    final categories = counts.values
        .map(
          (bucket) => ContentCategory(
            id: bucket.id,
            name: bucket.name,
            itemCount: bucket.count,
          ),
        )
        .toList()
      ..sort((left, right) => left.name.compareTo(right.name));

    return categories;
  }

  static List<_MockAudiobookRecord> _seedRecords() {
    return <_MockAudiobookRecord>[
      _MockAudiobookRecord(
        summary: AudiobookSummary(
          id: 'book-clean-architecture',
          title: 'Clean Architecture cho Product Teams',
          description: 'Một lộ trình nghe ngắn gọn về clean architecture, domain boundaries và cách giữ codebase dễ mở rộng.',
          coverImageAssetKey: 'cover-clean-architecture',
          authorId: 'author-bao',
          authorName: 'Bảo Trần',
          narratorIds: ['narrator-1'],
          narratorNames: ['Minh Anh'],
          categoryIds: ['cat-it', 'cat-business'],
          categoryNames: ['IT', 'Business'],
          tagNames: ['Architecture', 'Backend', 'MVP'],
          durationSec: 18600,
          premiumFlag: false,
          status: 'PUBLISHED',
          isFeatured: true,
          isNew: false,
          languageCode: 'vi',
        ),
        detail: AudiobookDetail(
          id: 'book-clean-architecture',
          title: 'Clean Architecture cho Product Teams',
          description: 'Một lộ trình nghe ngắn gọn về clean architecture, domain boundaries và cách giữ codebase dễ mở rộng.',
          coverImageAssetKey: 'cover-clean-architecture',
          authorId: 'author-bao',
          authorName: 'Bảo Trần',
          narratorIds: ['narrator-1'],
          narratorNames: ['Minh Anh'],
          categoryIds: ['cat-it', 'cat-business'],
          categoryNames: ['IT', 'Business'],
          tagNames: ['Architecture', 'Backend', 'MVP'],
          durationSec: 18600,
          premiumFlag: false,
          status: 'PUBLISHED',
          isFeatured: true,
          isNew: false,
          languageCode: 'vi',
          chapters: <AudiobookChapter>[
            AudiobookChapter(
              id: 'chapter-1',
              title: 'Tư duy domain-first',
              orderIndex: 1,
              durationSec: 960,
              audioAssetKey: 'audio/book-clean-architecture/chapter-1.mp3',
              transcript: null,
              status: 'PUBLISHED',
            ),
            AudiobookChapter(
              id: 'chapter-2',
              title: 'Service layer và boundaries',
              orderIndex: 2,
              durationSec: 1180,
              audioAssetKey: 'audio/book-clean-architecture/chapter-2.mp3',
              transcript: null,
              status: 'PUBLISHED',
            ),
            AudiobookChapter(
              id: 'chapter-3',
              title: 'Repository và data access',
              orderIndex: 3,
              durationSec: 980,
              audioAssetKey: 'audio/book-clean-architecture/chapter-3.mp3',
              transcript: null,
              status: 'PUBLISHED',
            ),
          ],
        ),
        progress: ListeningProgress(
          audiobookId: 'book-clean-architecture',
          audiobookTitle: 'Clean Architecture cho Product Teams',
          chapterId: 'chapter-2',
          chapterTitle: 'Service layer và boundaries',
          positionMs: 860000,
          totalDurationMs: 1180000,
          lastPlayedAt: DateTime.utc(2026, 5, 12, 1, 0, 0),
          premiumFlag: false,
          coverImageAssetKey: 'cover-clean-architecture',
          authorName: 'Bảo Trần',
        ),
      ),
      _MockAudiobookRecord(
        summary: AudiobookSummary(
          id: 'book-system-design',
          title: 'System Design cho Knowledge Workers',
          description: 'Giải thích hệ thống theo cách thực dụng: scale, cache, search và vận hành sản phẩm nội dung.',
          coverImageAssetKey: 'cover-system-design',
          authorId: 'author-linh',
          authorName: 'Linh Phạm',
          narratorIds: ['narrator-2', 'narrator-3'],
          narratorNames: ['Hà My', 'Quang Huy'],
          categoryIds: ['cat-it'],
          categoryNames: ['IT'],
          tagNames: ['System Design', 'Scale', 'Caching'],
          durationSec: 21600,
          premiumFlag: true,
          status: 'PUBLISHED',
          isFeatured: true,
          isNew: true,
          languageCode: 'vi',
        ),
        detail: AudiobookDetail(
          id: 'book-system-design',
          title: 'System Design cho Knowledge Workers',
          description: 'Giải thích hệ thống theo cách thực dụng: scale, cache, search và vận hành sản phẩm nội dung.',
          coverImageAssetKey: 'cover-system-design',
          authorId: 'author-linh',
          authorName: 'Linh Phạm',
          narratorIds: ['narrator-2', 'narrator-3'],
          narratorNames: ['Hà My', 'Quang Huy'],
          categoryIds: ['cat-it'],
          categoryNames: ['IT'],
          tagNames: ['System Design', 'Scale', 'Caching'],
          durationSec: 21600,
          premiumFlag: true,
          status: 'PUBLISHED',
          isFeatured: true,
          isNew: true,
          languageCode: 'vi',
          chapters: <AudiobookChapter>[
            AudiobookChapter(
              id: 'chapter-1',
              title: 'Kiến trúc tổng quan',
              orderIndex: 1,
              durationSec: 840,
              audioAssetKey: 'audio/book-system-design/chapter-1.mp3',
              transcript: null,
              status: 'PUBLISHED',
            ),
            AudiobookChapter(
              id: 'chapter-2',
              title: 'Search và indexing',
              orderIndex: 2,
              durationSec: 1120,
              audioAssetKey: 'audio/book-system-design/chapter-2.mp3',
              transcript: null,
              status: 'PUBLISHED',
            ),
            AudiobookChapter(
              id: 'chapter-3',
              title: 'Observability và vận hành',
              orderIndex: 3,
              durationSec: 1020,
              audioAssetKey: 'audio/book-system-design/chapter-3.mp3',
              transcript: null,
              status: 'PUBLISHED',
            ),
          ],
        ),
        progress: null,
      ),
      _MockAudiobookRecord(
        summary: AudiobookSummary(
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
          tagNames: ['Language', 'JLPT', 'Listening'],
          durationSec: 13200,
          premiumFlag: false,
          status: 'PUBLISHED',
          isFeatured: false,
          isNew: true,
          languageCode: 'ja',
        ),
        detail: AudiobookDetail(
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
          tagNames: ['Language', 'JLPT', 'Listening'],
          durationSec: 13200,
          premiumFlag: false,
          status: 'PUBLISHED',
          isFeatured: false,
          isNew: true,
          languageCode: 'ja',
          chapters: <AudiobookChapter>[
            AudiobookChapter(
              id: 'chapter-1',
              title: 'Chào hỏi tự nhiên',
              orderIndex: 1,
              durationSec: 780,
              audioAssetKey: 'audio/book-japanese-listening/chapter-1.mp3',
              transcript: null,
              status: 'PUBLISHED',
            ),
            AudiobookChapter(
              id: 'chapter-2',
              title: 'Mẫu câu trong công việc',
              orderIndex: 2,
              durationSec: 900,
              audioAssetKey: 'audio/book-japanese-listening/chapter-2.mp3',
              transcript: null,
              status: 'PUBLISHED',
            ),
          ],
        ),
        progress: null,
      ),
      _MockAudiobookRecord(
        summary: AudiobookSummary(
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
          tagNames: ['Retention', 'Habit', 'Self-development'],
          durationSec: 15600,
          premiumFlag: true,
          status: 'PUBLISHED',
          isFeatured: false,
          isNew: false,
          languageCode: 'vi',
        ),
        detail: AudiobookDetail(
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
          tagNames: ['Retention', 'Habit', 'Self-development'],
          durationSec: 15600,
          premiumFlag: true,
          status: 'PUBLISHED',
          isFeatured: false,
          isNew: false,
          languageCode: 'vi',
          chapters: <AudiobookChapter>[
            AudiobookChapter(
              id: 'chapter-1',
              title: 'Vòng lặp hành vi',
              orderIndex: 1,
              durationSec: 840,
              audioAssetKey: 'audio/book-habit-system/chapter-1.mp3',
              transcript: null,
              status: 'PUBLISHED',
            ),
            AudiobookChapter(
              id: 'chapter-2',
              title: 'Thiết kế continue listening',
              orderIndex: 2,
              durationSec: 920,
              audioAssetKey: 'audio/book-habit-system/chapter-2.mp3',
              transcript: null,
              status: 'PUBLISHED',
            ),
          ],
        ),
        progress: null,
      ),
    ];
  }
}

class _MockAudiobookRecord {
  final AudiobookSummary summary;
  final AudiobookDetail detail;
  final ListeningProgress? progress;

  const _MockAudiobookRecord({
    required this.summary,
    required this.detail,
    required this.progress,
  });
}

class _CategoryBucket {
  final String id;
  final String name;
  int count = 0;

  _CategoryBucket({
    required this.id,
    required this.name,
  });
}
