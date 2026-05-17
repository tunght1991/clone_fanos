import 'dart:async';

import 'package:flutter/material.dart';

import '../../../shared/ui/clone_fanos_primitives.dart';
import '../../auth/state/app_state.dart';
import '../../engagement/domain/engagement_models.dart';
import '../../player/presentation/player_screen.dart';

class BookmarksScreen extends StatefulWidget {
  final AppState appState;

  const BookmarksScreen({super.key, required this.appState});

  @override
  State<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends State<BookmarksScreen> {
  late Future<List<BookmarkEntry>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.appState.engagementRepository.listBookmarks(
      userId: widget.appState.currentUserId,
      accessToken: widget.appState.accessToken,
    );
  }

  Future<void> _refresh() async {
    setState(() {
      _future = widget.appState.engagementRepository.listBookmarks(
        userId: widget.appState.currentUserId,
        accessToken: widget.appState.accessToken,
      );
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.background,
      appBar: AppBar(title: const Text('Bookmarks')),
      body: SafeArea(
        child: FutureBuilder<List<BookmarkEntry>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return CloneFanosStateCard(
                icon: Icons.error_outline,
                title: 'Không tải được bookmark',
                description: snapshot.error.toString(),
                actionLabel: 'Thử lại',
                onAction: _refresh,
                errorStyle: true,
              );
            }

            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }

            final items = snapshot.data!;
            if (items.isEmpty) {
              return const CloneFanosEmptyStateCard(
                icon: Icons.bookmarks_outlined,
                title: 'Chưa có bookmark nào',
                description:
                    'Khi đang nghe audio, bookmark sẽ xuất hiện ở đây để bạn quay lại nhanh hơn.',
              );
            }

            return RefreshIndicator(
              onRefresh: _refresh,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final item = items[index];
                  final note = item.note?.trim();

                  return Card(
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => PlayerScreen(
                              appState: widget.appState,
                              audiobookId: item.audiobookId,
                              initialChapterId: item.chapterId,
                              initialPositionMs: item.positionMs,
                            ),
                          ),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.primaryContainer,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    '${index + 1}',
                                    style: theme.textTheme.labelLarge?.copyWith(
                                      color: theme.colorScheme.primary,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item.chapterTitle, style: theme.textTheme.titleMedium),
                                      const SizedBox(height: 4),
                                      Text(
                                        item.audiobookTitle,
                                        style: theme.textTheme.bodyMedium?.copyWith(
                                          color: theme.colorScheme.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton.filledTonal(
                                  tooltip: 'Xóa bookmark',
                                  onPressed: () async {
                                    try {
                                      await widget.appState.engagementRepository.deleteBookmark(
                                        item.id,
                                        userId: widget.appState.currentUserId,
                                        accessToken: widget.appState.accessToken,
                                      );
                                      unawaited(
                                        widget.appState.trackAnalyticsEvent(
                                          'bookmark_deleted',
                                          payload: {
                                            'bookmarkId': item.id,
                                            'audiobookId': item.audiobookId,
                                            'chapterId': item.chapterId,
                                          },
                                        ),
                                      );
                                      await _refresh();
                                    } catch (error) {
                                      if (!context.mounted) {
                                        return;
                                      }
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text('Không xóa được bookmark: $error')),
                                      );
                                    }
                                  },
                                  icon: const Icon(Icons.delete_outline),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                CloneFanosMetaChip(
                                  icon: Icons.schedule_outlined,
                                  label: _formatPosition(item.positionMs),
                                ),
                                CloneFanosMetaChip(
                                  icon: Icons.notes_outlined,
                                  label: note != null && note.isNotEmpty ? note : 'Không có ghi chú',
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

String _formatPosition(int milliseconds) {
  final totalSeconds = milliseconds ~/ 1000;
  final minutes = totalSeconds ~/ 60;
  final seconds = totalSeconds % 60;
  return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
}
