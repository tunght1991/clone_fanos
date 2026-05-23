import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/core/network/api_transport.dart';
import 'package:clone_fanos_mobile/features/discovery/data/http_discovery_repository.dart';

void main() {
  test(
      'HttpDiscoveryRepository parses browse feed sections and continue listening',
      () async {
    final transport = _FakeTransport(
      getResponse: const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "data": [
            {
              "id": "book-featured",
              "title": "Featured Book",
              "description": "Desc",
              "coverImageAssetKey": "cover-1",
              "author": { "id": "author-1", "name": "Author 1" },
              "narrators": [
                { "id": "narrator-1", "name": "Narrator 1" }
              ],
              "categoryIds": ["cat-1"],
              "categoryNames": ["Category 1"],
              "tagNames": ["Tag 1", "Tag 2"],
              "durationSec": 3600,
              "premiumFlag": true,
              "status": "PUBLISHED",
              "isFeatured": true,
              "isNew": false,
              "languageCode": "vi"
            },
            {
              "id": "book-new",
              "title": "New Book",
              "description": "Desc",
              "coverImageAssetKey": "cover-2",
              "author": { "id": "author-2", "name": "Author 2" },
              "narrators": [],
              "categoryIds": ["cat-2"],
              "categoryNames": ["Category 2"],
              "tagNames": [],
              "durationSec": 4200,
              "premiumFlag": false,
              "status": "PUBLISHED",
              "isFeatured": false,
              "isNew": true,
              "languageCode": "en"
            }
          ],
          "continueListening": {
            "audiobookId": "book-featured",
            "audiobookTitle": "Featured Book",
            "chapterId": "chapter-2",
            "chapterTitle": "Chapter 2",
            "positionMs": 860000,
            "totalDurationMs": 1180000,
            "lastPlayedAt": "2026-05-12T01:00:00.000Z",
            "premiumFlag": true,
            "coverImageAssetKey": "cover-1",
            "authorName": "Author 1"
          }
        }
        ''',
      ),
    );
    final repository = HttpDiscoveryRepository(
      baseUri: Uri.parse('http://localhost:3000'),
      transport: transport,
    );

    final feed = await repository.getBrowseFeed();

    expect(feed.categories, hasLength(2));
    expect(feed.featured, hasLength(1));
    expect(feed.newReleases, hasLength(1));
    expect(feed.featured.single.isFeatured, isTrue);
    expect(feed.newReleases.single.isNew, isTrue);
    expect(feed.continueListening, isNotNull);
    expect(feed.continueListening?.audiobookId, 'book-featured');
    expect(feed.continueListening?.chapterId, 'chapter-2');
    expect(feed.continueListening?.progressFraction, closeTo(0.7288, 0.001));
  });
}

class _FakeTransport implements ApiTransport {
  final ApiResponse? getResponse;

  _FakeTransport({
    this.getResponse,
  });

  @override
  Future<ApiResponse> delete(
    Uri uri, {
    Map<String, String>? headers,
  }) async {
    return const ApiResponse(statusCode: 200, body: '');
  }

  @override
  Future<ApiResponse> get(
    Uri uri, {
    Map<String, String>? headers,
  }) async {
    return getResponse ?? const ApiResponse(statusCode: 404, body: '');
  }

  @override
  Future<ApiResponse> postJson(
    Uri uri,
    Object body, {
    Map<String, String>? headers,
  }) async {
    return const ApiResponse(statusCode: 200, body: '{}');
  }
}
