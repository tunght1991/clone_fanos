import '../../../app/app_config.dart';
import '../data/http_notification_repository.dart';
import '../data/mock_notification_repository.dart';
import 'notification_models.dart';

abstract class NotificationRepository {
  Future<NotificationHomeData> getHomeData({
    required String? userId,
    required String? accessToken,
  });
}

class NoopNotificationRepository implements NotificationRepository {
  const NoopNotificationRepository();

  @override
  Future<NotificationHomeData> getHomeData({
    required String? userId,
    required String? accessToken,
  }) async {
    return NotificationHomeData.empty();
  }
}

NotificationRepository createNotificationRepository(AppConfig config) {
  if (shouldUseMockRepositories(config)) {
    return MockNotificationRepository();
  }

  return HttpNotificationRepository(baseUri: config.apiBaseUri);
}
