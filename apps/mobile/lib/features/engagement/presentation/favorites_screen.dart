import 'package:flutter/material.dart';

import '../../../shared/ui/clone_fanos_primitives.dart';
import '../../auth/state/app_state.dart';
import '../../home/presentation/home_shell.dart';
import '../domain/engagement_models.dart';

class FavoritesScreen extends StatefulWidget {
  final AppState appState;

  const FavoritesScreen({super.key, required this.appState});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  late Future<List<FavoriteEntry>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.appState.engagementRepository.listFavorites(
      userId: widget.appState.currentUserId,
      accessToken: widget.appState.accessToken,
    );
  }

  Future<void> _refresh() async {
    setState(() {
      _future = widget.appState.engagementRepository.listFavorites(
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
      appBar: AppBar(title: const Text('Favorites')),
      body: SafeArea(
        child: FutureBuilder<List<FavoriteEntry>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return CloneFanosStateCard(
                icon: Icons.error_outline,
                title: 'Không tải được favorite',
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
                icon: Icons.favorite_border,
                title: 'Chưa có favorite nào',
                description:
                    'Các audiobook bạn đánh dấu yêu thích sẽ xuất hiện ở đây để mở lại nhanh hơn.',
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
                  return Card(
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => AudiobookDetailScreen(
                              appState: widget.appState,
                              audiobookId: item.audiobookId,
                            ),
                          ),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primaryContainer,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              alignment: Alignment.center,
                              child: Icon(Icons.favorite, color: theme.colorScheme.primary),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.audiobookTitle, style: theme.textTheme.titleMedium),
                                  const SizedBox(height: 4),
                                  Text(
                                    item.authorName,
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      CloneFanosMetaChip(
                                        icon: Icons.schedule_outlined,
                                        label: _formatDuration(item.durationSec),
                                      ),
                                      CloneFanosMetaChip(
                                        icon: Icons.bookmark_border,
                                        label: 'Open details',
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Icon(
                              Icons.chevron_right,
                              color: theme.colorScheme.onSurfaceVariant,
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

String _formatDuration(int seconds) {
  if (seconds <= 0) {
    return '0m';
  }
  final hours = seconds ~/ 3600;
  final minutes = (seconds % 3600) ~/ 60;
  return hours > 0 ? '${hours}h ${minutes}m' : '${minutes}m';
}
