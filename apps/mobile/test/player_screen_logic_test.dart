import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/features/discovery/domain/discovery_models.dart';
import 'package:clone_fanos_mobile/features/player/presentation/player_screen_logic.dart';

void main() {
  test('parseTranscript reads timestamps and freeform paragraphs', () {
    final entries = parseTranscript('''
00:00 Start here.
More context on the same point.

[00:25] Next idea.
00:40 - Final note.
''');

    expect(entries, hasLength(3));
    expect(entries.first.timestamp, const Duration(seconds: 0));
    expect(entries.first.text, 'Start here. More context on the same point.');
    expect(entries[1].timestamp, const Duration(seconds: 25));
    expect(entries[1].text, 'Next idea.');
    expect(entries[2].timestamp, const Duration(seconds: 40));
    expect(entries[2].text, 'Final note.');
  });

  test('findAdjacentPlayableChapter skips unpublished chapters', () {
    final chapters = <AudiobookChapter>[
      const AudiobookChapter(
        id: 'chapter-1',
        title: 'One',
        orderIndex: 1,
        durationSec: 60,
        audioAssetKey: 'audio/1.mp3',
        transcript: null,
        status: 'PUBLISHED',
      ),
      const AudiobookChapter(
        id: 'chapter-2',
        title: 'Two',
        orderIndex: 2,
        durationSec: 60,
        audioAssetKey: 'audio/2.mp3',
        transcript: null,
        status: 'DRAFT',
      ),
      const AudiobookChapter(
        id: 'chapter-3',
        title: 'Three',
        orderIndex: 3,
        durationSec: 60,
        audioAssetKey: 'audio/3.mp3',
        transcript: null,
        status: 'PUBLISHED',
      ),
    ];

    expect(
      findAdjacentPlayableChapter(chapters, 'chapter-1', direction: 1)?.id,
      'chapter-3',
    );
    expect(
      findAdjacentPlayableChapter(chapters, 'chapter-3', direction: -1)?.id,
      'chapter-1',
    );
    expect(
      findAdjacentPlayableChapter(chapters, 'chapter-3', direction: 1),
      isNull,
    );
  });
}
