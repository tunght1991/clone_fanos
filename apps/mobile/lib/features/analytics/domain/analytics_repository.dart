import '../../../app/app_config.dart';

import '../data/http_analytics_repository.dart';
import '../data/mock_analytics_repository.dart';
import 'analytics_models.dart';

abstract class AnalyticsRepository {
  Future<void> trackEvent({
    required AnalyticsEvent event,
    required String? userId,
    required String? accessToken,
  });
}

class NoopAnalyticsRepository implements AnalyticsRepository {
  const NoopAnalyticsRepository();

  @override
  Future<void> trackEvent({
    required AnalyticsEvent event,
    required String? userId,
    required String? accessToken,
  }) async {}
}

AnalyticsRepository createAnalyticsRepository(AppConfig config) {
  if (shouldUseMockRepositories(config)) {
    return MockAnalyticsRepository();
  }

  return HttpAnalyticsRepository(baseUri: config.apiBaseUri);
}
