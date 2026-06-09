import 'dart:async';

import 'package:characters/characters.dart';
import 'package:flutter/material.dart';

import '../../../app/app_theme.dart';
import '../../../app/app_scope.dart';
import '../../auth/state/app_state.dart';
import '../../engagement/domain/engagement_models.dart';
import '../../engagement/presentation/bookmarks_screen.dart';
import '../../engagement/presentation/favorites_screen.dart';
import '../../discovery/domain/discovery_models.dart';
import '../../discovery/domain/discovery_repository.dart';
import '../../player/presentation/player_screen.dart';
import '../../player/presentation/player_screen_logic.dart';
import '../../subscription/domain/subscription_models.dart';
import '../../subscription/presentation/subscription_screen.dart';

class HomeShell extends StatefulWidget {
  final AppState appState;

  const HomeShell({super.key, required this.appState});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    unawaited(
      widget.appState.trackAnalyticsEvent(
        'home_viewed',
        payload: {'defaultTab': 'home'},
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.appState,
      builder: (context, _) {
        final user = widget.appState.currentUser;

        return Scaffold(
          backgroundColor: Theme.of(context).colorScheme.background,
          appBar: AppBar(
            title: Text('Hello, ${user?.displayName ?? 'Reader'}'),
            actions: [
              IconButton(
                tooltip: 'Search',
                onPressed: () => setState(() => _index = 1),
                icon: const Icon(Icons.search),
              ),
              IconButton(
                tooltip: 'Logout',
                onPressed: widget.appState.isBusy
                    ? null
                    : () async {
                        await widget.appState.logout();
                      },
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
          body: Column(
            children: [
              if (widget.appState.subscriptionRefreshError != null)
                _SubscriptionRefreshBanner(
                  message: 'Subscription info needs a refresh.',
                  onDismiss: widget.appState.clearSubscriptionRefreshError,
                  onRetry: () async {
                    try {
                      await widget.appState.refreshSubscription();
                    } catch (_) {
                      // The banner stays visible because the state still carries the error.
                    }
                  },
                ),
              Expanded(
                child: IndexedStack(
                  index: _index,
                  children: [
                    _HomeTab(
                      appState: widget.appState,
                      onJumpToSearch: () => setState(() => _index = 1),
                    ),
                    _SearchTab(appState: widget.appState),
                    _ProfileTab(appState: widget.appState),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (value) => setState(() => _index = value),
            destinations: const [
              NavigationDestination(
                  icon: Icon(Icons.home_outlined), label: 'Home'),
              NavigationDestination(
                  icon: Icon(Icons.search_outlined), label: 'Search'),
              NavigationDestination(
                  icon: Icon(Icons.person_outline), label: 'Profile'),
            ],
          ),
        );
      },
    );
  }
}

class _SubscriptionRefreshBanner extends StatelessWidget {
  final String message;
  final VoidCallback onDismiss;
  final Future<void> Function() onRetry;

  const _SubscriptionRefreshBanner({
    required this.message,
    required this.onDismiss,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: CloneFanosTokens.secondary.withOpacity(0.10),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
          child: Row(
            children: [
              const Icon(Icons.sync_problem_outlined),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
              TextButton(
                onPressed: onDismiss,
                child: const Text('Dismiss'),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: () => onRetry(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeTab extends StatefulWidget {
  final AppState appState;
  final VoidCallback onJumpToSearch;

  const _HomeTab({
    required this.appState,
    required this.onJumpToSearch,
  });

  @override
  State<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<_HomeTab> {
  String? _selectedCategoryId;
  late Future<BrowseFeed> _feedFuture;

  @override
  void initState() {
    super.initState();
    _feedFuture = _loadFeed();
  }

  Future<BrowseFeed> _loadFeed() {
    return widget.appState.contentRepository
        .getBrowseFeed(categoryId: _selectedCategoryId);
  }

  void _selectCategory(ContentCategory? category) {
    setState(() {
      _selectedCategoryId = category?.id;
      _feedFuture = _loadFeed();
    });

    unawaited(
      widget.appState.trackAnalyticsEvent(
        'category_viewed',
        payload: {
          'categoryId': category?.id,
          'categoryName': category?.name ?? 'All',
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<BrowseFeed>(
      future: _feedFuture,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _StateMessage(
            icon: Icons.error_outline,
            title: 'Kh?ng t?i ???c trang Home',
            description:
                'Kiá»ƒm tra láº¡i káº¿t ná»‘i hoáº·c thá»­ táº£i láº¡i.',
            actionLabel: 'Thá»­ láº¡i',
            onAction: () => setState(() {
              _feedFuture = _loadFeed();
            }),
          );
        }

        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final feed = snapshot.data!;
        final content = <Widget>[
          _HeroPanel(
            title: 'Học nhanh, nghe tiếp, quay lại trang chủ',
            description:
                'Browse audiobook, tìm nội dung phù hợp và tiếp tục nghe chỉ bằng với tap.',
            onSearch: widget.onJumpToSearch,
          ),
          const SizedBox(height: 20),
          _SectionHeader(
            title: 'Continue listening',
            subtitle: feed.continueListening == null
                ? 'Chưa có phiên nghe nào'
                : 'Resume từ vị trí gần nhất',
          ),
          const SizedBox(height: 12),
          if (feed.continueListening == null)
            const _EmptyCard(
              icon: Icons.play_circle_outline,
              title: 'Chưa có nội dung đang nghe',
              description:
                  'Khi bạn bắt đầu nghe, app sẽ đưa item này lên đầu để resume nhanh hơn.',
            )
          else
            _ContinueListeningCard(
              progress: feed.continueListening!,
              onTap: () {
                unawaited(
                  widget.appState.trackAnalyticsEvent(
                    'continue_listening_clicked',
                    payload: {
                      'audiobookId': feed.continueListening!.audiobookId,
                      'chapterId': feed.continueListening!.chapterId,
                    },
                  ),
                );
                _openPlayer(
                  context,
                  audiobookId: feed.continueListening!.audiobookId,
                  chapterId: feed.continueListening!.chapterId,
                  positionMs: feed.continueListening!.positionMs,
                );
              },
            ),
          const SizedBox(height: 24),
          _SectionHeader(
            title: 'Categories',
            subtitle: 'Lọc theo chủ đề để tìm đúng nội dung nhanh hơn',
          ),
          const SizedBox(height: 12),
          if (feed.categories.isEmpty)
            const _EmptyCard(
              icon: Icons.category_outlined,
              title: 'Chưa có danh mục',
              description:
                  'Danh mục sẽ xuất hiện khi nội dung được gắn phân loại.',
            )
          else
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: feed.categories.length + 1,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  if (index == 0) {
                    final selected = _selectedCategoryId == null;
                    return ChoiceChip(
                      label: const Text('All'),
                      selected: selected,
                      onSelected: (_) => _selectCategory(null),
                    );
                  }

                  final category = feed.categories[index - 1];
                  final selected = _selectedCategoryId == category.id;
                  return ChoiceChip(
                    label: Text('${category.name} ? ${category.itemCount}'),
                    selected: selected,
                    onSelected: (_) => _selectCategory(category),
                  );
                },
              ),
            ),
          const SizedBox(height: 24),
          _SectionHeader(
            title: 'Featured',
            subtitle: 'Nội dung nổi bật phù hợp để bắt đầu ngay',
          ),
          const SizedBox(height: 12),
          if (feed.featured.isEmpty)
            const _EmptyCard(
              icon: Icons.library_books_outlined,
              title: 'Không có nội dung nổi bật',
              description: 'Thử đổi danh mục để xem nội dung khác.',
            )
          else
            ...feed.featured.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AudiobookSummaryCard(
                  key: ValueKey('home-card-${item.id}'),
                  item: item,
                  onTap: () => _openDetail(context,
                      audiobookId: item.id, source: 'home'),
                ),
              ),
            ),
          const SizedBox(height: 12),
          _SectionHeader(
            title: 'Mới & nổi bật',
            subtitle: 'Các tựa mới và đang được nghe gần đây',
          ),
          const SizedBox(height: 12),
          if (feed.newReleases.isEmpty)
            const _EmptyCard(
              icon: Icons.new_releases_outlined,
              title: 'Chưa có audiobook mới',
              description:
                  'Danh sách mới sẽ hiển thị khi nội dung được xuất bản.',
            )
          else
            ...feed.newReleases.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AudiobookSummaryCard(
                  key: ValueKey('home-card-${item.id}'),
                  item: item,
                  onTap: () => _openDetail(context,
                      audiobookId: item.id, source: 'home'),
                ),
              ),
            ),
        ];

        return RefreshIndicator(
          onRefresh: () async {
            setState(() {
              _feedFuture = _loadFeed();
            });
            await _feedFuture;
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 760),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: content,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SearchTab extends StatefulWidget {
  final AppState appState;

  const _SearchTab({required this.appState});

  @override
  State<_SearchTab> createState() => _SearchTabState();
}

class _SearchTabState extends State<_SearchTab> {
  final TextEditingController _queryController = TextEditingController();
  final List<String> _recentQueries = <String>[];
  Timer? _debounce;
  List<ContentCategory> _categories = const <ContentCategory>[];
  List<AudiobookSummary> _items = const <AudiobookSummary>[];
  String? _selectedCategoryId;
  String _selectedPremiumFilter = 'all';
  String _selectedSortBy = discoverySearchSortByRelevance;
  String _selectedSortOrder = discoverySearchSortOrderDesc;
  String _currentQuery = '';
  bool _isLoading = false;
  bool _hasNext = false;
  int _page = 1;
  String? _errorMessage;
  int _searchRequestSequence = 0;

  @override
  void initState() {
    super.initState();
    unawaited(
      widget.appState.trackAnalyticsEvent(
        'search_viewed',
        payload: {
          'defaultFilter': 'all',
          'defaultSortBy': _selectedSortBy,
          'defaultSortOrder': _selectedSortOrder,
        },
      ),
    );
    _bootstrapCategories();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _bootstrapCategories() async {
    try {
      final feed = await widget.appState.contentRepository.getBrowseFeed();
      if (!mounted) {
        return;
      }

      setState(() {
        _categories = feed.categories;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _errorMessage = error.toString();
      });
    }
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      _submitSearch(value, resetResults: true);
    });
    setState(() {
      _currentQuery = value;
      if (value.trim().isEmpty) {
        _items = const <AudiobookSummary>[];
        _page = 1;
        _hasNext = false;
        _errorMessage = null;
      }
    });
  }

  void _onSubmit(String value) {
    _debounce?.cancel();
    _submitSearch(value, resetResults: true);
  }

  Future<void> _submitSearch(
    String value, {
    required bool resetResults,
  }) async {
    final query = value.trim();
    if (query.isEmpty) {
      _searchRequestSequence += 1;
      setState(() {
        _items = const <AudiobookSummary>[];
        _page = 1;
        _hasNext = false;
        _errorMessage = null;
        _isLoading = false;
      });
      return;
    }

    final premiumFlag = switch (_selectedPremiumFilter) {
      'premium' => true,
      'free' => false,
      _ => null,
    };

    final page = resetResults ? 1 : _page + 1;
    final requestId = ++_searchRequestSequence;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      if (resetResults) {
        _items = const <AudiobookSummary>[];
        _page = 1;
      }
    });

    try {
      final result = await widget.appState.contentRepository.searchAudiobooks(
        DiscoverySearchRequest(
          query: query,
          page: page,
          pageSize: 10,
          categoryId: _selectedCategoryId,
          premiumFlag: premiumFlag,
          sortBy: _selectedSortBy,
          sortOrder: _selectedSortOrder,
        ),
      );
      if (!mounted) {
        return;
      }
      if (requestId != _searchRequestSequence) {
        return;
      }

      setState(() {
        _currentQuery = query;
        _queryController.text = query;
        if (resetResults) {
          _items = result.items;
          _page = result.page;
        } else {
          _items = <AudiobookSummary>[..._items, ...result.items];
          _page = result.page;
        }
        _hasNext = result.hasNext;
        _isLoading = false;
        if (!_recentQueries.contains(query)) {
          _recentQueries.insert(0, query);
          if (_recentQueries.length > 5) {
            _recentQueries.removeLast();
          }
        }
      });

      unawaited(
        widget.appState.trackAnalyticsEvent(
          'search_submitted',
          payload: {
            'queryLength': query.length,
            'page': result.page,
            'pageSize': result.pageSize,
            'categoryId': _selectedCategoryId,
            'premiumFlag': premiumFlag,
            'sortBy': _selectedSortBy,
            'sortOrder': _selectedSortOrder,
            'resultCount': result.items.length,
            'hasNext': result.hasNext,
          },
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      if (requestId != _searchRequestSequence) {
        return;
      }

      setState(() {
        _isLoading = false;
        _errorMessage = error.toString();
      });
    }
  }

  void _clearQuery() {
    _debounce?.cancel();
    _searchRequestSequence += 1;
    setState(() {
      _queryController.clear();
      _currentQuery = '';
      _items = const <AudiobookSummary>[];
      _page = 1;
      _hasNext = false;
      _errorMessage = null;
    });
  }

  void _changePremiumFilter(String value) {
    setState(() {
      _selectedPremiumFilter = value;
    });
    unawaited(
      widget.appState.trackAnalyticsEvent(
        'search_filter_changed',
        payload: {'filterType': 'premium', 'value': value},
      ),
    );
    if (_currentQuery.trim().isNotEmpty) {
      _submitSearch(_currentQuery, resetResults: true);
    }
  }

  void _changeCategory(String? categoryId) {
    setState(() {
      _selectedCategoryId = categoryId;
    });
    unawaited(
      widget.appState.trackAnalyticsEvent(
        'search_filter_changed',
        payload: {'filterType': 'category', 'value': categoryId},
      ),
    );
    if (_currentQuery.trim().isNotEmpty) {
      _submitSearch(_currentQuery, resetResults: true);
    }
  }

  void _changeSortBy(String value) {
    setState(() {
      _selectedSortBy = value;
    });
    unawaited(
      widget.appState.trackAnalyticsEvent(
        'search_filter_changed',
        payload: {'filterType': 'sortBy', 'value': value},
      ),
    );
    if (_currentQuery.trim().isNotEmpty) {
      _submitSearch(_currentQuery, resetResults: true);
    }
  }

  void _changeSortOrder(String value) {
    setState(() {
      _selectedSortOrder = value;
    });
    unawaited(
      widget.appState.trackAnalyticsEvent(
        'search_filter_changed',
        payload: {'filterType': 'sortOrder', 'value': value},
      ),
    );
    if (_currentQuery.trim().isNotEmpty) {
      _submitSearch(_currentQuery, resetResults: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final showRecent =
        _currentQuery.trim().isEmpty && _recentQueries.isNotEmpty;
    final showIdle = _currentQuery.trim().isEmpty && _items.isEmpty;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _SectionHeader(
          title: 'Search audiobooks',
          subtitle: 'Search by title, author, narrator, tag, or category',
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _queryController,
          textInputAction: TextInputAction.search,
          onChanged: _onQueryChanged,
          onSubmitted: _onSubmit,
          decoration: InputDecoration(
            hintText: 'Search audiobooks',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _queryController.text.isEmpty
                ? null
                : IconButton(
                    onPressed: _clearQuery,
                    icon: const Icon(Icons.clear),
                  ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ChoiceChip(
              label: const Text('All'),
              selected: _selectedPremiumFilter == 'all',
              onSelected: (_) => _changePremiumFilter('all'),
            ),
            ChoiceChip(
              label: const Text('Free'),
              selected: _selectedPremiumFilter == 'free',
              onSelected: (_) => _changePremiumFilter('free'),
            ),
            ChoiceChip(
              label: const Text('Premium'),
              selected: _selectedPremiumFilter == 'premium',
              onSelected: (_) => _changePremiumFilter('premium'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _SectionHeader(
          title: 'Sort results',
          subtitle: 'Sort search results by relevance, title, or duration',
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ChoiceChip(
              label: const Text('Relevance'),
              selected: _selectedSortBy == discoverySearchSortByRelevance,
              onSelected: (_) => _changeSortBy(discoverySearchSortByRelevance),
            ),
            ChoiceChip(
              label: const Text('Title'),
              selected: _selectedSortBy == discoverySearchSortByTitle,
              onSelected: (_) => _changeSortBy(discoverySearchSortByTitle),
            ),
            ChoiceChip(
              label: const Text('Duration'),
              selected: _selectedSortBy == discoverySearchSortByDuration,
              onSelected: (_) => _changeSortBy(discoverySearchSortByDuration),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ChoiceChip(
              label: const Text('Descending'),
              selected: _selectedSortOrder == discoverySearchSortOrderDesc,
              onSelected: (_) => _changeSortOrder(discoverySearchSortOrderDesc),
            ),
            ChoiceChip(
              label: const Text('Ascending'),
              selected: _selectedSortOrder == discoverySearchSortOrderAsc,
              onSelected: (_) => _changeSortOrder(discoverySearchSortOrderAsc),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_categories.isNotEmpty)
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length + 1,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return ChoiceChip(
                    label: const Text('All categories'),
                    selected: _selectedCategoryId == null,
                    onSelected: (_) => _changeCategory(null),
                  );
                }

                final category = _categories[index - 1];
                return ChoiceChip(
                  label: Text(category.name),
                  selected: _selectedCategoryId == category.id,
                  onSelected: (_) => _changeCategory(category.id),
                );
              },
            ),
          ),
        const SizedBox(height: 16),
        if (_errorMessage != null)
          _StateMessage(
            icon: Icons.error_outline,
            title: 'Search lá»—i',
            description: _errorMessage!,
            actionLabel: '??ng',
            onAction: () => setState(() => _errorMessage = null),
          )
        else if (_isLoading && _items.isEmpty)
          const Center(
              child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator()))
        else if (showRecent)
          _RecentSearches(
            queries: _recentQueries,
            onTap: (query) {
              _queryController.text = query;
              _submitSearch(query, resetResults: true);
            },
          )
        else if (showIdle)
          const _EmptyCard(
            icon: Icons.manage_search_outlined,
            title: 'Type to search audiobooks',
            description:
                'Results prioritize title, author, narrator, tag, and category matches.',
          )
        else if (_items.isEmpty)
          const _EmptyCard(
            icon: Icons.search_off_outlined,
            title: 'Không có kết quả',
            description:
                'Không tìm thấy kết quả phù hợp. Hãy thử điều chỉnh bộ lọc hoặc từ khóa.',
          )
        else
          Column(
            children: [
              for (final item in _items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: AudiobookSummaryCard(
                    key: ValueKey('search-card-${item.id}'),
                    item: item,
                    onTap: () => _openDetail(context,
                        audiobookId: item.id, source: 'search'),
                  ),
                ),
              if (_hasNext)
                FilledButton.tonal(
                  onPressed: _isLoading
                      ? null
                      : () {
                          _submitSearch(_currentQuery, resetResults: false);
                        },
                  child: _isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Load more'),
                ),
            ],
          ),
      ],
    );
  }
}

class _ProfileTab extends StatefulWidget {
  final AppState appState;

  const _ProfileTab({required this.appState});

  @override
  State<_ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<_ProfileTab> {
  void _openBookmarks() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => BookmarksScreen(appState: widget.appState),
      ),
    );
  }

  void _openFavorites() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => FavoritesScreen(appState: widget.appState),
      ),
    );
  }

  Future<void> _openSubscription() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => SubscriptionScreen(appState: widget.appState),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.appState.currentUser;
    final subscription = widget.appState.currentSubscription;
    final statusLabel = subscription == null
        ? 'No active subscription'
        : subscription.entitlement.canAccessPremium
            ? 'Premium active'
            : 'Premium locked';

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _SectionHeader(
          title: 'Profile',
          subtitle: 'Tổng quan tài khoản và trạng thái phiên hiện tại',
        ),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading:
                const CircleAvatar(child: Icon(Icons.account_circle_outlined)),
            title: Text(user?.displayName ?? 'Guest'),
            subtitle: Text(user?.email ?? 'Not signed in'),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: const Icon(Icons.workspace_premium_outlined),
            title: const Text('Subscription'),
            subtitle: Text(statusLabel),
            trailing: const Icon(Icons.chevron_right),
            onTap: _openSubscription,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.bookmarks_outlined),
                title: const Text('Bookmarks'),
                subtitle: const Text('Xem lại timestamp ?? lưu'),
                trailing: const Icon(Icons.chevron_right),
                onTap: _openBookmarks,
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.favorite_border),
                title: const Text('Favorites'),
                subtitle: const Text('Danh sách audiobook ?? đánh dấu'),
                trailing: const Icon(Icons.chevron_right),
                onTap: _openFavorites,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class AudiobookSummaryCard extends StatelessWidget {
  final AudiobookSummary item;
  final VoidCallback onTap;

  const AudiobookSummaryCard({
    super.key,
    required this.item,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Semantics(
        button: true,
        label: 'Open audiobook ${item.title} by ${item.authorName}',
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _CoverBadge(
                  title: item.title,
                  premiumFlag: item.premiumFlag,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item.title,
                              style: Theme.of(context).textTheme.titleMedium,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (item.premiumFlag) ...[
                            const SizedBox(width: 8),
                            const _PremiumBadge(),
                          ],
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item.authorName,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.narratorNames.join(' • '),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        item.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _InfoPill(label: _formatDuration(item.durationSec)),
                          for (final tag in item.tagNames.take(2))
                            _InfoPill(label: tag),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AudiobookDetailViewData {
  final AudiobookDetail detail;
  final bool isFavorite;

  const _AudiobookDetailViewData({
    required this.detail,
    required this.isFavorite,
  });
}

class AudiobookDetailScreen extends StatefulWidget {
  final AppState appState;
  final String audiobookId;

  const AudiobookDetailScreen({
    super.key,
    required this.appState,
    required this.audiobookId,
  });

  @override
  State<AudiobookDetailScreen> createState() => _AudiobookDetailScreenState();
}

class _AudiobookDetailScreenState extends State<AudiobookDetailScreen> {
  late Future<_AudiobookDetailViewData?> _detailFuture;
  _AudiobookDetailViewData? _currentData;
  bool _viewTracked = false;

  @override
  void initState() {
    super.initState();
    widget.appState.addListener(_handleAppStateChanged);
    _detailFuture = _loadDetailState();
  }

  @override
  void dispose() {
    widget.appState.removeListener(_handleAppStateChanged);
    super.dispose();
  }

  void _handleAppStateChanged() {
    if (!mounted) {
      return;
    }
    setState(() {});
  }

  Future<_AudiobookDetailViewData?> _loadDetailState() async {
    final detail = await widget.appState.contentRepository
        .getAudiobookDetail(widget.audiobookId);
    if (detail == null) {
      return null;
    }

    final isFavorite = await widget.appState.engagementRepository.isFavorite(
      detail.id,
      userId: widget.appState.currentUserId,
      accessToken: widget.appState.accessToken,
    );

    if (!_viewTracked) {
      _viewTracked = true;
      unawaited(
        widget.appState.trackAnalyticsEvent(
          'audiobook_viewed',
          payload: {
            'audiobookId': detail.id,
            'premiumFlag': detail.premiumFlag,
            'chapterCount': detail.chapters.length,
          },
        ),
      );
    }

    return _AudiobookDetailViewData(
      detail: detail,
      isFavorite: isFavorite,
    );
  }

  Future<void> _toggleFavorite(_AudiobookDetailViewData data) async {
    try {
      final result = await widget.appState.engagementRepository.toggleFavorite(
        data.detail.id,
        userId: widget.appState.currentUserId,
        accessToken: widget.appState.accessToken,
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _currentData = _AudiobookDetailViewData(
          detail: data.detail,
          isFavorite: result.favorited,
        );
      });

      unawaited(
        widget.appState.trackAnalyticsEvent(
          result.favorited ? 'favorite_created' : 'favorite_deleted',
          payload: {
            'audiobookId': data.detail.id,
          },
        ),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.favorited
              ? 'Đã thêm vào yêu thích'
              : 'Đã bỏ khỏi yêu thích'),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không cập nhật được favorite: $error')),
      );
    }
  }

  void _openPlayerFromDetail(
    AudiobookDetail detail, {
    required bool resume,
    AudiobookChapter? chapter,
  }) {
    final playableChapters = filterPlayableChapters(detail.chapters);
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => PlayerScreen(
          appState: widget.appState,
          audiobookId: detail.id,
          initialDetail: detail,
          initialChapterId: chapter?.id ??
              (resume
                  ? null
                  : (playableChapters.isEmpty
                      ? null
                      : playableChapters.first.id)),
          initialPositionMs: null,
        ),
      ),
    );
  }

  Future<void> _openSubscription() async {
    unawaited(
      widget.appState.trackAnalyticsEvent(
        'premium_cta_clicked',
        payload: {
          'audiobookId': widget.audiobookId,
          'source': 'detail',
        },
      ),
    );
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => SubscriptionScreen(appState: widget.appState),
      ),
    );
    if (!mounted) {
      return;
    }
    setState(() {
      _detailFuture = _loadDetailState();
    });
  }

  bool _isPremiumLocked(AudiobookDetail detail) {
    final subscription = widget.appState.currentSubscription;
    return detail.premiumFlag &&
        !(subscription?.entitlement.canAccessPremium ?? false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Audiobook detail'),
        actions: [
          IconButton(
            onPressed: () {
              final data = _currentData;
              if (data != null) {
                unawaited(_toggleFavorite(data));
              }
            },
            icon: Icon(_currentData?.isFavorite == true
                ? Icons.favorite
                : Icons.favorite_border),
          ),
        ],
      ),
      body: FutureBuilder<_AudiobookDetailViewData?>(
        future: _detailFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return _StateMessage(
              icon: Icons.error_outline,
              title: 'Không tải được detail',
              description: 'Thử quay lại và mở lại audiobook này.',
              actionLabel: 'Reload',
              onAction: () => setState(() {
                _detailFuture = _loadDetailState();
              }),
            );
          }

          final data = snapshot.data;
          if (data == null) {
            return const _EmptyCard(
              icon: Icons.library_books_outlined,
              title: 'Audiobook không tồn tại',
              description: 'Nội dung này có thể đã bị ẩn hoặc bị xóa.',
            );
          }

          _currentData = data;
          final locked = _isPremiumLocked(data.detail);

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _DetailHeader(detail: data.detail),
              const SizedBox(height: 20),
              LayoutBuilder(
                builder: (context, constraints) {
                  final stacked = constraints.maxWidth < 420;
                  final primaryButton = SizedBox(
                    width: stacked ? double.infinity : null,
                    child: FilledButton(
                      onPressed: locked
                          ? _openSubscription
                          : () =>
                              _openPlayerFromDetail(data.detail, resume: false),
                      child: Text(
                        locked ? 'Upgrade' : 'Start listening',
                      ),
                    ),
                  );
                  final secondaryButton = SizedBox(
                    width: stacked ? double.infinity : null,
                    child: OutlinedButton(
                      onPressed: locked
                          ? null
                          : () =>
                              _openPlayerFromDetail(data.detail, resume: true),
                      child: Text(
                        locked ? 'Premium locked' : 'Continue listening',
                      ),
                    ),
                  );

                  if (stacked) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        primaryButton,
                        const SizedBox(height: 12),
                        secondaryButton,
                      ],
                    );
                  }

                  return Row(
                    children: [
                      Expanded(child: primaryButton),
                      const SizedBox(width: 12),
                      Expanded(child: secondaryButton),
                    ],
                  );
                },
              ),
              const SizedBox(height: 20),
              if (locked)
                _LockNotice(onUpgrade: _openSubscription)
              else if (filterPlayableChapters(data.detail.chapters).isEmpty)
                const _EmptyCard(
                  icon: Icons.queue_music_outlined,
                  title: 'Chưa có chapter phát hành',
                  description:
                      'Chỉ các chapter đã phát hành mới hiển thị trong danh sách.',
                )
              else
                _ChapterList(
                  chapters: filterPlayableChapters(data.detail.chapters),
                  onTap: (chapter) {
                    _openPlayerFromDetail(data.detail,
                        resume: false, chapter: chapter);
                  },
                ),
            ],
          );
        },
      ),
    );
  }
}

class _DetailHeader extends StatelessWidget {
  final AudiobookDetail detail;

  const _DetailHeader({required this.detail});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: _CoverBadge(
                title: detail.title,
                premiumFlag: detail.premiumFlag,
                large: true,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: Text(
                    detail.title,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                if (detail.premiumFlag) const _PremiumBadge(),
              ],
            ),
            const SizedBox(height: 8),
            Text('Author: ${detail.authorName}'),
            const SizedBox(height: 4),
            Text('Narrators: ${detail.narratorNames.join(', ')}'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _InfoPill(label: _formatDuration(detail.durationSec)),
                _InfoPill(label: detail.languageCode.toUpperCase()),
                for (final category in detail.categoryNames)
                  _InfoPill(label: category),
                for (final tag in detail.tagNames) _InfoPill(label: tag),
              ],
            ),
            const SizedBox(height: 16),
            Text(detail.description),
          ],
        ),
      ),
    );
  }
}

class _ChapterList extends StatelessWidget {
  final List<AudiobookChapter> chapters;
  final ValueChanged<AudiobookChapter> onTap;

  const _ChapterList({
    required this.chapters,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionHeader(
              title: 'Chapters',
              subtitle: '${chapters.length} chapter(s)',
            ),
            const SizedBox(height: 12),
            for (final chapter in chapters)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  child: Text('${chapter.orderIndex}'),
                ),
                title: Text(chapter.title),
                subtitle: Text(
                    '${_formatDuration(chapter.durationSec)} ? ${chapter.status}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => onTap(chapter),
              ),
          ],
        ),
      ),
    );
  }
}

class _ContinueListeningCard extends StatelessWidget {
  final ListeningProgress progress;
  final VoidCallback onTap;

  const _ContinueListeningCard({
    required this.progress,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              colors: [
                CloneFanosTokens.primary.withOpacity(0.10),
                theme.colorScheme.surface,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              _CoverBadge(
                title: progress.audiobookTitle,
                premiumFlag: progress.premiumFlag,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Continue listening',
                      style: theme.textTheme.labelLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      progress.audiobookTitle,
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text('${progress.chapterTitle} • ${progress.authorName}'),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: progress.progressFraction,
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_formatPosition(progress.positionMs)} of ${_formatPosition(progress.totalDurationMs)}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroPanel extends StatelessWidget {
  final String title;
  final String description;
  final VoidCallback onSearch;

  const _HeroPanel({
    required this.title,
    required this.description,
    required this.onSearch,
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
              CloneFanosTokens.secondary.withOpacity(0.08),
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
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: CloneFanosTokens.primary,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(Icons.auto_awesome, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Focus-ready catalog',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: CloneFanosTokens.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(title, style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(description, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 16),
            Row(
              children: [
                FilledButton.tonal(
                  onPressed: onSearch,
                  child: const Text('Go to search'),
                ),
                const SizedBox(width: 12),
                Text(
                  'Browse, filter and resume',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _EmptyCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
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
              child: Icon(icon, color: theme.colorScheme.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: theme.textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(description, style: theme.textTheme.bodyMedium),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StateMessage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String actionLabel;
  final VoidCallback onAction;

  const _StateMessage({
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
                  Text(description,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 16),
                  FilledButton.tonal(
                      onPressed: onAction, child: Text(actionLabel)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const _SectionHeader({
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title.toUpperCase(),
          style: theme.textTheme.labelSmall?.copyWith(
            color: CloneFanosTokens.secondary,
            letterSpacing: 0.12,
          ),
        ),
        const SizedBox(height: 6),
        Text(title, style: theme.textTheme.titleLarge),
        const SizedBox(height: 4),
        Text(subtitle, style: theme.textTheme.bodyMedium),
      ],
    );
  }
}

class _RecentSearches extends StatelessWidget {
  final List<String> queries;
  final ValueChanged<String> onTap;

  const _RecentSearches({
    required this.queries,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Recent searches', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: queries
              .map(
                (query) => ActionChip(
                  label: Text(query),
                  onPressed: () => onTap(query),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _PremiumBadge extends StatelessWidget {
  const _PremiumBadge();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.secondaryContainer,
        borderRadius: BorderRadius.circular(999),
      ),
      child: const Padding(
        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Text('Premium'),
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  final String label;

  const _InfoPill({required this.label});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(label),
      ),
    );
  }
}

class _CoverBadge extends StatelessWidget {
  final String title;
  final bool premiumFlag;
  final bool large;

  const _CoverBadge({
    required this.title,
    required this.premiumFlag,
    this.large = false,
  });

  @override
  Widget build(BuildContext context) {
    final initials = title
        .split(RegExp(r'\s+'))
        .where((word) => word.isNotEmpty)
        .take(2)
        .map((word) => word.characters.first)
        .join()
        .toUpperCase();

    final size = large ? 160.0 : 88.0;

    return Stack(
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Theme.of(context).colorScheme.primary,
                Theme.of(context).colorScheme.tertiary,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
          ),
          alignment: Alignment.center,
          child: Text(
            initials,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onPrimary,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ),
        if (premiumFlag)
          Positioned(
            right: 8,
            top: 8,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.65),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Text(
                  'Pro',
                  style: TextStyle(color: Colors.white, fontSize: 11),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _LockNotice extends StatelessWidget {
  final VoidCallback onUpgrade;

  const _LockNotice({required this.onUpgrade});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).colorScheme.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Premium locked'),
            const SizedBox(height: 8),
            const Text('Nội dung này yêu cầu subscription để mở khóa.'),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: onUpgrade,
              child: const Text('Upgrade'),
            ),
          ],
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

void _openDetail(
  BuildContext context, {
  required String audiobookId,
  String source = 'home',
}) {
  unawaited(
    AppScope.of(context).trackAnalyticsEvent(
      source == 'search' ? 'search_result_clicked' : 'audiobook_card_clicked',
      payload: {
        'audiobookId': audiobookId,
        'source': source,
      },
    ),
  );
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => AudiobookDetailScreen(
        appState: AppScope.of(context),
        audiobookId: audiobookId,
      ),
    ),
  );
}

void _openPlayer(
  BuildContext context, {
  required String audiobookId,
  String? chapterId,
  int? positionMs,
}) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => PlayerScreen(
        appState: AppScope.of(context),
        audiobookId: audiobookId,
        initialChapterId: chapterId,
        initialPositionMs: positionMs,
      ),
    ),
  );
}
