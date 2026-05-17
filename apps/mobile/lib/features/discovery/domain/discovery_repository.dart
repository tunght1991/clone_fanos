import '../../../app/app_config.dart';
import 'package:flutter/foundation.dart';
import 'discovery_models.dart';
import '../data/http_discovery_repository.dart';
import '../data/mock_discovery_repository.dart';

const discoverySearchSortByRelevance = 'relevance';
const discoverySearchSortByTitle = 'title';
const discoverySearchSortByDuration = 'duration';
const discoverySearchSortOrderAsc = 'asc';
const discoverySearchSortOrderDesc = 'desc';

class DiscoverySearchRequest {
  final String query;
  final int page;
  final int pageSize;
  final String? categoryId;
  final bool? premiumFlag;
  final String sortBy;
  final String sortOrder;

  const DiscoverySearchRequest({
    required this.query,
    this.page = 1,
    this.pageSize = 20,
    this.categoryId,
    this.premiumFlag,
    this.sortBy = discoverySearchSortByRelevance,
    this.sortOrder = discoverySearchSortOrderDesc,
  });
}

abstract class DiscoveryRepository {
  Future<BrowseFeed> getBrowseFeed({String? categoryId});

  Future<SearchPage> searchAudiobooks(DiscoverySearchRequest request);

  Future<AudiobookDetail?> getAudiobookDetail(String audiobookId);
}

DiscoveryRepository createDiscoveryRepository(AppConfig config, {bool? isWeb}) {
  if (shouldUseMockRepositories(config, isWeb: isWeb)) {
    return MockDiscoveryRepository();
  }

  return HttpDiscoveryRepository(baseUri: config.apiBaseUri);
}
