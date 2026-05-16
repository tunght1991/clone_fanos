import 'dart:async';
import 'dart:html' as html;

import 'player_audio_controller_base.dart';

class PlayerAudioController implements PlayerAudioControllerBase {
  final void Function()? onEnded;
  final void Function(Object error)? onError;
  final html.AudioElement _audio;
  StreamSubscription<html.Event>? _endedSubscription;
  StreamSubscription<html.Event>? _errorSubscription;

  PlayerAudioController({
    this.onEnded,
    this.onError,
  }) : _audio = html.AudioElement() {
    _audio.preload = 'auto';
    _audio.controls = false;
    _audio.defaultMuted = false;
    _endedSubscription = _audio.onEnded.listen((_) => onEnded?.call());
    _errorSubscription = _audio.onError.listen((event) {
      onError?.call(StateError('Audio playback error: ${_audio.error?.code ?? event.type}'));
    });
  }

  @override
  Future<void> load(String sourceUrl) async {
    _audio.pause();
    _audio.src = sourceUrl;
    _audio.load();
  }

  @override
  Future<void> play() async {
    await _audio.play();
  }

  @override
  Future<void> pause() async {
    _audio.pause();
  }

  @override
  Future<void> seek(Duration position) async {
    _audio.currentTime = position.inMilliseconds / 1000.0;
  }

  @override
  Future<int?> readCurrentPositionMs() async {
    final currentTime = _audio.currentTime;
    if (currentTime.isNaN || currentTime.isInfinite) {
      return null;
    }

    return (currentTime * 1000).round();
  }

  @override
  Future<void> setPlaybackRate(double rate) async {
    _audio.playbackRate = rate;
  }

  @override
  Future<void> dispose() async {
    await _endedSubscription?.cancel();
    await _errorSubscription?.cancel();
    _audio.pause();
    _audio.src = '';
    _audio.load();
    _audio.remove();
  }
}
