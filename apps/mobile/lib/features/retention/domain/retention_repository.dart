import '../../../app/app_config.dart';
import '../../discovery/domain/discovery_models.dart';
import '../data/http_retention_repository.dart';
import '../data/mock_retention_repository.dart';
import 'retention_models.dart';

abstract class RetentionRepository {
  Future<RetentionHomeData> getHomeData({
    required String? userId,
    required String? accessToken,
  });
}

class NoopRetentionRepository implements RetentionRepository {
  const NoopRetentionRepository();

  @override
  Future<RetentionHomeData> getHomeData({
    required String? userId,
    required String? accessToken,
  }) async {
    return RetentionHomeData.empty();
  }
}

RetentionRepository createRetentionRepository(AppConfig config) {
  if (shouldUseMockRepositories(config)) {
    return MockRetentionRepository();
  }

  return HttpRetentionRepository(baseUri: config.apiBaseUri);
}
