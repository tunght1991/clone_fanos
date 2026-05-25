import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/core/network/api_transport.dart';
import 'package:clone_fanos_mobile/features/player/data/http_player_repository.dart';

void main() {
  test('HttpPlayerRepository parses progress and asset access responses',
      () async {
    final transport = _FakeTransport(
      getResponse: const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "data": {
            "audiobookId": "book-1",
            "chapterId": "chapter-2",
            "positionMs": 860000,
            "completed": false,
            "lastPlayedAt": "2026-05-12T01:00:00.000Z",
            "updatedAt": "2026-05-12T02:00:00.000Z"
          }
        }
        ''',
      ),
      postResponse: const ApiResponse(
        statusCode: 200,
        body: '''
        {
          "data": {
            "provider": "CDN",
            "url": "https://cdn.example/audio.mp3",
            "expiresAt": "2026-05-12T03:00:00.000Z",
            "streamable": true,
            "offlineCapable": false
          }
        }
        ''',
      ),
    );
    final repository = HttpPlayerRepository(
      baseUri: Uri.parse('http://localhost:3000'),
      transport: transport,
    );

    final progress = await repository.getProgress(
      audiobookId: 'book-1',
      userId: 'user-1',
      accessToken: 'access-1',
    );
    final access = await repository.getChapterAssetAccess(
      audioAssetKey: 'asset-1',
      userId: 'user-1',
      accessToken: 'access-1',
    );

    expect(progress?.chapterId, 'chapter-2');
    expect(progress?.positionMs, 860000);
    expect(access.url, 'https://cdn.example/audio.mp3');
    expect(transport.lastGetHeaders?['Authorization'], 'Bearer access-1');
    expect(transport.lastPostHeaders?['x-user-id'], 'user-1');
  });
}

class _FakeTransport implements ApiTransport {
  final ApiResponse? getResponse;
  final ApiResponse? postResponse;
  Map<String, String>? lastGetHeaders;
  Map<String, String>? lastPostHeaders;

  _FakeTransport({
    this.getResponse,
    this.postResponse,
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
    lastGetHeaders = headers;
    return getResponse ?? const ApiResponse(statusCode: 404, body: '');
  }

  @override
  Future<ApiResponse> postJson(
    Uri uri,
    Object body, {
    Map<String, String>? headers,
  }) async {
    lastPostHeaders = headers;
    return postResponse ?? const ApiResponse(statusCode: 200, body: '{}');
  }
}
