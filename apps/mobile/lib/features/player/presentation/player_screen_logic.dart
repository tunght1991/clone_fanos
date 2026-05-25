import '../../discovery/domain/discovery_models.dart';

class TranscriptEntry {
  final Duration? timestamp;
  final String text;

  const TranscriptEntry({
    required this.timestamp,
    required this.text,
  });

  bool get hasTimestamp => timestamp != null;
}

bool isPlayableChapter(AudiobookChapter chapter) {
  return chapter.status.toUpperCase() == 'PUBLISHED';
}

List<AudiobookChapter> filterPlayableChapters(List<AudiobookChapter> chapters) {
  return chapters.where(isPlayableChapter).toList();
}

AudiobookChapter? findPlayableChapterById(
  List<AudiobookChapter> chapters,
  String? chapterId,
) {
  if (chapterId == null) {
    return null;
  }

  for (final chapter in chapters) {
    if (chapter.id == chapterId && isPlayableChapter(chapter)) {
      return chapter;
    }
  }

  return null;
}

AudiobookChapter? resolveInitialPlayableChapter(
  List<AudiobookChapter> chapters, {
  String? requestedChapterId,
  String? fallbackChapterId,
}) {
  final requested = findPlayableChapterById(chapters, requestedChapterId);
  if (requested != null) {
    return requested;
  }

  final fallback = findPlayableChapterById(chapters, fallbackChapterId);
  if (fallback != null) {
    return fallback;
  }

  final playableChapters = filterPlayableChapters(chapters);
  if (playableChapters.isEmpty) {
    return null;
  }

  return playableChapters.first;
}

AudiobookChapter? findAdjacentPlayableChapter(
  List<AudiobookChapter> chapters,
  String activeChapterId, {
  required int direction,
}) {
  if (direction == 0) {
    return null;
  }

  final ordered = [...chapters]
    ..sort((left, right) => left.orderIndex.compareTo(right.orderIndex));
  final currentIndex =
      ordered.indexWhere((chapter) => chapter.id == activeChapterId);
  if (currentIndex < 0) {
    return null;
  }

  var index = currentIndex + direction;
  while (index >= 0 && index < ordered.length) {
    final candidate = ordered[index];
    if (isPlayableChapter(candidate)) {
      return candidate;
    }
    index += direction;
  }

  return null;
}

List<TranscriptEntry> parseTranscript(String? transcript) {
  final raw = transcript?.trim();
  if (raw == null || raw.isEmpty) {
    return const <TranscriptEntry>[];
  }

  final entries = <TranscriptEntry>[];
  final buffer = <String>[];
  TranscriptEntry? currentTimedEntry;

  for (final line in raw.split(RegExp(r'\r?\n'))) {
    final trimmed = line.trim();
    if (trimmed.isEmpty) {
      _flushTimedEntry(entries, currentTimedEntry);
      currentTimedEntry = null;
      _flushBufferedParagraph(entries, buffer);
      continue;
    }

    final parsed = _parseTranscriptLine(trimmed);
    if (parsed == null) {
      if (currentTimedEntry != null) {
        currentTimedEntry = TranscriptEntry(
          timestamp: currentTimedEntry.timestamp,
          text: '${currentTimedEntry.text} $trimmed'.trim(),
        );
        continue;
      }

      buffer.add(trimmed);
      continue;
    }

    _flushTimedEntry(entries, currentTimedEntry);
    currentTimedEntry = parsed;
    _flushBufferedParagraph(entries, buffer);
  }

  _flushTimedEntry(entries, currentTimedEntry);
  _flushBufferedParagraph(entries, buffer);
  return entries;
}

void _flushTimedEntry(
  List<TranscriptEntry> entries,
  TranscriptEntry? entry,
) {
  if (entry == null) {
    return;
  }

  entries.add(entry);
}

void _flushBufferedParagraph(
    List<TranscriptEntry> entries, List<String> buffer) {
  if (buffer.isEmpty) {
    return;
  }

  entries.add(
    TranscriptEntry(
      timestamp: null,
      text: buffer.join(' '),
    ),
  );
  buffer.clear();
}

TranscriptEntry? _parseTranscriptLine(String line) {
  final match = RegExp(
    r'^(?:\[(\d{1,2}:\d{2}(?::\d{2})?)\]|(\d{1,2}:\d{2}(?::\d{2})?))(?:\s*[-|]\s*|\s+)?(.*)$',
  ).firstMatch(line);
  if (match == null) {
    return null;
  }

  final timestampText = match.group(1) ?? match.group(2);
  final text = match.group(3)?.trim() ?? '';
  final timestamp = _parseTimestamp(timestampText);
  if (timestamp == null) {
    return null;
  }

  return TranscriptEntry(
    timestamp: timestamp,
    text: text.isEmpty ? line : text,
  );
}

Duration? _parseTimestamp(String? timestampText) {
  if (timestampText == null || timestampText.isEmpty) {
    return null;
  }

  final parts = timestampText.split(':').map(int.parse).toList();
  if (parts.length == 2) {
    return Duration(minutes: parts[0], seconds: parts[1]);
  }

  if (parts.length == 3) {
    return Duration(hours: parts[0], minutes: parts[1], seconds: parts[2]);
  }

  return null;
}

String formatTranscriptTimestamp(Duration timestamp) {
  final hours = timestamp.inHours;
  final minutes = timestamp.inMinutes.remainder(60);
  final seconds = timestamp.inSeconds.remainder(60);

  if (hours > 0) {
    return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
}
