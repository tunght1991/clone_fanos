import '../domain/analytics_models.dart';
import '../domain/analytics_repository.dart';

class RecordedAnalyticsEvent {
  final AnalyticsEvent event;
  final String? userId;
  final String? accessToken;

  const RecordedAnalyticsEvent({
    required this.event,
    required this.userId,
    required this.accessToken,
  });
}

class MockAnalyticsRepository implements AnalyticsRepository {
  final List<RecordedAnalyticsEvent> recordedEvents = [];

  @override
  Future<void> trackEvent({
    required AnalyticsEvent event,
    required String? userId,
    required String? accessToken,
  }) async {
    recordedEvents.add(
      RecordedAnalyticsEvent(
        event: event,
        userId: userId,
        accessToken: accessToken,
      ),
    );
  }
}
