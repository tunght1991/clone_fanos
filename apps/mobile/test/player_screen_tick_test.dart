import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/features/player/presentation/player_screen.dart';

void main() {
  test('advancePlaybackTick counts the last tick before sleep timer stops playback', () {
    final result = advancePlaybackTick(
      currentPositionMs: 1000,
      chapterDurationMs: 10000,
      speed: 1.0,
      sleepTimer: const Duration(seconds: 1),
    );

    expect(result.positionMs, 2000);
    expect(result.sleepTimer, isNull);
    expect(result.shouldPause, isTrue);
    expect(result.completed, isFalse);
  });
}
