import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/features/player/domain/player_models.dart';

void main() {
  test('describeAudioAssetAccess returns streaming-only copy for streamable assets without offline access', () {
    final access = AudioAssetAccess(
      provider: 'CDN',
      url: 'https://cdn.clonefanos.local/audio/demo_chapter.wav',
      expiresAt: DateTime.utc(2026, 5, 26, 0, 5, 0),
      streamable: true,
      offlineCapable: false,
    );

    expect(describeAudioAssetAccess(access), 'Streaming only');
  });

  test('describeAudioAssetAccess returns available-offline copy when offline playback is allowed', () {
    final access = AudioAssetAccess(
      provider: 'CDN',
      url: 'https://cdn.clonefanos.local/audio/demo_chapter.wav',
      expiresAt: DateTime.utc(2026, 5, 26, 0, 5, 0),
      streamable: true,
      offlineCapable: true,
    );

    expect(describeAudioAssetAccess(access), 'Available offline');
  });
}
