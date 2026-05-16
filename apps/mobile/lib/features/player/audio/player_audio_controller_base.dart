abstract class PlayerAudioControllerBase {
  Future<void> load(String sourceUrl);

  Future<void> play();

  Future<void> pause();

  Future<void> seek(Duration position);

  Future<int?> readCurrentPositionMs();

  Future<void> setPlaybackRate(double rate);

  Future<void> dispose();
}
