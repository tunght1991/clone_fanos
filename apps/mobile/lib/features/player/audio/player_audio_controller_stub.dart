import 'player_audio_controller_base.dart';

class PlayerAudioController implements PlayerAudioControllerBase {
  final void Function()? onEnded;
  final void Function(Object error)? onError;

  PlayerAudioController({
    this.onEnded,
    this.onError,
  });

  @override
  Future<void> load(String sourceUrl) async {}

  @override
  Future<void> play() async {}

  @override
  Future<void> pause() async {}

  @override
  Future<void> seek(Duration position) async {}

  @override
  Future<int?> readCurrentPositionMs() async => null;

  @override
  Future<void> setPlaybackRate(double rate) async {}

  @override
  Future<void> dispose() async {}
}
