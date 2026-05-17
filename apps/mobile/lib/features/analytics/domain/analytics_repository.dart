import '../../../app/app_config.dart';
import 'package:flutter/foundation.dart';

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

AnalyticsRepository createAnalyticsRepository(AppConfig config, {bool? isWeb}) {
  if (shouldUseMockRepositories(config, isWeb: isWeb)) {
    return MockAnalyticsRepository();
  }

  return HttpAnalyticsRepository(baseUri: config.apiBaseUri);
}
