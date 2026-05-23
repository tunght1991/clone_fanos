import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/core/network/api_transport.dart';
import 'package:clone_fanos_mobile/features/engagement/data/http_engagement_repository.dart';
import 'package:clone_fanos_mobile/features/engagement/domain/engagement_models.dart';

void main() {
  test('HttpEngagementRepository parses bookmarks and favorites responses',
      () async {
    final transport = _FakeTransport();
    final repository = HttpEngagementRepository(
      baseUri: Uri.parse('http://localhost:3000'),
      transport: transport,
    );

    final bookmarks = await repository.listBookmarks(
      audiobookId: 'book-1',
      userId: 'user-1',
      accessToken: 'access-1',
    );
    final created = await repository.createBookmark(
      const BookmarkCreateRequest(
        audiobookId: 'book-1',
        chapterId: 'chapter-2',
        positionMs: 860000,
        note: 'Resume here',
      ),
      userId: 'user-1',
      accessToken: 'access-1',
    );
    final favorites = await repository.listFavorites(
      audiobookId: 'book-1',
      userId: 'user-1',
      accessToken: 'access-1',
    );
    final toggled = await repository.toggleFavorite(
      'book-2',
      userId: 'user-1',
      accessToken: 'access-1',
    );

    expect(bookmarks, hasLength(1));
    expect(bookmarks.single.id, 'bookmark-1');
    expect(bookmarks.single.chapterTitle, 'Chapter 2');
    expect(created.chapterId, 'chapter-2');
    expect(favorites, hasLength(1));
    expect(toggled.favorited, isTrue);
    expect(toggled.favorite.audiobookId, 'book-2');
    expect(transport.lastGetHeaders?['Authorization'], 'Bearer access-1');
  });
}

class _FakeTransport implements ApiTransport {
  Map<String, String>? lastGetHeaders;
  Map<String, String>? lastPostHeaders;

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
    lastGetHeaders = headers;
    if (uri.path.endsWith('/bookmarks')) {
      return const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "data": [
            {
              "id": "bookmark-1",
              "audiobookId": "book-1",
              "audiobookTitle": "Book 1",
              "audiobookCoverImageAssetKey": "cover-1",
              "authorName": "Author 1",
              "chapterId": "chapter-2",
              "chapterTitle": "Chapter 2",
              "positionMs": 860000,
              "note": "Resume here",
              "createdAt": "2026-05-12T01:00:00.000Z"
            }
          ]
        }
        ''',
      );
    }

    if (uri.path.endsWith('/favorites') &&
        uri.queryParameters['audiobookId'] == 'book-1') {
      return const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "data": [
            {
              "id": "favorite-1",
              "audiobookId": "book-1",
              "audiobookTitle": "Book 1",
              "audiobookCoverImageAssetKey": "cover-1",
              "authorName": "Author 1",
              "durationSec": 3600,
              "premiumFlag": false,
              "createdAt": "2026-05-12T01:00:00.000Z"
            }
          ]
        }
        ''',
      );
    }

    if (uri.path.endsWith('/favorites') &&
        uri.queryParameters['audiobookId'] == 'book-2') {
      return const ApiResponse(
        statusCode: 200,
        body: '{"data":[]}',
      );
    }

    return const ApiResponse(statusCode: 404, body: '');
  }

  @override
  Future<ApiResponse> postJson(
    Uri uri,
    Object body, {
    Map<String, String>? headers,
  }) async {
    lastPostHeaders = headers;
    if (uri.path.endsWith('/bookmarks')) {
      return const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "id": "bookmark-created",
          "audiobookId": "book-1",
          "audiobookTitle": "Book 1",
          "audiobookCoverImageAssetKey": "cover-1",
          "authorName": "Author 1",
          "chapterId": "chapter-2",
          "chapterTitle": "Chapter 2",
          "positionMs": 860000,
          "createdAt": "2026-05-12T01:00:00.000Z"
        }
        ''',
      );
    }

    if (uri.path.contains('/favorites/')) {
      return const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "favorite": {
            "id": "favorite-2",
            "audiobookId": "book-2",
            "audiobookTitle": "Book 2",
            "audiobookCoverImageAssetKey": "cover-2",
            "authorName": "Author 2",
            "durationSec": 3600,
            "premiumFlag": true,
            "createdAt": "2026-05-12T01:00:00.000Z"
          }
        }
        ''',
      );
    }

    return const ApiResponse(statusCode: 200, body: '{}');
  }
}
