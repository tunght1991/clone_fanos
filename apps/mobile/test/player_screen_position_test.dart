import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/features/player/presentation/player_screen.dart';

void main() {
  test('resolvePlaybackPosition prefers audio currentTime and clamps to chapter duration', () {
    expect(
      resolvePlaybackPosition(
        estimatedPositionMs: 1200,
        audioPositionMs: 1450,
        chapterDurationMs: 3000,
      ),
      1450,
    );

    expect(
      resolvePlaybackPosition(
        estimatedPositionMs: 1200,
        audioPositionMs: 9999,
        chapterDurationMs: 3000,
      ),
      3000,
    );
  });

  test('resolvePlaybackPosition falls back to estimated position when audio position is unavailable', () {
    expect(
      resolvePlaybackPosition(
        estimatedPositionMs: 1200,
        audioPositionMs: null,
        chapterDurationMs: 3000,
      ),
      1200,
    );
  });
}
