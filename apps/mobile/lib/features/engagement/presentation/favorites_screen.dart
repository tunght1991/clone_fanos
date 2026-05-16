import 'package:flutter/material.dart';

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
    return Scaffold(
      appBar: AppBar(title: const Text('Favorites')),
      body: FutureBuilder<List<FavoriteEntry>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }

          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final items = snapshot.data!;
          if (items.isEmpty) {
            return const Center(child: Text('Chưa có favorite nào'));
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
                    leading: const Icon(Icons.favorite),
                    title: Text(item.audiobookTitle),
                    subtitle: Text('${item.authorName} · ${_formatDuration(item.durationSec)}'),
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

String _formatDuration(int seconds) {
  if (seconds <= 0) {
    return '0m';
  }
  final hours = seconds ~/ 3600;
  final minutes = (seconds % 3600) ~/ 60;
  return hours > 0 ? '${hours}h ${minutes}m' : '${minutes}m';
}
