import 'package:flutter/material.dart';

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
    return Scaffold(
      appBar: AppBar(title: const Text('Bookmarks')),
      body: FutureBuilder<List<BookmarkEntry>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 40),
                    const SizedBox(height: 12),
                    Text(snapshot.error.toString(), textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(onPressed: _refresh, child: const Text('Retry')),
                  ],
                ),
              ),
            );
          }

          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final items = snapshot.data!;
          if (items.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('Chưa có bookmark nào'),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = items[index];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(child: Text('${index + 1}')),
                    title: Text(item.chapterTitle),
                    subtitle: Text(
                      '${item.audiobookTitle}\n${_formatPosition(item.positionMs)} · ${item.note ?? 'No note'}',
                    ),
                    isThreeLine: true,
                    trailing: IconButton(
                      tooltip: 'Delete bookmark',
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () async {
                        try {
                          await widget.appState.engagementRepository.deleteBookmark(
                            item.id,
                            userId: widget.appState.currentUserId,
                            accessToken: widget.appState.accessToken,
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
                    ),
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
                  ),
                );
              },
            ),
          );
        },
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
