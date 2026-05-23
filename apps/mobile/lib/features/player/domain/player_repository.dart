import '../../../app/app_config.dart';
import 'player_models.dart';
import '../data/http_player_repository.dart';
import '../data/mock_player_repository.dart';

abstract class PlayerRepository {
  Future<PlaybackProgressState?> getProgress({
    required String audiobookId,
    required String? userId,
    required String? accessToken,
  });

  Future<PlaybackProgressState> saveProgress({
    required String audiobookId,
    required String chapterId,
    required int positionMs,
    required bool completed,
    required String? userId,
    required String? accessToken,
  });

  Future<AudioAssetAccess> getChapterAssetAccess({
    required String audioAssetKey,
    required String? userId,
    required String? accessToken,
  });
}

PlayerRepository createPlayerRepository(AppConfig config) {
  if (shouldUseMockRepositories(config)) {
    return MockPlayerRepository();
  }

  return HttpPlayerRepository(baseUri: config.apiBaseUri);
}
