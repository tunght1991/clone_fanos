import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/features/engagement/data/mock_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/engagement/domain/engagement_models.dart';

void main() {
  test('MockEngagementRepository seeds bookmarks and favorites', () async {
    final repository = MockEngagementRepository();

    final bookmarks = await repository.listBookmarks();
    final favorites = await repository.listFavorites();

    expect(bookmarks, hasLength(1));
    expect(favorites, hasLength(1));
    expect(await repository.isFavorite('book-clean-architecture'), isTrue);
  });

  test('MockEngagementRepository creates and deletes bookmarks', () async {
    final repository = MockEngagementRepository();

    final created = await repository.createBookmark(
      const BookmarkCreateRequest(
        audiobookId: 'book-dynamic-systems',
        chapterId: 'chapter-99',
        positionMs: 125000,
        note: 'Review this part later',
      ),
    );

    expect(created.audiobookId, 'book-dynamic-systems');
    expect(created.chapterId, 'chapter-99');

    final afterCreate = await repository.listBookmarks(audiobookId: 'book-dynamic-systems');
    expect(afterCreate, hasLength(1));

    final deleted = await repository.deleteBookmark(created.id);
    expect(deleted, isTrue);
    expect(await repository.listBookmarks(audiobookId: 'book-dynamic-systems'), isEmpty);
  });

  test('MockEngagementRepository toggles favorites', () async {
    final repository = MockEngagementRepository();

    final removed = await repository.toggleFavorite('book-clean-architecture');
    expect(removed.favorited, isFalse);
    expect(await repository.isFavorite('book-clean-architecture'), isFalse);

    final added = await repository.toggleFavorite('book-clean-architecture');
    expect(added.favorited, isTrue);
    expect(await repository.isFavorite('book-clean-architecture'), isTrue);
  });
}
