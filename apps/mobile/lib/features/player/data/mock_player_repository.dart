import '../domain/player_models.dart';
import '../domain/player_repository.dart';

class MockPlayerRepository implements PlayerRepository {
  final Map<String, PlaybackProgressState> _progressByAudiobookId = <String, PlaybackProgressState>{
    'book-clean-architecture': PlaybackProgressState(
      audiobookId: 'book-clean-architecture',
      chapterId: 'chapter-2',
      positionMs: 860000,
      completed: false,
      lastPlayedAt: DateTime.utc(2026, 5, 12, 1, 0, 0),
      updatedAt: DateTime.utc(2026, 5, 12, 1, 0, 0),
    ),
  };

  @override
  Future<PlaybackProgressState?> getProgress({
    required String audiobookId,
    required String? userId,
    required String? accessToken,
  }) async {
    return _progressByAudiobookId[audiobookId];
  }

  @override
  Future<PlaybackProgressState> saveProgress({
    required String audiobookId,
    required String chapterId,
    required int positionMs,
    required bool completed,
    required String? userId,
    required String? accessToken,
  }) async {
    final now = DateTime.now().toUtc();
    final progress = PlaybackProgressState(
      audiobookId: audiobookId,
      chapterId: chapterId,
      positionMs: positionMs,
      completed: completed,
      lastPlayedAt: now,
      updatedAt: now,
    );
    _progressByAudiobookId[audiobookId] = progress;
    return progress;
  }

  @override
  Future<AudioAssetAccess> getChapterAssetAccess({
    required String audioAssetKey,
    required String? userId,
    required String? accessToken,
  }) async {
    return AudioAssetAccess(
      provider: 'LOCALFILE',
      url: 'assets/audio/demo_chapter.wav',
      expiresAt: DateTime.now().toUtc().add(const Duration(minutes: 5)),
      streamable: true,
      offlineCapable: true,
    );
  }
}
