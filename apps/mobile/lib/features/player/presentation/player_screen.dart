import 'dart:async';

import 'package:flutter/material.dart';

import '../../auth/state/app_state.dart';
import '../audio/player_audio_controller.dart';
import '../../engagement/domain/engagement_models.dart';
import '../../discovery/domain/discovery_models.dart';
import '../../player/domain/player_models.dart';
import '../../subscription/domain/subscription_models.dart';
import '../../../shared/ui/clone_fanos_primitives.dart';
import '../../../app/app_theme.dart';

class PlayerScreen extends StatefulWidget {
  final AppState appState;
  final String audiobookId;
  final AudiobookDetail? initialDetail;
  final String? initialChapterId;
  final int? initialPositionMs;
  final bool autoplay;

  const PlayerScreen({
    super.key,
    required this.appState,
    required this.audiobookId,
    this.initialDetail,
    this.initialChapterId,
    this.initialPositionMs,
    this.autoplay = true,
  });

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  late Future<_LoadedPlayerData> _bootstrapFuture;
  _LoadedPlayerData? _data;
  PlayerStatus _status = PlayerStatus.loading;
  Timer? _tickTimer;
  Timer? _syncTimer;
  Duration? _sleepTimer;
  double _speed = 1.0;
  int _positionMs = 0;
  AudioAssetAccess? _assetAccess;
  String? _errorMessage;
  bool _firstPlayTriggered = false;
  bool _hasLoadedData = false;
  late final PlayerAudioControllerBase _audioController;
  Future<void>? _audioLoadFuture;
  String? _loadedAudioUrl;

  @override
  void initState() {
    super.initState();
    _audioController = PlayerAudioController(
      onEnded: _handleAudioEnded,
      onError: _handleAudioError,
    );
    widget.appState.addListener(_handleAppStateChanged);
    _bootstrapFuture = _loadInitialData();
  }

  @override
  void dispose() {
    _tickTimer?.cancel();
    _syncTimer?.cancel();
    unawaited(_audioController.dispose());
    widget.appState.removeListener(_handleAppStateChanged);
    super.dispose();
  }

  void _handleAppStateChanged() {
    if (!mounted) {
      return;
    }
    setState(() {});
  }

  Future<_LoadedPlayerData> _loadInitialData() async {
    final detail = widget.initialDetail ?? await widget.appState.contentRepository.getAudiobookDetail(widget.audiobookId);
    if (detail == null) {
      throw StateError('Audiobook not found');
    }
    if (detail.chapters.isEmpty) {
      throw StateError('Audiobook has no chapters');
    }

    final resumeProgress = await widget.appState.playerRepository.getProgress(
      audiobookId: widget.audiobookId,
      userId: widget.appState.currentUserId,
      accessToken: widget.appState.accessToken,
    );
    final preferredChapterId = widget.initialChapterId ?? resumeProgress?.chapterId;
    final chapter = detail.chapters.firstWhere(
      (item) => item.id == preferredChapterId,
      orElse: () => detail.chapters.first,
    );
    final initialPosition = widget.initialPositionMs ?? resumeProgress?.positionMs ?? 0;
    final assetAccess = await widget.appState.playerRepository.getChapterAssetAccess(
      audioAssetKey: chapter.audioAssetKey,
      userId: widget.appState.currentUserId,
      accessToken: widget.appState.accessToken,
    );

    return _LoadedPlayerData(
      detail: detail,
      chapter: chapter,
      resumeProgress: resumeProgress,
      assetAccess: assetAccess,
      initialPositionMs: initialPosition,
    );
  }

  bool _isPremiumLocked(_LoadedPlayerData data) {
    final subscription = widget.appState.currentSubscription;
    return data.detail.premiumFlag && !(subscription?.entitlement.canAccessPremium ?? false);
  }

  Future<void> _prepareAudioSource() {
    final access = _assetAccess;
    if (access == null) {
      return Future.value();
    }

    if (_audioLoadFuture != null) {
      return _audioLoadFuture!;
    }

    if (_loadedAudioUrl == access.url) {
      return _audioController.seek(Duration(milliseconds: _positionMs));
    }

    _loadedAudioUrl = access.url;
    _audioLoadFuture = () async {
      await _audioController.load(access.url);
      await _audioController.setPlaybackRate(_speed);
      await _audioController.seek(Duration(milliseconds: _positionMs));
    }();

    return _audioLoadFuture!.whenComplete(() {
      _audioLoadFuture = null;
    });
  }

  void _handleAudioEnded() {
    final data = _data;
    if (!mounted || data == null) {
      return;
    }

    _tickTimer?.cancel();
    _syncTimer?.cancel();
    unawaited(() async {
      final currentPositionMs = await _readPlaybackPositionMs();
      if (!mounted) {
        return;
      }

      setState(() {
        _positionMs = currentPositionMs;
        _status = PlayerStatus.ended;
      });
      unawaited(_syncProgress(completed: true));
    }());
  }

  void _handleAudioError(Object error) {
    if (!mounted) {
      return;
    }

    setState(() {
      _errorMessage = error.toString();
      _status = PlayerStatus.offline;
    });
  }

  Future<void> _startPlayback() async {
    final data = _data;
    if (data == null || _isPremiumLocked(data)) {
      setState(() {
        _status = PlayerStatus.locked;
      });
      return;
    }

    if (_assetAccess == null) {
      setState(() {
        _status = PlayerStatus.buffering;
      });
      return;
    }

    setState(() {
      _status = PlayerStatus.buffering;
    });

    try {
      await _prepareAudioSource();
      await _audioController.setPlaybackRate(_speed);
      await _audioController.seek(Duration(milliseconds: _positionMs));
      await _audioController.play();
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = error.toString();
        _status = PlayerStatus.offline;
      });
      return;
    }

    if (!mounted) {
      return;
    }

    setState(() {
      _status = PlayerStatus.playing;
    });

    unawaited(
      widget.appState.trackAnalyticsEvent(
        _firstPlayTriggered ? 'playback_resumed' : 'chapter_started',
        payload: {
          'audiobookId': data.detail.id,
          'chapterId': data.chapter.id,
          'positionMs': _positionMs,
        },
      ),
    );
    _firstPlayTriggered = true;

    _tickTimer?.cancel();
    _tickTimer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(seconds: 5), (_) => _syncProgress());
  }

  Future<void> _pausePlayback({bool sync = true}) async {
    final data = _data;
    if (data == null) {
      return;
    }

    _tickTimer?.cancel();
    _syncTimer?.cancel();
    final currentPositionMs = await _readPlaybackPositionMs();
    if (mounted) {
      setState(() {
        _positionMs = currentPositionMs;
      });
    }
    await _audioController.pause();
    setState(() {
      _status = PlayerStatus.paused;
    });
    if (data != null) {
      unawaited(
        widget.appState.trackAnalyticsEvent(
          'playback_paused',
          payload: {
            'audiobookId': data.detail.id,
            'chapterId': data.chapter.id,
            'positionMs': currentPositionMs,
          },
        ),
      );
    }
    if (sync) {
      await _syncProgress();
    }
  }

  Future<void> _syncProgress({bool completed = false}) async {
    final data = _data;
    if (data == null || _isPremiumLocked(data)) {
      return;
    }

    final currentPositionMs = await _readPlaybackPositionMs();
    if (mounted) {
      setState(() {
        _positionMs = currentPositionMs;
      });
    }

    try {
      await widget.appState.playerRepository.saveProgress(
        audiobookId: data.detail.id,
        chapterId: data.chapter.id,
        positionMs: currentPositionMs,
        completed: completed,
        userId: widget.appState.currentUserId,
        accessToken: widget.appState.accessToken,
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = error.toString();
        if (_status == PlayerStatus.playing) {
          _status = PlayerStatus.offline;
        }
      });
    }

    if (completed) {
      unawaited(
        widget.appState.trackAnalyticsEvent(
          'chapter_completed',
          payload: {
            'audiobookId': data.detail.id,
            'chapterId': data.chapter.id,
            'positionMs': currentPositionMs,
          },
        ),
      );
    }
  }

  void _tick() {
    final data = _data;
    if (data == null || _status != PlayerStatus.playing) {
      return;
    }

    final update = advancePlaybackTick(
      currentPositionMs: _positionMs,
      chapterDurationMs: data.chapter.durationSec * 1000,
      speed: _speed,
      sleepTimer: _sleepTimer,
    );

    setState(() {
      _positionMs = update.positionMs;
      _sleepTimer = update.sleepTimer;
      if (update.completed) {
        _status = PlayerStatus.ended;
      }
    });

    if (update.completed) {
      _tickTimer?.cancel();
      _syncTimer?.cancel();
      unawaited(_syncProgress(completed: true));
    } else if (update.shouldPause) {
      unawaited(_pausePlayback());
    }
  }

  void _seekTo(int positionMs) {
    final data = _data;
    if (data == null) {
      return;
    }

    final next = positionMs.clamp(0, data.chapter.durationSec * 1000);
    setState(() {
      _positionMs = next;
    });
    unawaited(_audioController.seek(Duration(milliseconds: next)));
    unawaited(
      widget.appState.trackAnalyticsEvent(
        'playback_seeked',
        payload: {
          'audiobookId': data.detail.id,
          'chapterId': data.chapter.id,
          'positionMs': next,
        },
      ),
    );
    unawaited(_syncProgress());
  }

  void _skipBy(int deltaMs) {
    _seekTo(_positionMs + deltaMs);
  }

  void _setSpeed(double value) {
    setState(() {
      _speed = value;
    });
    unawaited(_audioController.setPlaybackRate(value));
  }

  void _setSleepTimer(Duration? duration) {
    setState(() {
      _sleepTimer = duration;
    });
  }

  Future<void> _switchChapter(AudiobookChapter chapter) async {
    final data = _data;
    if (data == null) {
      return;
    }

    setState(() {
      _status = PlayerStatus.buffering;
    });

    try {
      final assetAccess = await widget.appState.playerRepository.getChapterAssetAccess(
        audioAssetKey: chapter.audioAssetKey,
        userId: widget.appState.currentUserId,
        accessToken: widget.appState.accessToken,
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _data = data.copyWith(chapter: chapter, assetAccess: assetAccess, initialPositionMs: 0);
        _assetAccess = assetAccess;
        _positionMs = 0;
        _status = chapter.status == 'PUBLISHED' ? PlayerStatus.paused : PlayerStatus.error;
      });
      unawaited(_prepareAudioSource());
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = error.toString();
        _status = PlayerStatus.offline;
      });
    }
  }

  Future<int> _readPlaybackPositionMs() async {
    final data = _data;
    final audioPositionMs = await _audioController.readCurrentPositionMs();
    final chapterDurationMs = data?.chapter.durationSec == null ? 0 : data!.chapter.durationSec * 1000;
    return resolvePlaybackPosition(
      estimatedPositionMs: _positionMs,
      audioPositionMs: audioPositionMs,
      chapterDurationMs: chapterDurationMs,
    );
  }

  Future<void> _createBookmark() async {
    final data = _data;
    if (data == null || _isPremiumLocked(data)) {
      return;
    }

    try {
      await widget.appState.engagementRepository.createBookmark(
        BookmarkCreateRequest(
          audiobookId: data.detail.id,
          chapterId: data.chapter.id,
          positionMs: _positionMs,
        ),
        userId: widget.appState.currentUserId,
          accessToken: widget.appState.accessToken,
        );

      unawaited(
        widget.appState.trackAnalyticsEvent(
          'bookmark_created',
          payload: {
            'audiobookId': data.detail.id,
            'chapterId': data.chapter.id,
            'positionMs': _positionMs,
          },
        ),
      );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('?? l?u bookmark t?i ${_formatPosition(_positionMs)}'),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Kh?ng l?u ???c bookmark: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      appBar: AppBar(
        title: const Text('Player'),
        actions: [
          if (_data != null && _isPremiumLocked(_data!))
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8),
              child: Chip(label: Text('Premium locked')),
            ),
          if (_data != null && !_isPremiumLocked(_data!))
            IconButton(
              tooltip: 'Bookmark',
              onPressed: _createBookmark,
              icon: const Icon(Icons.bookmark_add_outlined),
            ),
        ],
      ),
      body: FutureBuilder<_LoadedPlayerData>(
        future: _bootstrapFuture,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return _PlayerStateView(
              icon: Icons.error_outline,
              title: 'Kh?ng m? ???c player',
              description: snapshot.error.toString(),
              actionLabel: 'Quay l?i',
              onAction: () => Navigator.of(context).pop(),
            );
          }

          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          if (_data == null) {
            _data = snapshot.data!;
            _assetAccess = _data!.assetAccess;
            _positionMs = _data!.initialPositionMs.clamp(0, _data!.chapter.durationSec * 1000);
            _status = _isPremiumLocked(_data!) ? PlayerStatus.locked : PlayerStatus.paused;
            if (!_hasLoadedData) {
              _hasLoadedData = true;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) {
                  setState(() {});
                }
              });
            }
            if (widget.autoplay && !_isPremiumLocked(_data!)) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted && _status != PlayerStatus.playing) {
                  unawaited(_startPlayback());
                }
              });
            }
            unawaited(_prepareAudioSource());
          }

          final data = _data!;
          final displayStatus = _status == PlayerStatus.locked && !_isPremiumLocked(data)
              ? PlayerStatus.paused
              : _status;
          if (_isPremiumLocked(data)) {
            return _PlayerStateView(
              icon: Icons.lock_outline,
              title: 'Premium locked',
              description: 'Nội dung này yêu cầu gói đăng ký. Hãy nâng cấp để tiếp tục nghe.',
              actionLabel: 'Quay l?i',
              onAction: () => Navigator.of(context).pop(),
            );
          }

          if (_assetAccess == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 760),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _PlayerHeader(
                        detail: data.detail,
                        chapter: data.chapter,
                        status: displayStatus,
                        assetAccess: _assetAccess!,
                      ),
                      const SizedBox(height: 20),
                      _PlaybackControls(
                        status: displayStatus,
                        currentPositionMs: _positionMs,
                        chapterDurationMs: data.chapter.durationSec * 1000,
                        speed: _speed,
                        sleepTimer: _sleepTimer,
                        onPlayPause: () {
                          if (_status == PlayerStatus.playing) {
                            unawaited(_pausePlayback());
                          } else {
                            _startPlayback();
                          }
                        },
                        onSeek: _seekTo,
                        onSkipBackward: () => _skipBy(-15000),
                        onSkipForward: () => _skipBy(15000),
                        onSpeedChanged: _setSpeed,
                        onSleepTimerChanged: _setSleepTimer,
                      ),
                      const SizedBox(height: 20),
                      _ChapterPicker(
                        chapters: data.detail.chapters,
                        activeChapterId: data.chapter.id,
                        onChapterSelected: _switchChapter,
                      ),
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 20),
                        _PlayerStateView(
                          icon: Icons.cloud_off_outlined,
                          title: 'Progress sync retry',
                          description: _errorMessage!,
                          actionLabel: 'Retry sync',
                          onAction: () => _syncProgress(),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

enum PlayerStatus { loading, buffering, playing, paused, ended, error, offline, locked }

class _LoadedPlayerData {
  final AudiobookDetail detail;
  final AudiobookChapter chapter;
  final PlaybackProgressState? resumeProgress;
  final AudioAssetAccess assetAccess;
  final int initialPositionMs;

  const _LoadedPlayerData({
    required this.detail,
    required this.chapter,
    required this.resumeProgress,
    required this.assetAccess,
    required this.initialPositionMs,
  });

  _LoadedPlayerData copyWith({
    AudiobookDetail? detail,
    AudiobookChapter? chapter,
    PlaybackProgressState? resumeProgress,
    AudioAssetAccess? assetAccess,
    int? initialPositionMs,
  }) {
    return _LoadedPlayerData(
      detail: detail ?? this.detail,
      chapter: chapter ?? this.chapter,
      resumeProgress: resumeProgress ?? this.resumeProgress,
      assetAccess: assetAccess ?? this.assetAccess,
      initialPositionMs: initialPositionMs ?? this.initialPositionMs,
    );
  }
}

class PlaybackTickUpdate {
  final int positionMs;
  final Duration? sleepTimer;
  final bool shouldPause;
  final bool completed;

  const PlaybackTickUpdate({
    required this.positionMs,
    required this.sleepTimer,
    required this.shouldPause,
    required this.completed,
  });
}

int resolvePlaybackPosition({
  required int estimatedPositionMs,
  required int? audioPositionMs,
  required int chapterDurationMs,
}) {
  final sourcePositionMs = audioPositionMs ?? estimatedPositionMs;
  return sourcePositionMs.clamp(0, chapterDurationMs);
}

PlaybackTickUpdate advancePlaybackTick({
  required int currentPositionMs,
  required int chapterDurationMs,
  required double speed,
  required Duration? sleepTimer,
}) {
  final incrementMs = (1000 * speed).round();
  final nextPositionMs = (currentPositionMs + incrementMs).clamp(0, chapterDurationMs);
  final completed = nextPositionMs >= chapterDurationMs;

  Duration? nextSleepTimer = sleepTimer;
  var shouldPause = completed;
  if (sleepTimer != null) {
    final remaining = sleepTimer - const Duration(seconds: 1);
    if (remaining <= Duration.zero) {
      nextSleepTimer = null;
      shouldPause = true;
    } else {
      nextSleepTimer = remaining;
    }
  }

  return PlaybackTickUpdate(
    positionMs: nextPositionMs,
    sleepTimer: nextSleepTimer,
    shouldPause: shouldPause,
    completed: completed,
  );
}

class _PlayerHeader extends StatelessWidget {
  final AudiobookDetail detail;
  final AudiobookChapter chapter;
  final PlayerStatus status;
  final AudioAssetAccess assetAccess;

  const _PlayerHeader({
    required this.detail,
    required this.chapter,
    required this.status,
    required this.assetAccess,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
      return Card(
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
            colors: [
              CloneFanosTokens.primary.withOpacity(0.08),
              theme.colorScheme.surface,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LayoutBuilder(
                builder: (context, constraints) {
                  final stacked = constraints.maxWidth < 420;
                  final header = Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Now playing', style: theme.textTheme.labelLarge?.copyWith(color: CloneFanosTokens.secondary)),
                      const SizedBox(height: 6),
                      Text(detail.title, style: theme.textTheme.headlineMedium),
                      const SizedBox(height: 4),
                      Text(chapter.title, style: theme.textTheme.titleMedium),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          CloneFanosStatusChip(label: status.name),
                          CloneFanosStatusChip(label: assetAccess.provider),
                          CloneFanosStatusChip(label: assetAccess.streamable ? 'streamable' : 'download-only'),
                          if (assetAccess.offlineCapable) const CloneFanosStatusChip(label: 'offline-ready'),
                        ],
                      ),
                    ],
                  );

                  if (stacked) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Center(child: CloneFanosCoverBadge(title: detail.title, premiumFlag: detail.premiumFlag, large: true)),
                        const SizedBox(height: 16),
                        header,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CloneFanosCoverBadge(title: detail.title, premiumFlag: detail.premiumFlag, large: true),
                      const SizedBox(width: 20),
                      Expanded(child: header),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      );
  }
}

class _PlaybackControls extends StatelessWidget {
  final PlayerStatus status;
  final int currentPositionMs;
  final int chapterDurationMs;
  final double speed;
  final Duration? sleepTimer;
  final VoidCallback onPlayPause;
  final ValueChanged<int> onSeek;
  final VoidCallback onSkipBackward;
  final VoidCallback onSkipForward;
  final ValueChanged<double> onSpeedChanged;
  final ValueChanged<Duration?> onSleepTimerChanged;

  const _PlaybackControls({
    required this.status,
    required this.currentPositionMs,
    required this.chapterDurationMs,
    required this.speed,
    required this.sleepTimer,
    required this.onPlayPause,
    required this.onSeek,
    required this.onSkipBackward,
    required this.onSkipForward,
    required this.onSpeedChanged,
    required this.onSleepTimerChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final maxMs = chapterDurationMs <= 0 ? 1.0 : chapterDurationMs.toDouble();
    final currentMs = currentPositionMs.toDouble().clamp(0.0, maxMs).toDouble();

    return Card(
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: theme.colorScheme.surface,
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Playback', style: theme.textTheme.titleMedium),
            const SizedBox(height: 12),
            Slider(
              value: currentMs,
              min: 0,
              max: maxMs,
              onChanged: (value) => onSeek(value.round()),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(_formatPosition(currentPositionMs)),
                Text(_formatPosition(chapterDurationMs)),
              ],
            ),
            const SizedBox(height: 12),
            LayoutBuilder(
              builder: (context, constraints) {
                final stacked = constraints.maxWidth < 360;
                final controls = [
                  IconButton(
                    tooltip: 'Skip back',
                    onPressed: onSkipBackward,
                    icon: const Icon(Icons.replay_10),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: onPlayPause,
                    icon: Icon(status == PlayerStatus.playing ? Icons.pause : Icons.play_arrow),
                    label: Text(status == PlayerStatus.playing ? 'Pause' : 'Play'),
                  ),
                  IconButton(
                    tooltip: 'Skip forward',
                    onPressed: onSkipForward,
                    icon: const Icon(Icons.forward_10),
                  ),
                ];

                if (stacked) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(child: controls.first),
                      const SizedBox(height: 8),
                      SizedBox(width: double.infinity, child: controls[1]),
                      const SizedBox(height: 8),
                      Center(child: controls[2]),
                    ],
                  );
                }

                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: controls,
                );
              },
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _SpeedMenu(
                  value: speed,
                  onChanged: onSpeedChanged,
                ),
                _SleepTimerMenu(
                  current: sleepTimer,
                  onChanged: onSleepTimerChanged,
                ),
                CloneFanosStatusChip(label: status == PlayerStatus.ended ? 'ended' : 'background-ready'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SpeedMenu extends StatelessWidget {
  final double value;
  final ValueChanged<double> onChanged;

  const _SpeedMenu({
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<double>(
      initialValue: value,
      onSelected: onChanged,
      itemBuilder: (context) => const [
        PopupMenuItem(value: 0.75, child: Text('0.75x')),
        PopupMenuItem(value: 1.0, child: Text('1.0x')),
        PopupMenuItem(value: 1.25, child: Text('1.25x')),
        PopupMenuItem(value: 1.5, child: Text('1.5x')),
        PopupMenuItem(value: 2.0, child: Text('2.0x')),
      ],
      child: Chip(label: Text('${value.toStringAsFixed(2)}x')),
    );
  }
}

class _SleepTimerMenu extends StatelessWidget {
  final Duration? current;
  final ValueChanged<Duration?> onChanged;

  const _SleepTimerMenu({
    required this.current,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<Duration?>(
      initialValue: current,
      onSelected: onChanged,
      itemBuilder: (context) => const [
        PopupMenuItem(value: null, child: Text('Sleep timer off')),
        PopupMenuItem(value: Duration(minutes: 15), child: Text('15 minutes')),
        PopupMenuItem(value: Duration(minutes: 30), child: Text('30 minutes')),
        PopupMenuItem(value: Duration(minutes: 60), child: Text('60 minutes')),
      ],
      child: Chip(
        label: Text(current == null ? 'Sleep timer' : '${current!.inMinutes}m'),
      ),
    );
  }
}

class _ChapterPicker extends StatelessWidget {
  final List<AudiobookChapter> chapters;
  final String activeChapterId;
  final ValueChanged<AudiobookChapter> onChapterSelected;

  const _ChapterPicker({
    required this.chapters,
    required this.activeChapterId,
    required this.onChapterSelected,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Chapters', style: theme.textTheme.titleMedium),
            const SizedBox(height: 12),
            for (final chapter in chapters)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: chapter.id == activeChapterId
                      ? theme.colorScheme.primaryContainer
                      : theme.colorScheme.surfaceContainerHighest,
                  child: Text('${chapter.orderIndex}'),
                ),
                title: Text(chapter.title),
                subtitle: Text('${_formatDuration(chapter.durationSec)} • ${chapter.status}'),
                trailing: chapter.id == activeChapterId
                    ? const Icon(Icons.play_arrow)
                    : const Icon(Icons.chevron_right),
                onTap: () => onChapterSelected(chapter),
              ),
          ],
        ),
      ),
    );
  }
}

class _PlayerStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String actionLabel;
  final VoidCallback onAction;

  const _PlayerStateView({
    required this.icon,
    required this.title,
    required this.description,
    required this.actionLabel,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    alignment: Alignment.center,
                    child: Icon(icon, color: theme.colorScheme.error),
                  ),
                  const SizedBox(height: 12),
                  Text(title, style: theme.textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(description, textAlign: TextAlign.center, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 16),
                  FilledButton.tonal(onPressed: onAction, child: Text(actionLabel)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

String _formatDuration(int seconds) {
  if (seconds <= 0) {
    return '0m';
  }

  final hours = seconds ~/ 3600;
  final minutes = (seconds % 3600) ~/ 60;
  if (hours > 0) {
    return '${hours}h ${minutes}m';
  }

  return '${minutes}m';
}

String _formatPosition(int milliseconds) {
  final totalSeconds = milliseconds ~/ 1000;
  final minutes = totalSeconds ~/ 60;
  final seconds = totalSeconds % 60;
  return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
}
