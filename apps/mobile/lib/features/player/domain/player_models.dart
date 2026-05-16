class PlaybackProgressState {
  final String audiobookId;
  final String chapterId;
  final int positionMs;
  final bool completed;
  final DateTime? lastPlayedAt;
  final DateTime updatedAt;

  const PlaybackProgressState({
    required this.audiobookId,
    required this.chapterId,
    required this.positionMs,
    required this.completed,
    required this.lastPlayedAt,
    required this.updatedAt,
  });
}

class AudioAssetAccess {
  final String provider;
  final String url;
  final DateTime expiresAt;
  final bool streamable;
  final bool offlineCapable;
  final Map<String, String> headers;

  const AudioAssetAccess({
    required this.provider,
    required this.url,
    required this.expiresAt,
    required this.streamable,
    required this.offlineCapable,
    required this.headers,
  });
}

