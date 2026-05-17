import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/features/discovery/data/mock_discovery_repository.dart';
import 'package:clone_fanos_mobile/features/discovery/domain/discovery_repository.dart';

void main() {
  test('MockDiscoveryRepository returns browse feed with categories and continue listening', () async {
    final repository = MockDiscoveryRepository();

    final feed = await repository.getBrowseFeed();

    expect(feed.categories, isNotEmpty);
    expect(feed.featured, isNotEmpty);
    expect(feed.continueListening, isNotNull);
  });

  test('MockDiscoveryRepository searches by author, narrator and tag text', () async {
    final repository = MockDiscoveryRepository();

    final page = await repository.searchAudiobooks(
      const DiscoverySearchRequest(query: 'clean architecture'),
    );

    expect(page.items, isNotEmpty);
    expect(page.items.first.title, contains('Clean Architecture'));
  });

  test('MockDiscoveryRepository filters by premium flag', () async {
    final repository = MockDiscoveryRepository();

    final page = await repository.searchAudiobooks(
      const DiscoverySearchRequest(query: 'system', premiumFlag: true),
    );

    expect(page.items, isNotEmpty);
    expect(page.items.every((item) => item.premiumFlag), isTrue);
  });

  test('MockDiscoveryRepository sorts by title ascending and descending', () async {
    final repository = MockDiscoveryRepository();

    final ascPage = await repository.searchAudiobooks(
      const DiscoverySearchRequest(
        query: 'cho',
        sortBy: discoverySearchSortByTitle,
        sortOrder: discoverySearchSortOrderAsc,
      ),
    );
    final descPage = await repository.searchAudiobooks(
      const DiscoverySearchRequest(
        query: 'cho',
        sortBy: discoverySearchSortByTitle,
        sortOrder: discoverySearchSortOrderDesc,
      ),
    );

    expect(ascPage.items.first.title, 'Clean Architecture cho Product Teams');
    expect(descPage.items.first.title, 'System Design cho Knowledge Workers');
  });
}
