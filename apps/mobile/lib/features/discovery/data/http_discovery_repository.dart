import 'dart:convert';
import 'dart:io';

import '../domain/discovery_models.dart';
import '../domain/discovery_repository.dart';

class HttpDiscoveryRepository implements DiscoveryRepository {
  final Uri baseUri;
  final HttpClient _client;

  HttpDiscoveryRepository({
    required this.baseUri,
    HttpClient? client,
  }) : _client = client ?? HttpClient();

  @override
  Future<BrowseFeed> getBrowseFeed({String? categoryId}) async {
    final response = await _getJson(
      '/audiobooks',
      queryParameters: <String, String>{
        if (categoryId != null) 'categoryId': categoryId,
        'pageSize': '50',
      },
    );
    final items = _parseSummaryList(response['data'] as List<dynamic>? ?? const <dynamic>[]);
    final categories = _buildCategories(items);

    return BrowseFeed(
      categories: categories,
      featured: items.where((item) => item.isFeatured).toList(),
      newReleases: items.where((item) => item.isNew).toList(),
      continueListening: null,
    );
  }

  @override
  Future<SearchPage> searchAudiobooks(DiscoverySearchRequest request) async {
    final response = await _getJson(
      '/search',
      queryParameters: <String, String>{
        'query': request.query,
        'page': request.page.toString(),
        'pageSize': request.pageSize.toString(),
        if (request.categoryId != null) 'categoryId': request.categoryId!,
        if (request.premiumFlag != null) 'premiumFlag': request.premiumFlag!.toString(),
      },
    );

    final meta = response['meta'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    return SearchPage(
      items: _parseSummaryList(response['data'] as List<dynamic>? ?? const <dynamic>[]),
      query: meta['query'] as String? ?? request.query,
      page: meta['page'] as int? ?? request.page,
      pageSize: meta['pageSize'] as int? ?? request.pageSize,
      totalItems: meta['totalItems'] as int? ?? 0,
      totalPages: meta['totalPages'] as int? ?? 0,
      hasNext: meta['hasNext'] as bool? ?? false,
    );
  }

  @override
  Future<AudiobookDetail?> getAudiobookDetail(String audiobookId) async {
    final response = await _getJson('/audiobooks/$audiobookId');
    final data = response['data'] as Map<String, dynamic>? ?? response;
    return _parseDetail(data);
  }

  Future<Map<String, dynamic>> _getJson(
    String path, {
    Map<String, String>? queryParameters,
  }) async {
    final resolvedUri = baseUri.replace(
      path: _joinPaths(baseUri.path, path),
      queryParameters: <String, String>{
        ...baseUri.queryParameters,
        ...?queryParameters,
      },
    );
    final request = await _client.getUrl(resolvedUri);
    final response = await request.close();
    final payload = await utf8.decoder.bind(response).join();

    if (response.statusCode >= 400) {
      throw HttpException('Request failed: ${response.statusCode} $payload');
    }

    if (payload.trim().isEmpty) {
      return <String, dynamic>{};
    }

    return jsonDecode(payload) as Map<String, dynamic>;
  }

  List<AudiobookSummary> _parseSummaryList(List<dynamic> data) {
    return data
        .map((item) => _parseSummary(item as Map<String, dynamic>))
        .whereType<AudiobookSummary>()
        .toList();
  }

  AudiobookSummary _parseSummary(Map<String, dynamic> json) {
    return AudiobookSummary(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      coverImageAssetKey: json['coverImageAssetKey'] as String?,
      authorId: (json['author'] as Map<String, dynamic>?)?['id'] as String? ?? '',
      authorName: (json['author'] as Map<String, dynamic>?)?['name'] as String? ?? '',
      narratorIds: const <String>[],
      narratorNames: const <String>[],
      categoryIds: const <String>[],
      categoryNames: const <String>[],
      tagNames: const <String>[],
      durationSec: json['durationSec'] as int? ?? 0,
      premiumFlag: json['premiumFlag'] as bool? ?? false,
      status: json['status'] as String? ?? 'PUBLISHED',
      isFeatured: false,
      isNew: false,
      languageCode: json['languageCode'] as String? ?? 'vi',
    );
  }

  AudiobookDetail? _parseDetail(Map<String, dynamic> json) {
    if (json.isEmpty) {
      return null;
    }

    final author = json['author'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    final narrators = (json['narrators'] as List<dynamic>? ?? const <dynamic>[])
        .map((item) => item as Map<String, dynamic>)
        .toList();
    final chapters = (json['chapters'] as List<dynamic>? ?? const <dynamic>[])
        .map((item) => item as Map<String, dynamic>)
        .toList();

    return AudiobookDetail(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      coverImageAssetKey: json['coverImageAssetKey'] as String?,
      authorId: author['id'] as String? ?? '',
      authorName: author['name'] as String? ?? '',
      narratorIds: narrators.map((item) => item['id'] as String? ?? '').toList(),
      narratorNames: narrators.map((item) => item['name'] as String? ?? '').toList(),
      categoryIds: const <String>[],
      categoryNames: const <String>[],
      tagNames: const <String>[],
      durationSec: json['durationSec'] as int? ?? 0,
      premiumFlag: json['premiumFlag'] as bool? ?? false,
      status: json['status'] as String? ?? 'PUBLISHED',
      isFeatured: false,
      isNew: false,
      languageCode: json['languageCode'] as String? ?? 'vi',
      chapters: chapters
      .map(
            (item) => AudiobookChapter(
              id: item['id'] as String? ?? '',
              title: item['title'] as String? ?? '',
              orderIndex: item['orderIndex'] as int? ?? 0,
              durationSec: item['durationSec'] as int? ?? 0,
              audioAssetKey: item['audioAssetKey'] as String? ?? '',
              transcript: item['transcript'] as String?,
              status: item['status'] as String? ?? 'PUBLISHED',
            ),
          )
          .toList(),
    );
  }

  List<ContentCategory> _buildCategories(List<AudiobookSummary> items) {
    final counts = <String, int>{};
    final labels = <String, String>{};

    for (final item in items) {
      for (var index = 0; index < item.categoryIds.length; index += 1) {
        final categoryId = item.categoryIds[index];
        counts[categoryId] = (counts[categoryId] ?? 0) + 1;
        labels[categoryId] = item.categoryNames[index];
      }
    }

    return counts.entries
        .map(
          (entry) => ContentCategory(
            id: entry.key,
            name: labels[entry.key] ?? entry.key,
            itemCount: entry.value,
          ),
        )
        .toList();
  }

  String _joinPaths(String basePath, String path) {
    final left = basePath.replaceAll(RegExp(r'/+$'), '');
    final right = path.replaceAll(RegExp(r'^/'), '');
    return '/$left/$right'.replaceAll(RegExp(r'//+'), '/');
  }
}
