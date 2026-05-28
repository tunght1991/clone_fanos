import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/features/player/data/mock_player_repository.dart';

void main() {
  test('MockPlayerRepository returns seeded resume progress', () async {
    final repository = MockPlayerRepository();

    final progress = await repository.getProgress(
      audiobookId: 'book-clean-architecture',
      userId: 'user-demo',
      accessToken: 'access-token',
    );

    expect(progress, isNotNull);
    expect(progress?.chapterId, 'chapter-2');
    expect(progress?.positionMs, 860000);
  });

  test('MockPlayerRepository resolves audio asset access', () async {
    final repository = MockPlayerRepository();

    final access = await repository.getChapterAssetAccess(
      audioAssetKey: 'audio/book-clean-architecture/chapter-2.mp3',
      userId: 'user-demo',
      accessToken: 'access-token',
    );

    expect(access.provider, 'CDN');
    expect(access.url, startsWith('https://cdn.clonefanos.local/audio/'));
    expect(access.streamable, isTrue);
    expect(access.offlineCapable, isFalse);
  });
}
